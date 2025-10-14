module.exports = {
  apps: [
    {
      name: 'hmau-vote-api',
      script: './api/server.cjs',
      cwd: '/var/www/hmau-vote',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/voting?schema=public'
      },
      error_file: '/var/www/hmau-vote/logs/pm2-error.log',
      out_file: '/var/www/hmau-vote/logs/pm2-out.log',
      log_file: '/var/www/hmau-vote/logs/pm2-combined.log',
      time: true
    }
  ]
};
