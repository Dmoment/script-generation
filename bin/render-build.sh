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

# Run database migrations
echo "🗄️ Running database migrations..."
bundle exec rails db:migrate

# Create seed data if needed
echo "🌱 Creating seed data..."
bundle exec rails db:seed

echo "✅ Build process completed successfully!"