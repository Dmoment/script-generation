# Script Generation Platform

A full-stack application for script writing and management, built with Rails 8 API backend and React frontend.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Development Workflow](#api-development-workflow)
- [Project Structure](#project-structure)
- [Key Technologies](#key-technologies)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Ruby** 3.3.4 (recommended: use [rbenv](https://github.com/rbenv/rbenv) or [rvm](https://rvm.io/))
- **PostgreSQL** 12+ (for database)
- **Node.js** 18+ and **Bun** (for JavaScript dependencies)
- **Bundler** (Ruby gem manager)
- **Auth0 Account** (for authentication)

## Local Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd script-generation
```

### 2. Install Ruby Dependencies

```bash
bundle install
```

### 3. Install JavaScript Dependencies

```bash
bun install
```

### 4. Setup Database

```bash
# Create and setup database
rails db:create
rails db:migrate
rails db:seed  # Optional: Load sample data
```

### 5. Environment Configuration

#### Frontend Environment (`.env.react`)

Create `.env.react` file in the root directory:

```bash
cp env.react.example .env.react
```

Edit `.env.react` with your Auth0 credentials:

```bash
AUTH0_DOMAIN=your-auth0-domain.us.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_AUDIENCE=https://your-auth0-domain.us.auth0.com/api/v2/
```

**Note:** This file is used at **compile-time** by esbuild and values are embedded in the JavaScript bundle.

#### Backend Environment (`.env.development.local`)

Create `.env.development.local` file in the root directory:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-auth0-domain.us.auth0.com
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=https://your-auth0-domain.us.auth0.com/api/v2/

# AWS S3 Configuration (Optional - for file uploads)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=script-generation-development

# Database (if not using default PostgreSQL settings)
DATABASE_URL=postgresql://user:password@localhost/script_generation_development
```

**Note:** This file is used at **runtime** by Rails and should never be committed to git (already in `.gitignore`).

### 6. Run the Application

```bash
# Start both Rails server and asset watchers
bin/dev
```

Or use the setup script:

```bash
bin/setup
```

The application will be available at `http://localhost:3000`

## API Development Workflow

When creating or modifying API endpoints, you need to regenerate TypeScript types for the frontend.

### After Creating/Modifying API Endpoints

1. **Generate OpenAPI Specification**

   ```bash
   rails api:generate_spec
   ```

   This generates `public/api-spec-generated.json` from your Grape API definitions.

2. **Generate TypeScript Types and Client**

   ```bash
   bun run generate:api-types
   ```

   This command:
   - Runs `rails api:generate_spec` to generate the OpenAPI spec
   - Uses `openapi-ts` to generate TypeScript types and fetch client
   - Outputs to `app/javascript/types/generated/`

3. **Alternative: Generate from Running Server**

   If your server is running, you can generate types directly from the Swagger endpoint:

   ```bash
   bun run generate:api-types:remote
   ```

   This reads from `http://localhost:3000/api/v1/swagger_doc.json`

### Using Generated Types in Frontend

The generated types are available in:

```typescript
import { request } from '../types/generated/core/request';
import { OpenAPI } from '../types/generated/core/OpenAPI';
import type { Script, Project } from '../types/generated';
```

Example usage:

```typescript
import { request } from '../types/generated/core/request';
import { OpenAPI } from '../types/generated/core/OpenAPI';

const response = await request<Script>(OpenAPI, {
  method: 'GET',
  url: '/v1/scripts',
  mediaType: 'application/json',
});
```

### Important Notes

- **Always run `bun run generate:api-types` after modifying API endpoints**
- The generated types are committed to git (unlike `.env` files)
- If you see TypeScript errors about missing types, regenerate the API types
- The OpenAPI spec is generated from Grape API documentation blocks

## Project Structure

```
script-generation/
├── app/
│   ├── api/                    # Grape API endpoints
│   │   ├── v1/                 # API version 1
│   │   └── base_api.rb         # Base API class with auth & helpers
│   ├── javascript/             # React frontend
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── queries/            # React Query hooks
│   │   └── types/              # TypeScript types
│   │       └── generated/      # Auto-generated from OpenAPI
│   ├── models/                 # ActiveRecord models
│   ├── policies/               # Pundit authorization policies
│   └── services/               # Service objects (business logic)
├── config/
│   ├── routes.rb               # Rails routes
│   └── storage.yml             # ActiveStorage configuration
├── db/
│   ├── migrate/                # Database migrations
│   └── seeds.rb                # Seed data
└── public/
    └── api-spec-generated.json # Generated OpenAPI spec
```

## Key Technologies

### Backend

- **Rails 8** - Ruby web framework
- **Grape** - RESTful API framework
- **PostgreSQL** - Database
- **Pundit** - Authorization
- **ActiveStorage** - File uploads (S3 or local)
- **Ransack** - Advanced search/filtering
- **Kaminari** - Pagination

### Frontend

- **React 19** - UI library
- **TypeScript** - Type safety
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Auth0 React SDK** - Authentication
- **Tailwind CSS** - Styling
- **Bootstrap Icons** - Icons

### Development Tools

- **esbuild** - JavaScript bundler
- **openapi-ts** - OpenAPI to TypeScript generator
- **Bun** - JavaScript runtime and package manager

## Common Commands

```bash
# Database
rails db:migrate              # Run migrations
rails db:rollback             # Rollback last migration
rails db:reset                # Drop, create, migrate, seed
rails db:seed                 # Load seed data

# API Development
rails api:generate_spec       # Generate OpenAPI spec
bun run generate:api-types    # Generate TypeScript types

# Development
bin/dev                       # Start Rails + asset watchers
bin/rails console             # Rails console
bin/rails routes              # List all routes

# Testing
rails test                    # Run tests
bun run typecheck             # TypeScript type checking
```

## Troubleshooting

### TypeScript Errors After API Changes

If you see TypeScript errors about missing types or properties:

```bash
bun run generate:api-types
```

### Database Connection Issues

Ensure PostgreSQL is running and check `config/database.yml` or `DATABASE_URL` environment variable.

### Auth0 Authentication Issues

Verify your `.env.react` and `.env.development.local` files have correct Auth0 credentials.

### File Upload Issues

- For local development: ActiveStorage uses local disk storage by default
- For S3: See [S3 Setup Guide](./docs/S3_SETUP.md)
- Check `config/storage.yml` and environment variables

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and type checking: `rails test && bun run typecheck`
4. Regenerate API types if you modified endpoints: `bun run generate:api-types`
5. Commit and push your changes
6. Create a pull request

## License

[Add your license information here]
