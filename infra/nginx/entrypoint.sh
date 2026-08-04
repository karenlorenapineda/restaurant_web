#!/bin/sh

set -eu

certificate_directory=/etc/nginx/certs
certificate_file="$certificate_directory/localhost.crt"
private_key_file="$certificate_directory/localhost.key"

mkdir -p "$certificate_directory"

if [ ! -s "$certificate_file" ] || [ ! -s "$private_key_file" ]; then
  openssl req \
    -x509 \
    -nodes \
    -newkey rsa:2048 \
    -days 365 \
    -keyout "$private_key_file" \
    -out "$certificate_file" \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

  chmod 600 "$private_key_file"
fi

exec nginx -g 'daemon off;'
