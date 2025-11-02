const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.react (frontend-specific)
// Falls back to process.env if file doesn't exist (for production builds)
function loadReactEnv() {
  const envPath = path.resolve(__dirname, '.env.react');
  const env = {};

  // Try to load from .env.react file (development)
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) return;
      
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        env[key.trim()] = value;
      }
    });
  } else {
    // Fallback to process.env (production - Render, Heroku, etc.)
    console.log('🌍 Loading environment from process.env (production mode)');
    
    // Load all environment variables from process.env
    // Only the ones you set in Render will be available
    Object.keys(process.env).forEach(key => {
      env[key] = process.env[key];
    });
  }

  return env;
}

// Build define object for esbuild
function buildDefine() {
  const reactEnv = loadReactEnv();
  const define = {};

  // Convert each env var to process.env.KEY format
  Object.keys(reactEnv).forEach(key => {
    define[`process.env.${key}`] = JSON.stringify(reactEnv[key]);
    console.log(`  ✅ ${key}: ${reactEnv[key].substring(0, 20)}...`);
  });

  return define;
}

// esbuild configuration
const config = {
  entryPoints: [
    'app/javascript/application.js',
    'app/javascript/react_app.jsx'
  ],
  bundle: true,
  sourcemap: true,
  format: 'esm',
  outdir: 'app/assets/builds',
  publicPath: '/assets',
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.jsx': 'jsx',
    '.js': 'jsx'
  },
  define: buildDefine(),
  logLevel: 'info'
};

// Check if watch mode is enabled
const isWatch = process.argv.includes('--watch');

if (isWatch) {
  // Watch mode - keeps running and rebuilds on file changes
  esbuild.context(config).then(ctx => {
    ctx.watch();
    console.log('👀 Watching for changes...');
  }).catch(() => process.exit(1));
} else {
  // Build once and exit
  esbuild.build(config).catch(() => process.exit(1));
}

