module.exports = {
  apps: [
    {
      name: 'wacrm-production',
      script: 'server.js', // Built by Next.js standalone mode
      cwd: '/var/www/wacrm/.next/standalone',
      instances: 'max', // Cluster mode
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      error_file: '/var/log/wacrm/err.log',
      out_file: '/var/log/wacrm/out.log',
      merge_logs: true,
      max_memory_restart: '1G', // Prevent memory leaks from taking down the server
      wait_ready: true, // Enable zero-downtime reloads
      listen_timeout: 10000, // Wait 10s for the app to be ready before killing the old one
    },
  ],
};
