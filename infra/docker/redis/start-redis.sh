#!/bin/sh
set -eu

: "${REDIS_PASSWORD:?REDIS_PASSWORD must be set}"

if [ "$REDIS_PASSWORD" = "123456" ]; then
  echo "REDIS_PASSWORD must not use the legacy default value" >&2
  exit 1
fi

case "${1:-}" in
  master)
    exec redis-server /etc/redis/redis-master.conf \
      --requirepass "$REDIS_PASSWORD" \
      --masterauth "$REDIS_PASSWORD"
    ;;
  replica)
    exec redis-server /etc/redis/redis-replica.conf \
      --requirepass "$REDIS_PASSWORD" \
      --masterauth "$REDIS_PASSWORD"
    ;;
  sentinel)
    escaped_password=$(printf '%s' "$REDIS_PASSWORD" | sed 's/[\\&|"]/\\&/g')
    sed "s|__REDIS_PASSWORD__|$escaped_password|g" /etc/redis/sentinel.conf > /data/sentinel.conf
    exec redis-server /data/sentinel.conf --sentinel
    ;;
  *)
    echo "Usage: $0 {master|replica|sentinel}" >&2
    exit 64
    ;;
esac
