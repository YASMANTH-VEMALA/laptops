# /deploy

Deploy the application to Vercel and verify the build.

## Pre-deploy Checklist
1. Run `npm run build` locally — must pass with zero errors
2. Check that `.env.local` exists with all required variables (see `.env.example`)
3. Verify Supabase connection: `SELECT count(*) FROM laptops WHERE is_active = true` — must return > 0
4. Run `npm run lint` — fix any errors before deploying

## Deploy Steps
1. `git add -A && git commit -m "deploy: [describe changes]"`
2. `git push origin main` → Vercel auto-deploys on push
3. Monitor Vercel build logs for errors
4. After deploy: visit the production URL and submit a test recommendation
5. Verify the response returns valid top-3 results with affiliate links

## Environment Variables on Vercel
Ensure these are set in Vercel Dashboard → Settings → Environment Variables:
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
