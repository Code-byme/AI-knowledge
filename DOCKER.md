# Docker Guide for AI Knowledge Hub

This guide will help you understand and use Docker with your AI Knowledge Hub project.

## What is Docker?

Docker is a platform that allows you to package applications and their dependencies into containers. Containers are lightweight, isolated environments that run consistently across different machines.

### Key Concepts:
- **Dockerfile**: Instructions for building a Docker image
- **Docker Image**: A snapshot of your application and its dependencies
- **Docker Container**: A running instance of an image
- **docker-compose**: A tool for defining and running multi-container applications

## Project Structure

Your project now includes:
- `Dockerfile` - Build instructions for the Next.js app
- `docker-compose.yml` - Orchestrates the app and PostgreSQL database
- `.dockerignore` - Excludes unnecessary files from the Docker build

## Prerequisites

1. **Install Docker Desktop** (or Docker Engine + Docker Compose)
   - macOS: Download from [docker.com](https://www.docker.com/products/docker-desktop)
   - Linux: Follow [Docker installation guide](https://docs.docker.com/engine/install/)
   - Windows: Download Docker Desktop

2. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

## Quick Start

### 1. Create Environment File

Create a `.env` file in the project root (or copy from `.env.local`):

```bash
# Required
NEXTAUTH_SECRET=your-random-secret-here-generate-with-openssl-rand-base64-32
OPENROUTER_API_KEY=your-openrouter-api-key

# Optional - Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional - Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Generate a secure NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Build and Start Containers

```bash
# Build images and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check running containers
docker-compose ps
```

### 3. Initialize Database

The database will be created automatically, but you need to run the SQL schema:

```bash
# Option 1: Copy SQL files to database container and execute
docker-compose exec postgres psql -U ai_knowledge_user -d ai_knowledge_db -f /docker-entrypoint-initdb.d/postgres-schema.sql

# Option 2: Execute SQL manually
docker-compose exec postgres psql -U ai_knowledge_user -d ai_knowledge_db
# Then run: \i /docker-entrypoint-initdb.d/postgres-schema.sql
```

Or copy your SQL files and execute them:
``  `bash
docker-compose cp sql/postgres-schema.sql postgres:/tmp/schema.sql
docker-compose exec postgres psql -U ai_knowledge_user -d ai_knowledge_db -f /tmp/schema.sql
```

### 4. Access the Application

- **Application**: http://localhost:3000
- **Database**: localhost:5432 (user: `ai_knowledge_user`, password: `ai_knowledge_password`)

## Common Docker Commands

### Building and Running

```bash
# Build the image
docker-compose build

# Start services in background
docker-compose up -d

# Start services and view logs
docker-compose up

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U ai_knowledge_user -d ai_knowledge_db

# Run SQL file
docker-compose exec -T postgres psql -U ai_knowledge_user -d ai_knowledge_db < sql/postgres-schema.sql

# Backup database
docker-compose exec postgres pg_dump -U ai_knowledge_user ai_knowledge_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U ai_knowledge_user -d ai_knowledge_db < backup.sql
```

### Container Management

```bash
# List running containers
docker ps

# Execute command in container
docker-compose exec app sh
docker-compose exec app npm run lint

# View container resource usage
docker stats

# Remove stopped containers
docker-compose rm
```

## Understanding the Dockerfile

The Dockerfile uses a **multi-stage build** pattern:

### Stage 1: `deps`
- Installs system dependencies (Python, build tools)
- Installs Node.js dependencies
- Creates a layer with all npm packages

### Stage 2: `builder`
- Copies source code
- Builds the Next.js application
- Generates production-optimized files

### Stage 3: `runner`
- Creates a minimal production image
- Only includes necessary runtime files
- Runs as non-root user for security
- Exposes port 3000

**Benefits:**
- Smaller final image (only production files)
- Faster builds (dependencies cached separately)
- Better security (non-root user)

## Understanding docker-compose.yml

The compose file defines two services:

### PostgreSQL Service
- Uses official PostgreSQL 16 Alpine image (lightweight)
- Creates persistent volume for data
- Health checks ensure database is ready
- Port 5432 exposed for external access

### Application Service
- Builds from Dockerfile
- Depends on PostgreSQL being healthy
- Mounts `secure-uploads` directory for file persistence
- Environment variables configured
- Port 3000 exposed

### Networks & Volumes
- **Network**: Isolated network for service communication
- **Volume**: Persistent storage for database data

## Development Workflow

### Making Changes

1. **Code Changes**: Edit your source files
2. **Rebuild**: `docker-compose up -d --build`
3. **View Logs**: `docker-compose logs -f app`

### Hot Reload (Development)

For development with hot reload, you might want to mount source code:

```yaml
# In docker-compose.yml, add to app service:
volumes:
  - ./secure-uploads:/app/secure-uploads
  - .:/app  # Mount source code
  - /app/node_modules  # Exclude node_modules
  - /app/.next  # Exclude build files
```

Then run in development mode:
```bash
docker-compose exec app npm run dev
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs app

# Check if port is in use
lsof -i :3000
lsof -i :5432
```

### Database connection issues
```bash
# Verify database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec app node -e "console.log(process.env.DATABASE_URL)"
```

### Permission issues
```bash
# Fix uploads directory permissions
sudo chown -R $USER:$USER secure-uploads
```

### Clean rebuild
```bash
# Remove everything and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

### Security Considerations

1. **Change default passwords** in `docker-compose.yml`
2. **Use secrets management** (Docker secrets, environment files)
3. **Use HTTPS** with a reverse proxy (nginx, Traefik)
4. **Regularly update images**: `docker-compose pull`

### Environment Variables

Never commit `.env` files. Use:
- `.env.example` (template)
- Docker secrets (production)
- Environment variables from your hosting platform

### Resource Limits

Add to services in `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 1G
```

## Next Steps

1. **Learn more**: [Docker Documentation](https://docs.docker.com/)
2. **Optimize**: Research Docker image optimization techniques
3. **CI/CD**: Integrate Docker into your deployment pipeline
4. **Monitoring**: Add monitoring tools (Prometheus, Grafana)

## Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

Happy Dockerizing! 🐳

