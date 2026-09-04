# PGWINDS backup and restore runbook

This is the safe, no-cost backup procedure for the early stage of PGWINDS. It does not enable a paid Supabase feature, automate uploads, or save credentials in the repository.

## What is protected

| Item | Where it is backed up | Why |
| --- | --- | --- |
| Database schema and RLS policies | `supabase/migrations/` in GitHub | This is the source of truth for database structure. |
| Public content and metadata | A manual SQL data dump outside this repository | Covers concerts, galleries, page content, navigation, and media metadata. |
| Uploaded images | A manual copy from Supabase Storage outside this repository | Database dumps do not contain the image files themselves. |
| Administrator access | A short private record of administrator email addresses | Supabase Auth accounts and passwords are not included in the regular data dump. |

Never store passwords, tokens, `.env.local`, SQL dumps, or downloaded images in Git. The `backups/` folder is ignored as an additional safeguard, but the preferred location is outside the repository.

## When to make a backup

Make one backup:

- once each month while the website is small;
- before a major content import, a bulk delete, or a database migration; and
- before changing Supabase settings that affect Authentication, Storage, or RLS.

Use a date-based folder outside the repository, for example:

```text
/Users/your-name/Documents/PGWINDS-backups/2026-09-05/
```

Keep the latest three backups in a restricted institutional drive or an encrypted external drive. Do not place backups in a public shared folder.

## Database backup (manual)

Before starting, make sure the Supabase CLI is logged in and this repository is linked to `pgwinds-production` (`pdomkhrzqviamzlfxcia`). Do not paste a database password into a command, document, or GitHub issue.

Run these commands from the repository root, replacing the date folder with the backup folder you created outside the repository:

```bash
npx supabase db dump --linked --role-only -f /Users/your-name/Documents/PGWINDS-backups/2026-09-05/roles.sql
npx supabase db dump --linked -f /Users/your-name/Documents/PGWINDS-backups/2026-09-05/schema.sql
npx supabase db dump --linked --data-only --use-copy -f /Users/your-name/Documents/PGWINDS-backups/2026-09-05/data.sql
```

The migrations already held in GitHub remain the primary schema backup. Keep `schema.sql` as an independent recovery reference; do not commit it.

The Supabase CLI excludes managed `auth` and `storage` schemas from a normal database dump. Record the current administrator email addresses in a private, access-controlled note. On a disaster recovery to a new project, administrators should be invited again and set new passwords; never attempt to back up or reuse their passwords.

## Image backup (manual)

The PGWINDS images are in the `public-media` bucket. A database backup preserves only the image metadata, not the image files.

For the current small library:

1. Open **Supabase Dashboard → Storage → public-media**.
2. Download each image into the same dated backup folder, inside a `public-media` folder.
3. Compare the number of downloaded files with the image list in **PGWINDS Admin → Media**.

When the image library becomes large, use the official Supabase Storage CLI procedure or an S3-compatible backup tool. That should be planned separately because it requires creating storage credentials and choosing a secure destination.

## Verify the backup

After making a backup, confirm all of the following:

- `roles.sql`, `schema.sql`, and `data.sql` exist and are not empty.
- The `public-media` backup contains the expected images.
- The folder name contains the correct date.
- The folder is not inside this Git repository and has not appeared in `git status`.
- The backup is accessible only to the responsible PGWINDS team members.

Do not test a restore against the production project. A restore can overwrite data and causes downtime.

## Restore principle

If content is accidentally deleted or the database needs recovery:

1. Stop making additional production changes.
2. Identify the newest backup made before the problem.
3. Restore into a new test Supabase project first and compare content, images, roles, and public pages.
4. Only after verification, plan a production recovery window and create new administrator invitations/passwords.

Do not run `supabase db reset`, `supabase db push`, or a database restore against `pgwinds-production` as a recovery shortcut. Ask for a review before a production restore.

## What remains intentionally deferred

- Supabase Point-in-Time Recovery and dashboard-managed restore: paid-plan features.
- Automated scheduled backups: needs a secure external destination and stored credentials.
- Storage S3 access keys: not needed while the media library is small.

Until those are justified, the monthly manual process above gives PGWINDS an independent recovery copy without changing the Free plan.
