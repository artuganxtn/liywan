module.exports = {
  apps: [{
    name: 'alpha-shop-backend',
    script: './backend/src/server.js',
    cwd: '/var/www/alpha-shop',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 8000
    },
    error_file: '/var/www/alpha-shop/logs/backend-error.log',
    out_file: '/var/www/alpha-shop/logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};

