#!/bin/bash
set -e

echo "Starting Deployment Process..."

# Navigate to project directory
cd /var/www/wacrm

# Pull latest changes
echo "Pulling latest changes from main branch..."
git fetch origin main
git reset --hard origin/main

# Install dependencies
echo "Installing dependencies..."
npm ci --prefer-offline

# Build the application
echo "Building the application..."
npm run build

# Reload PM2 (Zero Downtime)
echo "Reloading PM2 cluster..."
pm2 reload infrastructure/ecosystem.config.js --env production

echo "Deployment Successful!"
