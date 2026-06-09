# SETTING UP PROJECT

# THIS PROJECT IS MADE USING THE FOLLOWING TECHNOLOGIES
- ExpressJS
- PostgreSQL
- Prisma ORM
- ReactJS

# Setup node project
    
    - Run:
        - npm init -y
        - npm install express jsonwebtoken prisma @prisma/client dotenv cors (package dependencies)
        - npm install -D typescript ts-node @types/express @types/node @types/cors nodemon (dev dependencies)
        - npx tsc --init (initialize typescript)
        - npx prisma init (initialize prisma)

# Notes that wouldn't hurt if read
tsconfig.json
This is the TypeScript compiler configuration. The key settings you'll care about:

target — what JS version to compile down to (e.g., ES2020). Determines which modern syntax is kept vs. transpiled.
module — the module system for output (commonjs for Node, since Node traditionally uses require()).
outDir — where compiled .js files go (typically ./dist).
rootDir — where your source .ts files live (typically ./src).
strict — enables all strict type-checking options. This is the big one — it catches bugs at compile time that would otherwise blow up at runtime.
esModuleInterop — lets you write import express from 'express' instead of import * as express from 'express'. Quality of life thing.
skipLibCheck — skips type-checking of .d.ts files from node_modules, speeds up compilation.

Everything else in the generated file is mostly fine as defaults. You'll just want to set outDir, rootDir, and make sure strict is true.
prisma/schema.prisma (not prisma.config.ts)
When you run npx prisma init, it creates prisma/schema.prisma — not a .ts file. It's Prisma's own DSL (domain-specific language). It has three main sections:

datasource — tells Prisma which database to connect to and pulls the connection string from your .env.
generator — tells Prisma to generate the TypeScript client you'll import in your code.
models — this is where you define your tables. Each model maps to a PostgreSQL table, and Prisma generates fully typed queries from them.

So when you write prisma.user.findMany(), Prisma knows exactly what fields exist and what types they return — all auto-generated from your schema.
Why TypeScript instead of plain JS?
You can use plain JS with Prisma, but you'd be throwing away the biggest advantage. With TypeScript, every database query is fully typed. If your User model has email: String, then prisma.user.findMany() returns objects where email is typed as string. Typos, wrong field names, bad query shapes — all caught before your code even runs.

dev — runs your server with nodemon + ts-node, so file changes auto-restart and .ts files run directly without a manual compile step. This is your daily driver during development.
build — compiles all your .ts files into .js in the dist/ folder. You run this before deploying.
start — runs the compiled JS in production. No ts-node overhead, just plain Node.
prisma:migrate — creates and applies database migrations when you change your schema. Think of it like version control for your database structure.
prisma:generate — regenerates the Prisma client after schema changes so your types stay in sync.
prisma:studio — opens a browser-based GUI to view and edit your database data. Super handy for debugging.