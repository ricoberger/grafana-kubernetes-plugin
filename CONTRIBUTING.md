# Contributing

Every contribution to the Grafana Kubernetes Plugin is welcome, whether it is
reporting a bug, submitting a fix, proposing new features or becoming a
maintainer. To make contributing to the Grafana Kubernetes Plugin as easy as
possible you will find more details for the development flow in this
documentation.

Please note we have a [Code of Conduct](./CODE_OF_CONDUCT.md), please follow it
in all your interactions with the project.

## Feedback, Issues and Questions

If you encounter any issue or you have an idea to improve, please:

- Search through
  [existing open and closed GitHub Issues](https://github.com/ricoberger/grafana-kubernetes-plugin/issues)
  for the answer first. If you find a relevant topic, please comment on the
  issue.
- If none of the issues are relevant, please add an
  [issue](https://github.com/ricoberger/grafana-kubernetes-plugin/issues).
  Please use the issue templates and provide any relevant information.

If you encounter a security vulnerability, please do not open an issue and
instead report the security vulnerability via
[GitHub](https://github.com/ricoberger/grafana-kubernetes-plugin/security/advisories).

## Adding new Features

When contributing a complex change to the Grafana Kubernetes Plugin, please
discuss the change you wish to make within a Github issue with the owners of
this repository before making the change.

## Development

You'll need to have the following tools set up:

- [Go](https://go.dev/)
- [Mage](https://magefile.org/)
- [Node.js](https://nodejs.org/en)
- [Docker](https://www.docker.com/)

1. Install dependencies

   ```bash
   npm install
   ```

2. Build plugin in development mode and run in watch mode

   ```bash
   npm run dev
   ```

3. Build plugin in production mode

   ```bash
   npm run build
   ```

4. Run the tests (using Jest)

   ```bash
   # Runs the tests and watches for changes, requires git init first
   npm run test

   # Exits after running all the tests
   npm run test:ci
   ```

5. Run the tests (using Mage)

   ```bash
   # Run tests
   go tool mage -v test

   # Run tests and create coverage report ("open coverage/backend.htm")
   go tool mage -v coverage
   ```

6. Build the plugin backend code, rerun this command every time you edit your
   backend files

   ```bash
   go tool mage -v build:linuxARM64
   ```

7. Spin up a Grafana instance and run the plugin inside it (using Docker)

   ```bash
   npm run server
   ```

8. Run the E2E tests (using Playwright)

   ```bash
   # Install E2E test dependencies
   npm exec playwright install chromium

   # Spins up a Grafana instance first that we tests against
   npm run server

   # Starts the tests
   npm run e2e
   ```

9. Run the linter

   ```bash
   npm run lint

   # or

   npm run lint:fix
   ```

# Release

The [release workflow](./.github/workflows/release.yml) handles the creation of
new releases. To trigger the workflow we need to push a version tag to GitHub.
This can be achieved with the following steps:

1. Run `npm version <major|minor|patch>`
2. Run `git push origin main --follow-tags`
