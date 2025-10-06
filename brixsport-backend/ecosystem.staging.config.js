module.exports = {
  apps: [
    {
      name: 'brixsport-staging-api',
      script: 'dist/server.js',
      cwd: '/var/www/brixsport-staging/apps/api',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'staging',
        PORT: 4001,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 4001,
      },
      log_file: '/var/log/pm2/brixsport-staging-api.log',
      out_file: '/var/log/pm2/brixsport-staging-api-out.log',
      error_file: '/var/log/pm2/brixsport-staging-api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=512',
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
      name: 'brixsport-staging-analytics',
      script: 'main.py',
      cwd: '/var/www/brixsport-staging/apps/analytics',
      interpreter: 'python3',
      instances: 1,
      exec_mode: 'fork',
      env: {
        PYTHONPATH: '/var/www/brixsport-staging/apps/analytics',
        PORT: 8001,
      },
      env_staging: {
        PYTHONPATH: '/var/www/brixsport-staging/apps/analytics',
        PORT: 8001,
      },
      log_file: '/var/log/pm2/brixsport-staging-analytics.log',
      out_file: '/var/log/pm2/brixsport-staging-analytics-out.log',
      error_file: '/var/log/pm2/brixsport-staging-analytics-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '256M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      autorestart: true,
      watch: false,
    }
  ],
  deploy: {
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/brixsport.git',
      path: '/var/www/brixsport-staging',
      'post-deploy': 'npm ci --production && npm run build && pm2 reload ecosystem.staging.config.js --env staging && pm2 save',
      'pre-setup': 'apt update && apt install git -y'
    }
  }
};
