#!/usr/bin/env sh
set -e

# Replace env placeholders in config.template.json -> /usr/share/nginx/html/config.json
: "${BFF_URL:=http://localhost:8080}"

envsubst < /usr/share/nginx/html/config.template.json > /usr/share/nginx/html/config.json
exec nginx -g 'daemon off;'
