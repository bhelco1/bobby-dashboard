#!/bin/bash
# install-apache-nocache.sh — One-time: tell browsers to re-check the dashboard's
# pages, scripts and data with the Pi on every load, so a deploy shows up at once.
# Unchanged files get a tiny "304 Not Modified", so it costs almost nothing.
#
# Run once from the Mac:  bash scripts/install-apache-nocache.sh
# (asks for the Pi's sudo password)

SERVER="pi@192.168.1.190"

ssh -t "$SERVER" 'set -e
sudo a2enmod -q headers
sudo tee /etc/apache2/conf-available/dashboard-nocache.conf >/dev/null <<CONF
# Installed by bobby-dashboard/scripts/install-apache-nocache.sh
<Directory /var/www/html>
  <FilesMatch "\.(html|js|json)$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</Directory>
CONF
sudo a2enconf -q dashboard-nocache
sudo apache2ctl configtest
sudo systemctl reload apache2
echo "✅ Apache now tells browsers to re-check pages on every load"
curl -sI http://localhost/testing.html | grep -i "cache-control"'
