# Project instructions

- Build and maintain this Thai responsive daily routine app according to the README.
- Keep the browser app dependency-free. Development-only dependencies are acceptable for useful tests.
- Preserve distinctions between confirmed facts, plans, unknown nutrition, and estimates. Do not add calorie quotas or turn the 3.3L water reference into a compulsory goal.
- Water plans and completion data are isolated by date. localStorage is per browser/origin, not cloud sync.
- The user explicitly requested: after completing a coherent set of file changes, run the relevant checks, commit and push to `https://github.com/mahawongsupawit125-coder/daily-routine.git`. Continue doing so for this project without asking again. Preserve remote changes, never force push, and never commit credentials, node_modules, or personal JSON backups.
- Run `npm ci`, `npm run check`, and `npm test` for a clean test environment. `npm start` needs no installed dependencies.
- Report browser rendering checks separately from DOM simulation tests. Do not claim mobile/tablet/desktop visual verification unless actually performed.
- The Pages workflow supports manual dispatch and builds dist/ from 01_web_app/ and automatically publishes source changes on main after installation, syntax checks, and the full test suite pass. Verify deployment success separately from pushing source.

- Edit 01_web_app/ source files, 02_food_ai_api/ backend, and 03_tests/ tests. dist/ is generated and ignored; never edit or commit it. scripts/build.cjs assembles page fragments inside the existing app closure without changing public asset URLs.
