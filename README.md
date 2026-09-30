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

## Staff and customer access

Staff profiles link to existing Better Auth users. A signed-in account without a profile is provisioned as an active Relationship Manager on first protected access; Managers and Admins can edit profile details. Roles are stored on the existing user record; passwords and auth tokens are never copied to the staff profile. The Staff form cannot grant roles. Only an Admin can change an employee role.

The first management account must be promoted once in Supabase SQL Editor. Use the email of its existing login account:

```sql
UPDATE public."user"
SET role = 'Admin'
WHERE email = lower('admin@example.com')
RETURNING id, name, email;
```

Replace the example email before running. The profile is provisioned on that account's next protected request; it can then manage staff and grant roles from the Staff page.

Customer, application, document, and message actions enforce access on the server. Relationship Managers see customers assigned to their user ID; Managers and Admins can access the full customer list. Reassignment is management-only, only active staff can receive assignments, and assignment history plus audit rows are retained. Deactivating staff preserves their profile and customer records but blocks their access and future assignment.

The backend uses Next.js Server Actions rather than NestJS REST controllers. Run `npm run migrate` after pulling schema changes. Validate with `npx tsc --noEmit -p frontend/tsconfig.json` and `node --experimental-strip-types --test backend/modules/customers/domain/access-policy.test.mjs`.
