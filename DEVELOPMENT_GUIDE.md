# Rails 8 + React Development Guide

## 🚀 Bun in This Project

**Bun** is a fast JavaScript runtime and package manager that's handling:
- **Package Management**: Installing and managing Node.js dependencies 
- **Build Scripts**: Running JavaScript/CSS compilation tasks
- **Task Running**: Executing development and build commands

## 📋 Essential Development Commands

### Starting Development
```bash
# Start all services (Rails server + asset watchers)
bin/dev

# Alternative: Start Rails server only
rails server
```

### Bun Package Management
```bash
# Install new packages
bun add <package-name>           # Add to dependencies
bun add --dev <package-name>     # Add to devDependencies

# Install all dependencies
bun install

# Remove packages
bun remove <package-name>

# Update packages
bun update
```

### Asset Building Commands
```bash
# Build JavaScript once
bun run build

# Build CSS once  
bun run build:css

# Watch for JavaScript changes
bun run build --watch

# Watch for CSS changes
bun run watch:css

# Compile CSS without autoprefixer
bun run build:css:compile

# Run autoprefixer only
bun run build:css:prefix
```

### React Development
```bash
# Add new React packages
bun add <react-package>

# Build React components
bun run build

# Watch for React changes (automatically included in bin/dev)
bun run build --watch
```

## 🔧 Development Workflow

### Daily Development
1. **Start development server**: `bin/dev`
2. **Edit React components** in `app/javascript/components/`
3. **Edit Rails controllers/views** as needed
4. **Assets rebuild automatically** when files change

### Adding New React Components
1. Create component in `app/javascript/components/`
2. Import in `app/javascript/react_app.jsx` or other components
3. Assets rebuild automatically

### Adding New CSS/Styling
1. Edit `app/assets/stylesheets/application.bootstrap.scss`
2. Or add new SCSS files and import them
3. CSS rebuilds automatically with `bin/dev`

## 📁 Key Directories
- `app/javascript/components/` - React components
- `app/javascript/` - JavaScript entry points
- `app/assets/stylesheets/` - SCSS source files
- `app/assets/builds/` - Compiled assets (auto-generated)

## 🐛 Troubleshooting

### CSS Build Issues
- Ensure postcss-cli version is compatible: `bun add --dev postcss-cli@10.1.0`
- Check Node.js version compatibility with bun

### JavaScript Build Issues  
- Check esbuild version: currently using 0.17.19 for Node.js 16 compatibility
- Verify React components have proper JSX syntax

### Server Issues
- Use `bin/dev` instead of `rails server` for full asset pipeline
- Check that all services start in the Procfile.dev