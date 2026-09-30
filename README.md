# Finora Investment & Insurance CRM

## Project layout

- `frontend/` - Next.js routes, React components, hooks, styles, and browser utilities.
- `backend/` - server actions, authentication, PostgreSQL/Drizzle access, migrations, and seed data.
- `shared/` - types and contracts shared between frontend and backend.

## Development

1. Create a Supabase project and copy its **Session pooler** connection string.
2. Copy `.env.example` to `.env.local` and set `DATABASE_URL`, `DATABASE_SSL=true`, and `BETTER_AUTH_SECRET`.
3. Apply the schema with `npm run migrate`.
4. Start the app with `npm run dev`.

Supabase provides PostgreSQL, so the backend uses its existing Drizzle and `pg` integration. No browser Supabase client is needed for server actions; database credentials remain server-side.
