module.exports = {
  apps: [
    {
      name: 'brixsport-api',
      script: 'dist/server.js',
      cwd: '/var/www/brixsport-backend/apps/api',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      log_file: '/var/log/pm2/brixsport-api.log',
      out_file: '/var/log/pm2/brixsport-api-out.log',
      error_file: '/var/log/pm2/brixsport-api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
    },
    {
      name: 'brixsport-analytics',
      script: 'main.py',
      cwd: '/var/www/brixsport-backend/apps/analytics',
      interpreter: 'python3',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        PYTHONPATH: '/var/www/brixsport-backend/apps/analytics',
        PORT: 8000,
      },
      env_production: {
        PYTHONPATH: '/var/www/brixsport-backend/apps/analytics',
        PORT: 8000,
      },
      log_file: '/var/log/pm2/brixsport-analytics.log',
      out_file: '/var/log/pm2/brixsport-analytics-out.log',
      error_file: '/var/log/pm2/brixsport-analytics-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '512M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      autorestart: true,
      watch: false,
    }
  ],
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/brixsport.git',
      path: '/var/www/brixsport-backend',
      'post-deploy': 'npm ci --production && npm run build && pm2 reload ecosystem.production.config.js --env production && pm2 save',
      'pre-setup': 'apt update && apt install git -y'
    }
  }
};
