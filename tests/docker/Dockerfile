FROM busybox:1.37.0

RUN adduser -D static
USER static
WORKDIR /home/static

COPY ricoberger-kubernetes-app.zip .

CMD ["busybox", "httpd", "-f", "-v", "-p", "8080"]
