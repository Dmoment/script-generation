const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Check if a key is a valid JavaScript identifier
function isValidIdentifier(key) {
  // JavaScript identifiers must start with letter, $, or _
  // and can contain letters, digits, $, or _
  // Also filter out shell function definitions and other invalid keys
  if (!key || typeof key !== 'string') return false;
  
  // Filter out shell function definitions and keys with invalid characters
  if (key.includes('%') || 
      key.includes('(') || 
      key.includes(')') ||
      key.startsWith('BASH_FUNC_') ||
      key.includes('%%')) {
    return false;
  }
  
  // Must match valid identifier pattern
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
}

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
        const cleanKey = key.trim();
        // Only add valid identifiers
        if (isValidIdentifier(cleanKey)) {
          const value = valueParts.join('=').trim();
          env[cleanKey] = value;
        }
      }
    });
  } else {
    // Fallback to process.env (production - Render, Heroku, etc.)
    console.log('🌍 Loading environment from process.env (production mode)');
    
    // Filter and load only valid environment variables
    // This excludes shell functions and invalid identifiers
    Object.keys(process.env).forEach(key => {
      if (isValidIdentifier(key)) {
        env[key] = process.env[key];
      }
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
    const value = reactEnv[key];
    if (value !== undefined && value !== null) {
      define[`process.env.${key}`] = JSON.stringify(value);
      const preview = typeof value === 'string' && value.length > 20 
        ? `${value.substring(0, 20)}...` 
        : value;
      console.log(`  ✅ ${key}: ${preview}`);
    }
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

