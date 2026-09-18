# VSA @ UVA Wordle

A weekly Wordle-style game with an access-code-protected admin panel, player
leaderboards, and advance puzzle scheduling.

## Stack

- Next.js App Router and React
- Vercel Functions
- Neon Postgres through the Vercel Marketplace
- `@neondatabase/serverless` for database queries

## Local setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set:

   - `DATABASE_URL`: your pooled Neon Postgres connection string
   - `ADMIN_ACCESS_CODE`: a long, private access code for `/admin`

3. Create the database tables:

   ```sh
   npm run db:migrate
   ```

4. Start the app:

   ```sh
   npm run dev
   ```

## Deploy to Vercel

1. Import this Git repository into Vercel. Vercel will detect Next.js from the
   project automatically.
2. In the Vercel project, open **Storage**, create or connect a Neon Postgres
   database, and connect it to the project. Confirm that it supplies a
   `DATABASE_URL` environment variable.
3. Add `ADMIN_ACCESS_CODE` in **Settings → Environment Variables** for
   Production and any Preview environments that should support admin access.
4. Apply `db/postgres-schema.sql` using the Neon SQL editor, or pull the Vercel
   variables locally and run `npm run db:migrate` once.
5. Deploy. The standard build command is `npm run build`.

Vercel environment variables are available only to new deployments, so
redeploy after adding or changing either variable.

## Database behavior

The current puzzle is the latest row in `weekly_words` whose `starts_on` date
has arrived. A unique constraint permits one puzzle per Monday. If a brand-new
database contains no puzzle, the first puzzle request creates `CRANE` for the
current week.

Scores are stored in `scores`. The unique `attempt_id` prevents an individual
browser attempt from being inserted twice. Leaderboards aggregate players
case-insensitively and count each weekly puzzle once per displayed name.

The former Cloudflare D1 data is not copied automatically. Export and import it
separately if the existing production scores and scheduled words must move to
the Vercel database.
