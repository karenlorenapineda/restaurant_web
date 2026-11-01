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

https_port=${PUBLIC_HTTPS_PORT:-443}
case "$https_port" in
  ''|*[!0-9]*) echo "PUBLIC_HTTPS_PORT must be a valid port" >&2; exit 1 ;;
esac
[ "$https_port" -ge 1 ] && [ "$https_port" -le 65535 ]
sed -i "s/__HTTPS_PORT__/$https_port/g" /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
