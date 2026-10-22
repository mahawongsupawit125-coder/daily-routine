# Account implementation status - 2026-10-22

Prepared in a review branch; not enabled or published to the live site.

Implemented: top-right account icon; username/password, signup, recovery/password forms; dependency-free Auth REST client; per-account/per-tab durable drafts; schema-validated cloud payload; compare-and-swap revision saves; explicit guest import; guarded logout/session switching; SQL RLS bootstrap; validating Edge Function.

Validation: GitHub Actions run 39729262219 passed all 115 tests, syntax checks and build. Local build and 25 focused tests passed; full local suite was blocked by package retrieval and localhost permissions. Frontend browser and end-to-end Auth/SMTP acceptance remain pending.

Applied on 2026-10-22 in project aoqpijnvptfrwihvbqam: inspected empty public/private schemas, ran the bootstrap, verified RLS and grants on all three tables, and deployed Edge Function account. Both Auth Site URL and the exact allowed redirect URL point to https://mahawongsupawit125-coder.github.io/daily-routine/ .

Live transactional SQL checks passed: service-role saves and username lookup; first 15 login attempts allowed and the 16th denied; initial revision and stale-write protection; authenticated A/B row isolation; profile RLS; anonymous access denied; direct authenticated writes and service RPC access denied. All temporary auth/data rows were rolled back. These SQL role checks do not establish real user-token or browser behavior.

Advisors: Security reports zero errors, zero warnings and one informational suggestion for private.account_login_limits having RLS with no policy. This is intentional: only service_role may access the private limiter. Performance reports zero errors, warnings or suggestions.

The existing public publishable key is configured in account-config.js. Remaining: custom SMTP is disabled; supply a verified email provider/sender, resolve the function's currently enabled legacy JWT gateway setting, and run real signup/login/recovery and two-browser checks. account-config.js remains enabled:false until these pass. No service secret is stored in source.

The dashboard deployment imports core.js, account-data.js and handler.mjs from immutable public repository commit 36fa598dc167986469b1e9afad1370689d9f9864. The checked-in local bundle entry remains the preferred CLI deployment path. The deployed function has not yet passed live HTTP acceptance.

