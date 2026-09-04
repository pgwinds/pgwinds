# PGWINDS

The public website for Princess Galyani Vadhana Institute of Music Wind Symphony.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run lint
npm run typecheck
npm run build
```

## Supabase foundation

The Phase 2 schema is in `supabase/migrations/`. It is version-controlled but has **not** been applied to the remote Supabase project.

Add the public project URL and anon key to `.env.local` to enable database reads. Until then, the website displays static fallback content.

Admin authentication, user provisioning, and applying the migration to Supabase are deliberately deferred to the next approved steps.
