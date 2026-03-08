# This Dockerfile is used to serve the plugin archive via a simple HTTP server,
# so that builds can be tested before an official release is made. It uses
# BusyBox's httpd, which is a lightweight web server.
#
# Before the docker image can be build, the plugin archive must be created, by
# running the following commands:
# - npm run build
# - mage -v
# - cp -r dist ricoberger-kubernetes-app
# - zip -qr ricoberger-kubernetes-app.zip ricoberger-kubernetes-app
# - rm -rf ricoberger-kubernetes-app

FROM busybox:1.37.0

RUN adduser -D static
USER static
WORKDIR /home/static

COPY ricoberger-kubernetes-app.zip .

CMD ["busybox", "httpd", "-f", "-v", "-p", "8080"]
