#!/bin/bash
set -e

DOMAIN="velora-space.ru"
EMAIL="admin@velora-space.ru"
APP_DIR="/opt/velora"

echo "=== Velora Production Deploy ==="

# 1. Update system & install Docker
echo "[1/6] Installing Docker..."
apt-get update
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg 2>/dev/null || true
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
echo "Docker installed."

# 2. Clone repo
echo "[2/6] Cloning repository..."
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git pull
else
    git clone https://github.com/sIburo77/Velora.git "$APP_DIR"
    cd "$APP_DIR"
fi

# 3. Create .env if not exists
echo "[3/6] Setting up environment..."
if [ ! -f .env ]; then
    SECRET=$(openssl rand -hex 32)
    DB_PASS=$(openssl rand -hex 16)
    cat > .env << EOF
SECRET_KEY=$SECRET
DB_PASSWORD=$DB_PASS
SMTP_USER=
SMTP_PASSWORD=
GOOGLE_CLIENT_ID=
EOF
    echo ".env created. Edit it later to add SMTP and Google credentials."
else
    echo ".env already exists, skipping."
fi

# 4. Get SSL certificate
echo "[4/6] Getting SSL certificate..."
# Use init config first (HTTP only)
cp nginx/nginx.init.conf nginx/nginx.prod.conf.bak
cp nginx/nginx.init.conf nginx/nginx.prod.conf

docker compose -f docker-compose.prod.yml up -d nginx

# Request certificate
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot --webroot-path=/var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d "$DOMAIN" -d "www.$DOMAIN"

# Restore real nginx config
cp nginx/nginx.prod.conf.bak nginx/nginx.prod.conf
rm nginx/nginx.prod.conf.bak

docker compose -f docker-compose.prod.yml down

echo "SSL certificate obtained."

# 5. Start everything
echo "[5/6] Starting all services..."
docker compose -f docker-compose.prod.yml up -d --build

# 6. Setup auto-renewal cron
echo "[6/6] Setting up SSL auto-renewal..."
CRON_CMD="0 3 * * * cd $APP_DIR && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload"
(crontab -l 2>/dev/null | grep -v certbot; echo "$CRON_CMD") | crontab -

echo ""
echo "=== Done! ==="
echo "Your site is live at: https://$DOMAIN"
echo ""
echo "Next steps:"
echo "  1. Edit $APP_DIR/.env to add SMTP_USER, SMTP_PASSWORD, GOOGLE_CLIENT_ID"
echo "  2. After editing .env, restart: cd $APP_DIR && docker compose -f docker-compose.prod.yml up -d"
echo ""
