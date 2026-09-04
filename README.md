# PGWINDS

The official website for the **Princess Galyani Vadhana Institute of Music Wind Symphony**.

- Public website: [pgwinds.vercel.app](https://pgwinds.vercel.app)
- Admin area: [pgwinds.vercel.app/admin](https://pgwinds.vercel.app/admin)
- Source repository: [pgwinds/pgwinds](https://github.com/pgwinds/pgwinds)

## Technology

- Next.js 15 with the App Router and TypeScript
- Supabase for PostgreSQL, Authentication, Row Level Security (RLS), and Storage
- Vercel for production deployment

The public site is available to everyone. The `/admin` area is private and requires an authenticated Supabase user whose `app_metadata.pgwinds_role` is `admin`.

## What the project includes

### Public website

- Home, About, Concerts, Gallery, Contact, and Repertoire
- Artists, News, Events, Members, Alumni, and Concert Archive foundations
- English and Thai routes, including `/th/...`
- Gallery carousel and external links such as YouTube

### Content management

- Admin dashboard for concerts, galleries, media, repertoire, news, events, artists, members, alumni, and administrator roles
- Website controls for Home, About, Contact, navigation, social links, settings, drafts, and previews
- Direct image upload to Supabase Storage from the admin area
- JPG, PNG, and WebP uploads up to 20 MB; convert HEIC before uploading

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Set these values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://pdomkhrzqviamzlfxcia.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Do not commit `.env.local`, passwords, Personal Access Tokens, or service-role keys. The publishable key is safe to expose in browser code because access is protected by Supabase RLS.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

Run all three before committing a substantive change.

GitHub Actions runs the same checks automatically for every pull request and every push to `main`. It does not receive Supabase credentials; the build verifies that the public-site fallback remains safe when no environment variables are available.

## Supabase

The project is linked to the `pgwinds-production` Supabase project (`pdomkhrzqviamzlfxcia`). All migrations in `supabase/migrations/` have been applied to the remote database.

The schema includes content tables, media metadata, public-media Storage policies, admin audit logs, draft/published website content, navigation, social links, and localizations. RLS allows public read access only to the content intended for publication, while administrators can manage content.

To inspect migration status:

```bash
npx supabase migration list
```

Create future schema changes as a new migration; do not edit an already-applied migration.

### Manage administrators

1. Create or invite the person in **Supabase Dashboard → Authentication → Users**.
2. Open **`/admin/administrators`** and enter that account's email address.
3. The user must sign out and sign in again at `/admin` to receive the role.

The administrator screen lists current administrators, prevents self-removal, ensures at least one administrator remains, and writes role changes to the audit log.

Never place this role in `user_metadata`; the application and RLS policies use `app_metadata.pgwinds_role`.

### Password-reset email

The reset flow uses Supabase Auth and sends users to `/auth/callback?next=/auth/update-password`. The project Site URL is `https://pgwinds.vercel.app`.

For reliable delivery, configure a custom SMTP provider in **Supabase Dashboard → Authentication → Emails → SMTP Settings**. The Free-plan default mail service is rate-limited and is appropriate only for initial testing. Keep the SMTP host, port, sender address, username, and password in Supabase; never commit them to this repository.

## Deployment workflow

Vercel is connected to the `pgwinds/pgwinds` GitHub repository. Every push to `main` automatically creates a production deployment.

```bash
git add -A
git commit -m "describe the change"
git push origin main
```

Configure the same public Supabase environment variables in **Vercel → Project Settings → Environment Variables**. Verify the resulting deployment in the Vercel dashboard after each production change.

## Repository rules

- Work only in this repository: `pgwinds/pgwinds`.
- Do not copy or connect code from `PGVIM-SchoolofMusic`.
- Keep credentials out of Git.
- Prefer admin-managed content over hard-coded content for information that changes regularly.
