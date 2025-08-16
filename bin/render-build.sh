#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🚀 Starting Render build process..."

# Install Ruby dependencies
echo "📦 Installing Ruby gems..."
bundle install

# Install JavaScript dependencies with bun
echo "📦 Installing JavaScript dependencies..."
bun install

# Precompile assets
echo "🔧 Building JavaScript assets..."
bun run build

echo "🎨 Building CSS assets..."
bun run build:css

echo "🗂️ Precompiling Rails assets..."
bundle exec rails assets:precompile

echo "ℹ️ Skipping DB migrate/seed during build. Migrations will run in postDeploy."

echo "✅ Build process completed successfully!"