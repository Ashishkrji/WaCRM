# Deployment Guide — WaCRM Enterprise

This document provides step-by-step instructions for deploying WaCRM to production environments.

---

## 🚢 Option A: Deploying on Vercel (Serverless Next.js Hosting)

Vercel is the easiest path for hosting the frontend application and serverless api endpoints:

1.  **Fork / Push Code**: Push your repository code to a private GitHub, GitLab, or Bitbucket repository.
2.  **Add New Project**: Open Vercel dashboard, click **Add New > Project**, and select your repository.
3.  **Environment Variables**: In the configuration panel, inject the required environment variables:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY` (Required for webhook bypass & RAG writing)
    *   `ENCRYPTION_KEY` (64-character hex encryption string)
    *   `AI_PROVIDER` (e.g. `nvidia` or `gemini`)
    *   `NVIDIA_API_KEY` (or the key corresponding to your selected AI provider)
    *   `NEXT_PUBLIC_SITE_URL` (Set to your Vercel deployment URL, e.g. `https://crm.yourbrand.com`)
4.  **Deploy**: Click **Deploy**. Vercel compiles the Turbopack production bundle automatically.

---

## 💜 Option B: Deploying on Hostinger VPS (Ubuntu/Linux + Nginx + PM2)

For absolute control and maximum API execution performance, deploy to an Ubuntu VPS:

### Step 1: Install Node.js, PM2, and Nginx
Connect to your VPS via SSH and install dependencies:
```bash
# Update repositories
sudo apt update && sudo apt upgrade -y

# Install Node.js v20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v && npm -v

# Install PM2 globally to manage background Node services
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Step 2: Clone and Configure App
```bash
# Clone the repository
git clone https://github.com/Ashishkrji/WaCRM.git /var/www/wacrm
cd /var/www/wacrm

# Copy and edit local environment variables
cp .env.local.example .env.local
nano .env.local
```
*(Enter your Supabase credentials, Encryption Key, and LLM provider keys. Press `Ctrl + O` and `Ctrl + X` to save).*

### Step 3: Install & Build App
```bash
# Install dependencies
npm install

# Compile production build
npm run build
```

### Step 4: Manage Next.js Service via PM2
```bash
# Launch Next.js production server
pm2 start npm --name "wacrm-prod" -- start

# Configure PM2 to start automatically on system boot
pm2 save
pm2 startup
```

### Step 5: Configure Nginx Reverse Proxy
```bash
# Create Nginx site file
sudo nano /etc/nginx/sites-available/wacrm
```
Paste the following reverse-proxy template:
```nginx
server {
    listen 80;
    server_name crm.yourdomain.com; # Replace with your domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/wacrm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Secure with SSL (Certbot)
Meta Webhooks require an HTTPS URL. Secure your domain:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d crm.yourdomain.com
```

---

## 🐋 Option C: Deploying with Docker

If you prefer containerized runtimes, compile the app using the provided `Dockerfile` and `docker-compose.yml`:

### Step 1: Prepare environment file
Create a production `.env` file in the root directory:
```bash
cp .env.local.example .env
nano .env
```
*(Populate all credentials).*

### Step 2: Spin Up Containers
```bash
# Build and run the app in detached background mode
docker compose up -d --build
```

### Step 3: Monitor Logs
```bash
# Inspect container activity logs
docker compose logs -f wacrm
```
The application will boot up and bind to port `3000` of the host system.
Proxy public traffic to `http://localhost:3000` using Nginx, Cloudflare Tunnels, or an ALB.

---

## 🗃️ MongoDB Atlas & Vector Search Setup

For the AI memory, logs, prompt templates, and semantic RAG search features, configure a MongoDB Atlas cluster:

### Step 1: Create a MongoDB Atlas Account
1. Sign up on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Deploy a new cluster (the free M0 tier is fully supported).
3. Under **Database Access**, create a user with read/write privileges.
4. Under **Network Access**, whitelist your Vercel/VPS production IPs or `0.0.0.0/0` for serverless environments.
5. In your cluster dashboard, click **Connect > Connect your application** and copy the connection URI. Set it as `MONGODB_URI` in your environment variables.

### Step 2: Configure the Vector Search Index
For retrieval augmented generation (RAG) to query relevant chunks using embeddings, you must create a Vector Search Index on the `knowledge_embeddings` collection:
1. Navigate to **Atlas Search** in your cluster management panel.
2. Click **Create Search Index** and select **JSON Editor** under **Atlas Vector Search**.
3. Select the target database name (e.g. `WaCRM`) and `knowledge_embeddings` collection.
4. Paste the following index definition:
   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "numDimensions": 1024,
         "similarity": "cosine"
       },
       {
         "type": "filter",
         "path": "user_id"
       }
     ]
   }
   ```
5. Name the index `vector_index` and click **Create Search Index**. The status will show as "Building" and switch to "Active" once indexing is complete.

