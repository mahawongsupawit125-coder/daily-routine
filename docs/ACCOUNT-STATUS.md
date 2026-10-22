# Account implementation status — 2026-10-22

Prepared in a review branch; not enabled or published to the live site.

Implemented: top-right account icon; username/password, signup, recovery/password forms; dependency-free Auth REST client; per-account/per-tab durable drafts; schema-validated cloud payload; compare-and-swap revision saves; explicit guest import; guarded logout/session switching; SQL RLS bootstrap; validating Edge Function.

Validation: local build and syntax check pass. 25 focused Node tests pass (HTTP dependencies simulated). Full local suite could not complete: npm ci could not retrieve required packages, jsdom unavailable, and localhost server tests were denied EACCES. GitHub CI must install dependencies and run the full suite. No browser visual verification or live Auth/RLS/SMTP tests completed.

Remaining external setup: restore Supabase connector (it became unavailable during implementation), apply/review schema in project aoqpijnvptfrwihvbqam, deploy function account, configure Auth site/redirect URLs and custom SMTP, obtain public publishable key, run advisors and live two-account/recovery checks. account-config.js remains enabled:false, key:'' until these pass. No service secret is stored in source.
