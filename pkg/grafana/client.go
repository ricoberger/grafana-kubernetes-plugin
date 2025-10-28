package grafana

//go:generate go tool mockgen -source=client.go -destination=./client_mock.go -package=grafana Client

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/go-openapi/strfmt"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	goapi "github.com/grafana/grafana-openapi-client-go/client"
	"github.com/grafana/grafana-openapi-client-go/client/service_accounts"
	"github.com/grafana/grafana-openapi-client-go/client/users"
	"github.com/grafana/grafana-openapi-client-go/models"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/tracing"
	"github.com/hashicorp/golang-lru/v2/expirable"
	"go.opentelemetry.io/otel/codes"
)

const (
	serviceAccountPrefix = "kubernetes-"
)

type Client interface {
	GetUrl() *url.URL
	GetImpersonateUser(ctx context.Context, headers http.Header) (string, error)
	GetImpersonateGroups(ctx context.Context, headers http.Header) ([]string, error)
	CreateUserToken(ctx context.Context, user string, tokenTTL int64) (string, error)
}

type client struct {
	impersonateUser      bool
	impersonateGroups    bool
	appUrl               *url.URL
	client               *goapi.GrafanaHTTPAPI
	usersCache           *expirable.LRU[int64, string]
	serviceAccountsCache *expirable.LRU[int64, string]
	groupsCache          *expirable.LRU[string, []string]
}

func NewClient(ctx context.Context, impersonateUser, impersonateGroups bool, username, password string) (Client, error) {
	pCtx := backend.PluginConfigFromContext(ctx)

	grafanaAppUrl, err := pCtx.GrafanaConfig.AppURL()
	if err != nil {
		return nil, err
	}

	parsedGrafanaAppUrl, err := url.Parse(grafanaAppUrl)
	if err != nil {
		return nil, err
	}

	// Create a cache for users, service accounts and groups. The caches are
	// used in the "GetImpersonateUser" and "GetImpersonateGroup" functions, to
	// improve the request latency and to reduce the number of requests against
	// the Grafana API when the impersonate users / impersonate groups feature
	// is enabled.
	//
	//	- The users cache caches the user name based on the user id. The cache
	//	  can contain 1000 entries and each entry is valid for 24 hours, because
	//	  this data shouldn't change often.
	//	- The service accounts cache caches the user name based on the service
	//	  account id. The cache can contain 1000 entries and each entry is valid
	//	  for 24 hours, because this data shouldn't change often.
	//	- The groups cache caches the groups of a user based on the user name.
	//	  The cache can contain 100 entries which are valid for 1 hour, because
	//	  the data can change more often.
	usersCache := expirable.NewLRU[int64, string](100, nil, 60*time.Minute)
	serviceAccountsCache := expirable.NewLRU[int64, string](100, nil, 60*time.Minute)
	groupsCache := expirable.NewLRU[string, []string](100, nil, 60*time.Minute)

	return &client{
		impersonateUser:   impersonateUser,
		impersonateGroups: impersonateGroups,
		appUrl:            parsedGrafanaAppUrl,
		client: goapi.NewHTTPClientWithConfig(strfmt.Default, &goapi.TransportConfig{
			Host:      parsedGrafanaAppUrl.Host,
			BasePath:  strings.TrimLeft(parsedGrafanaAppUrl.Path+"/api", "/"),
			Schemes:   []string{parsedGrafanaAppUrl.Scheme},
			BasicAuth: url.UserPassword(username, password),
			OrgID:     pCtx.OrgID,
		}),
		usersCache:           usersCache,
		serviceAccountsCache: serviceAccountsCache,
		groupsCache:          groupsCache,
	}, nil
}

func (c *client) GetUrl() *url.URL {
	return c.appUrl
}

// GetImpersonateUser returns the user name when the impersonate user feature or
// impersonate groups feature is enabled, otherwiese an empty string is
// returned.
//
// The impersonate user must also be retunred when the impersonate groups
// feature is enabled, because otherwise the user would have the access rights
// of the Kubeconfig used for the data source, when the user is not in a group.
func (c *client) GetImpersonateUser(ctx context.Context, headers http.Header) (string, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "GetImpersonateUser")
	defer span.End()

	if !c.impersonateUser && !c.impersonateGroups {
		return "", nil
	}

	return c.getUser(ctx, headers)
}

// getUser returns the user name based on the Grafana user sign in token header
// ("X-Grafana-Id"). The token in the header can be related to a user or a
// service account. If the token is related to a user or a service account is
// defined in the "type" claim.
//
// If the token is related to a user the id of the user can be extracted from
// the subject claim, by removing the "user:" prefix. If the token is related to
// a service account, the id of the service account can be extracted from the
// subject claim by removing the "service-account:" prefix.
func (c *client) getUser(ctx context.Context, headers http.Header) (string, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "getUser")
	defer span.End()

	var claims jwt.MapClaims

	_, _, err := jwt.NewParser().ParseUnverified(headers.Get(backend.GrafanaUserSignInTokenHeaderName), &claims)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	tokenSubject, err := claims.GetSubject()
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	tokenType, okTokenType := claims["type"].(string)
	if !okTokenType {
		err := fmt.Errorf("failed to get token type")
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	switch tokenType {
	case "user":
		userId, err := strconv.ParseInt(strings.TrimPrefix(tokenSubject, "user:"), 10, 64)
		if err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return "", err
		}

		return c.getUserByUserId(ctx, userId)
	case "service-account":
		userId, err := strconv.ParseInt(strings.TrimPrefix(tokenSubject, "service-account:"), 10, 64)
		if err != nil {
			span.RecordError(err)
			span.SetStatus(codes.Error, err.Error())
			return "", err
		}

		return c.getUserByServiceAccountId(ctx, userId)
	default:
		err := fmt.Errorf("invalid token type")
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}
}

