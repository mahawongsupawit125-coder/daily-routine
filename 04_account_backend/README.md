# Supabase account backend

Project: daily-routine (aoqpijnvptfrwihvbqam), organization daily-routine.
The schema was applied and function account deployed on 2026-10-22. See docs/ACCOUNT-STATUS.md for verified checks and outstanding setup. The frontend remains disabled until live acceptance.

1. schema.sql is a one-time bootstrap already applied to this project. Do not rerun it. For another project, inspect existing public/private objects before applying it.
2. Run node scripts/account-bundle.cjs. Deploy all four files in .account-build/account as function account, entrypoint index.ts. Set verify_jwt=false because the function checks passwords for login and validates the bearer token through Auth /user for every load/save request. No data request trusts a caller-supplied owner ID.
3. Supabase injects SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in Edge Functions. Never copy the service role key into frontend code, GitHub, or chat.
4. Set Auth Site URL and allowed redirect URL to https://mahawongsupawit125-coder.github.io/daily-routine/ . Keep email confirmation enabled.
5. Configure a custom SMTP service and sender permitted by its domain verification. Supabase default email sending is restricted and is not a public production email service. Do not disable email confirmation as a substitute.
6. Get a public publishable key; enter it into 01_web_app/src/shared/account-config.js and enable only after live checks below pass.
7. Run Supabase security/performance advisors. Validate schema, private function privileges, no anon routine access, own-row SELECT RLS, and service-only write functions.

## Live acceptance (not yet executed)
- Register two disposable accounts through Auth with distinct usernames; confirm email; log in by username.
- Use account A's bearer token to read B's data directly: zero rows. Anonymous access and direct authenticated writes must fail.
- Through account endpoint, payload user_id=B must still write only verified A.
- Initial insert at revision 0 succeeds once; stale revision returns 409 and leaves data unchanged.
- Reload two separate browsers; data agrees after save; conflicting revisions preserve local draft.
- Request recovery email, follow real link to correct site, change password, then verify old password fails.
- Guest history remains untouched through sign-in/sign-out and explicit guest import.
- On auth/data network failure the UI must not substitute guest data into an account.

Automated handler tests use controlled HTTP responses and cannot establish real Auth/RLS/SMTP behavior.

