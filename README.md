AI Knowledge Hub
================

A simple, elegant app to upload your documents and chat with an AI that answers using your private content.

What it does
------------
- Upload documents (TXT, DOC/DOCX, MD, JSON, CSV)
- Chat with an assistant; conversations are saved as history
- See how many documents were used to answer

How to run
----------

## Option 1: Using Docker (Recommended)

1) **Install Docker Desktop** from [docker.com](https://www.docker.com/products/docker-desktop)

2) **Create `.env` file** in the project root:
```bash
NEXTAUTH_SECRET=$(openssl rand -base64 32)
OPENROUTER_API_KEY=your_openrouter_api_key
```

3) **Start with Docker Compose**:
```bash
docker-compose up -d
```

4) **Initialize the database**:
```bash
# Copy SQL file to container and execute
docker-compose cp sql/postgres-schema.sql postgres:/tmp/schema.sql
docker-compose exec postgres psql -U ai_knowledge_user -d ai_knowledge_db -f /tmp/schema.sql
```

5) **Access the app**: http://localhost:3000

For detailed Docker instructions, see [DOCKER.md](./DOCKER.md)

## Option 2: Local Development

1) **Install dependencies**
```bash
npm i
```
2) **Create `.env.local`**
```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
OPENROUTER_API_KEY=your_openrouter_api_key
```
3) **Set up the database** using the SQL in `sql/`
4) **Start the app**
```bash
npm run dev
# open http://localhost:3000
```

Built with Next.js, Tailwind, shadcn/ui, NextAuth, PostgreSQL, and OpenRouter.
