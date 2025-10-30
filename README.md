AI Knowledge Hub
================

A simple, elegant app to upload your documents and chat with an AI that answers using your private content.

What it does
------------
- Upload documents (TXT, DOC/DOCX, MD, JSON, CSV)
- Chat with an assistant; conversations are saved as history
- See how many documents were used to answer
- Files are stored securely outside the public web root

How to run
----------
1) Install dependencies
```bash
npm i
```
2) Create `.env.local`
```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
OPENROUTER_API_KEY=your_openrouter_api_key
```
3) Set up the database using the SQL in `sql/`
4) Start the app
```bash
npm run dev
# open http://localhost:3000
```

Built with Next.js, Tailwind, shadcn/ui, NextAuth, PostgreSQL, and OpenRouter.
