#!/bin/sh
set -e

echo "==> Starting Talent-Acquisition Backend..."

echo "==> Waiting for database..."
until php -r "
\$conn = pg_connect('host=db port=5432 dbname=droga_careers user=postgres password=Droga@2025');
if (\$conn) { echo 'connected'; pg_close(\$conn); exit(0); } exit(1);
" 2>/dev/null; do
  echo "Database not ready, retrying in 3 seconds..."
  sleep 3
done
echo "==> Database is ready!"

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Creating storage link..."
php artisan storage:link || true

echo "==> Optimizing..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Starting services..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
