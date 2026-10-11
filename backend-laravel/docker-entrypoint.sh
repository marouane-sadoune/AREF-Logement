#!/bin/sh
set -e

# Render routes traffic to the port in $PORT (default 8080)
sed -i "s/^Listen .*/Listen ${PORT:-8080}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT:-8080}>/" /etc/apache2/sites-available/000-default.conf
sed -i "s/DocumentRoot .*/DocumentRoot \/var\/www\/html\/public/" /etc/apache2/sites-available/000-default.conf
sed -i "s|<Directory /var/www/>|<Directory /var/www/html/public>|" /etc/apache2/apache2.conf || true
sed -i "s/AllowOverride None/AllowOverride All/" /etc/apache2/apache2.conf
echo 'ServerName localhost' >> /etc/apache2/apache2.conf

# Wait for the database, then run migrations
for i in $(seq 1 30); do
    if php artisan migrate --force; then
        break
    fi
    echo "Waiting for database... ($i)"
    sleep 2
done

php artisan config:cache || true
php artisan route:cache || true
php artisan event:cache || true

exec "$@"
