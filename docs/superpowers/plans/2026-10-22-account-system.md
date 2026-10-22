# Account System Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.
**Goal:** Username/password accounts with recovery and isolated cross-device routine data.
**Architecture:** A dependency-free REST client talks to Supabase Auth. An Edge Function verifies credentials or JWTs, validates routine JSON with the existing core validator, and commits with optimistic revisions. Guest data remains in its existing key.
**Tech Stack:** JavaScript, Supabase Auth, PostgreSQL RLS, Deno Edge Function.
**Spec:** https://github.com/mahawongsupawit125-coder/daily-routine/blob/account-system-design-2026-10-22/docs/ACCOUNT-DESIGN.md

## Global Constraints
- Keep the browser app dependency-free.
- Never commit credentials, personal JSON backups, or node_modules.
- Preserve guest jai-daily.v1, require explicit guest import.
- Authenticate server-side and check ownership using auth user IDs.
- Do not publish an active login until backend, redirects, and email delivery are configured.

## Review Focus
- Late responses after account switching: reject stale generations.
- Offline writes: durable account-specific draft, never say synced.
- Concurrent writes: compare revision and keep the local copy.
- Expired session: refresh or lock account editing.
- New accounts: exclude personal seed history and body data.

### Task 1: Account store
Files: 01_web_app/src/shared/account-store.js, 03_tests/account.test.cjs.
Interfaces: createAccountStore({core,storage,api,onStatus}), open(userId), edit(state), flush(), useRemote(), close(); api.load(userId) and api.save(state,revision,userId).
- [ ] Write/run failing isolation, concurrent save, conflict, network and late-response tests.
- [ ] Implement durable drafts and serialized optimistic saves.
- [ ] Run node --test 03_tests/account.test.cjs.

### Task 2: Auth REST client
Files: 01_web_app/src/shared/account-client.js, account-config.js; 03_tests/account-client.test.cjs.
Interfaces: createClient(config,{fetch,storage,now}), signIn(username,password), signUp(profile,password), recover(email), updatePassword(password), load(userId), save(state,revision,userId), restore(), signOut().
- [ ] Test credential calls, no password persistence, JWT refresh, failure and disabled configuration.
- [ ] Implement REST calls and strict response handling with a 20 second timeout.
- [ ] Run client/store tests.

### Task 3: Backend
Files: 04_account_backend/schema.sql, functions/account/index.ts, README.md.
- [ ] Add own-row SELECT RLS, service-only write CAS RPC, username uniqueness and rate limits.
- [ ] Reuse core.js for server-side schema validation; verify JWT on every data request.
- [ ] Test SQL ownership and CAS with disposable users, run Supabase advisors after applying.

### Task 4: UI and integration
Files: 01_web_app/src/pages/10_account/page.js, shared/app-shell.js, public/index.html, assets/styles/account.css, scripts/build.cjs.
- [ ] Test top-right icon, forms, guest import choice, loading locks, logout isolation, recovery.
- [ ] Integrate store into existing save path and add account status/retry/export controls.
- [ ] Preserve normal guest behavior when backend disabled.

### Task 5: Delivery
- [ ] npm ci; npm run check; npm test.
- [ ] Configure live URL, publishable key, allowed redirects and SMTP.
- [ ] Verify real signup/login, A/B RLS, recovery mail and two-device sync.
- [ ] Push reviewed branch; publish only after live acceptance checks.
