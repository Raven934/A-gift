FROM php:8.2-fpm

# Install system dependencies & required PHP extensions
RUN apt-get update && apt-get install -y \
    git zip unzip libpng-dev libonig-dev libxml2-dev libzip-dev \
    && docker-php-ext-install pdo_mysql mbstring gd zip bcmath

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

# Install dependencies without running post-install scripts during build
RUN composer install --no-dev --optimize-autoloader --no-scripts

EXPOSE 10000

CMD php artisan serve --host=0.0.0.0 --port=10000