// getUserByUserId returns the user name of a user with the provided id. If the
// users cache contains the provided id, the user is returned from the cache,
// otherwise the Grafana API is used to get the user name.
func (c *client) getUserByUserId(ctx context.Context, id int64) (string, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "getUserByUserId")
	defer span.End()

	if value, ok := c.usersCache.Get(id); ok {
		return value, nil
	}

	res, err := c.client.Users.GetUserByIDWithParams(&users.GetUserByIDParams{
		UserID:  id,
		Context: ctx,
	})
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	if !res.IsSuccess() {
		err := fmt.Errorf("failed to get user: %s", res.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	user := res.Payload.Login
	c.usersCache.Add(id, user)
	return user, nil
}

// getUserByServiceAccountId returns the user name of a user based on the
// provided service account id. If the service accounts cache contains the id
// the user is returned from the cache, otherwise we get the service account
// from the Grafana API. The user name is then the service account name without
// the service account prefix.
func (c *client) getUserByServiceAccountId(ctx context.Context, id int64) (string, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "getUserByServiceAccountId")
	defer span.End()

	if value, ok := c.serviceAccountsCache.Get(id); ok {
		return value, nil
	}

	res, err := c.client.ServiceAccounts.RetrieveServiceAccountWithParams(&service_accounts.RetrieveServiceAccountParams{
		ServiceAccountID: id,
		Context:          ctx,
	})
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	if !res.IsSuccess() {
		err := fmt.Errorf("failed to get service account: %s", res.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	user := strings.TrimPrefix(res.Payload.Name, serviceAccountPrefix)
	c.serviceAccountsCache.Add(id, user)
	return user, nil
}

// GetImpersonateGroups returns the groups of a user. If the impersonate groups
// feature is disabled an empty slice is returned. To get the groups, we have to
// get the user first, afterwards we can get the teams of the user from the
// Grafana API and create the groups slice. If the groups cache already contains
// an entry for the user name, the groups are returned from the cache.
func (c *client) GetImpersonateGroups(ctx context.Context, headers http.Header) ([]string, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "GetImpersonateGroups")
	defer span.End()

	if !c.impersonateGroups {
		return nil, nil
	}

	user, err := c.getUser(ctx, headers)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	if val, ok := c.groupsCache.Get(user); ok {
		return val, nil
	}

	getUserRes, err := c.client.Users.GetUserByLoginOrEmailWithParams(&users.GetUserByLoginOrEmailParams{
		LoginOrEmail: user,
		Context:      ctx,
	})
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	if !getUserRes.IsSuccess() {
		err := fmt.Errorf("failed to get user: %s", getUserRes.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	getTeamsRes, err := c.client.Users.GetUserTeamsWithParams(&users.GetUserTeamsParams{
		UserID:  getUserRes.Payload.ID,
		Context: ctx,
	})
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	if !getTeamsRes.IsSuccess() {
		err := fmt.Errorf("failed to get teams: %s", getTeamsRes.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	var groups []string
	for _, team := range getTeamsRes.Payload {
		groups = append(groups, team.Name)
	}

	c.groupsCache.Add(user, groups)

	return groups, nil
}

// CreateUserToken creates a service account token for the provided user which
// is valid for the provided ttl. The service account we use to create the token
// is the service account prefix + the user name. If no service account with
// this name exists a new service account is created.
func (c *client) CreateUserToken(ctx context.Context, user string, tokenTTL int64) (string, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "GetImpersonateGroups")
	defer span.End()

	serviceAccount, err := c.getServiceAccount(ctx, serviceAccountPrefix+user)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	return c.createToken(ctx, tokenTTL, serviceAccount)
}

func (c *client) getServiceAccount(ctx context.Context, user string) (*models.ServiceAccountDTO, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "GetImpersonateGroups")
	defer span.End()

	getRes, err := c.client.ServiceAccounts.SearchOrgServiceAccountsWithPaging(&service_accounts.SearchOrgServiceAccountsWithPagingParams{
		Page:    int64Ptr(1),
		Perpage: int64Ptr(100),
		Query:   &user,
		Context: ctx,
	})
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	if !getRes.IsSuccess() {
		err := fmt.Errorf("failed to get service accounts: %s", getRes.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	for _, sa := range getRes.Payload.ServiceAccounts {
		if sa.Name == user {
			return sa, nil
		}
	}

	createRes, err := c.client.ServiceAccounts.CreateServiceAccount(&service_accounts.CreateServiceAccountParams{
		Body: &models.CreateServiceAccountForm{
			IsDisabled: false,
			Name:       user,
			Role:       "Viewer",
		},
		Context: ctx,
	})
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	if !createRes.IsSuccess() {
		err := fmt.Errorf("failed to create service account: %s", createRes.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return nil, err
	}

	return createRes.Payload, nil
}

func (c *client) createToken(ctx context.Context, tokenTTL int64, sa *models.ServiceAccountDTO) (string, error) {
	ctx, span := tracing.DefaultTracer().Start(ctx, "GetImpersonateGroups")
	defer span.End()

	name, err := uuid.NewV7()
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	res, err := c.client.ServiceAccounts.CreateToken(&service_accounts.CreateTokenParams{
		Body: &models.AddServiceAccountTokenCommand{
			Name:          name.String(),
			SecondsToLive: tokenTTL,
		},
		ServiceAccountID: sa.ID,
		Context:          ctx,
	})
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	if !res.IsSuccess() {
		err := fmt.Errorf("failed to create token: %s", res.Error())
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())
		return "", err
	}

	return res.Payload.Key, nil
}
