# Secure backend rollout

The web client keeps `VITE_SECURE_BACKEND_ENABLED=false` until the database is ready. This prevents a partially deployed client from calling RPCs that do not exist yet.

1. Create a database backup in Supabase.
2. Apply `006_organizations_memberships.sql`, then `007_launch_security.sql` in the Supabase SQL editor or linked CLI.
3. Verify as an anonymous client:
   - `users`, `memberships`, `missions`, and submissions are not readable.
   - `get_public_report` returns data only for a valid, unexpired token.
4. Configure Google and Kakao in Supabase Auth. Add local and production callback URLs.
5. Set `VITE_SECURE_BACKEND_ENABLED=true` for Preview first, redeploy, and run account A/B organization-isolation tests.
6. Promote the same environment variable to Production and redeploy.

Never put the service-role key or database password in a `VITE_*` variable.
