module.exports = {
  apps: [{
    name: 'video-converter',
    script: './dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '4G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      MAX_OLD_SPACE_SIZE: 4096
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    watch: false
  }]
};
