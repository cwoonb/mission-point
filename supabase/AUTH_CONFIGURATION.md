# Authentication configuration

Code uses Supabase Auth PKCE. Provider secrets belong in Supabase Dashboard, never Vercel `VITE_*` variables.

## Supabase URL Configuration

- Site URL: `https://missionapp-topaz.vercel.app/auth/callback`
- Additional Redirect URLs:
  - `https://missionapp-topaz.vercel.app/auth/callback`
  - `http://localhost:3001/auth/callback`

The production callback is also the Site URL so production auth remains valid
when the Dashboard redirect allow-list editor is temporarily unavailable.

## Google

Enable Google under **Authentication > Sign In / Providers**.

- Google authorized JavaScript origin: `https://missionapp-topaz.vercel.app`
- Google authorized redirect URI: `https://dvlzdguefseejiuycxnv.supabase.co/auth/v1/callback`
- Store Google Client ID and Client Secret in Supabase Provider settings.

## Kakao

Enable Kakao under **Authentication > Sign In / Providers**.

- Kakao redirect URI: `https://dvlzdguefseejiuycxnv.supabase.co/auth/v1/callback`
- Store Kakao REST API key and Client Secret in Supabase Provider settings.
- Enable account email consent when email-based legacy profile matching is needed.

## Email

- Email provider enabled.
- Confirm email enabled for production.
- Confirmation redirect uses `/auth/callback?next=/register`.
- Password recovery redirect uses `/auth/callback?next=/reset-password`.
