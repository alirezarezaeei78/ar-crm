# Build and run AR CRM

## Requirements

- Node.js 22 or newer (Node.js 22 is used in CI).
- npm, included with Node.js.
- Git if you want to clone the repository.
- A writable local disk for the demo dataset.

No API key, paid service, external database, or account is required.

## Development

```sh
git clone https://github.com/alirezarezaeei78/ar-crm.git
cd ar-crm
npm ci
npm run dev
```

Open **http://localhost:3200**. The `predev` hook generates `data/retail.json` only when it is missing. Restarting the application preserves saved changes.

## Production build on your computer

Stop the development server before building in the same checkout.

```sh
npm ci
npm run build
npm start
```

The production server also runs on port 3200. Building compiles the application and checks TypeScript. This command does not provision authentication, publish a website, or turn the JSON store into a production database.

## Available commands

| Command             | Purpose                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| `npm run dev`       | Start the development server on port 3200                                |
| `npm run build`     | Seed missing sample data, validate types, and create the optimized build |
| `npm start`         | Run an existing optimized build on port 3200                             |
| `npm run seed`      | Create sample data if it does not exist                                  |
| `npm run typecheck` | Run TypeScript checks                                                    |
| `npm test`          | Run isolated browser integration checks on port 3201                     |
| `npm run format`    | Format application source with Prettier                                  |

## Browser integration tests

Python 3.10+ is required only for tests. Set up the browser runtime once:

```sh
python -m pip install -r requirements-test.txt
python -m playwright install chromium
npm test
```

On Linux, browser system libraries may also be needed:

```sh
python -m playwright install --with-deps chromium
```

On Windows, the suite automatically uses installed Microsoft Edge when present. Otherwise it uses Playwright Chromium. Set `AR_CRM_BROWSER` to an executable path to choose another Chromium-based browser. Set `PYTHON` if your Python executable is named differently.

The runner starts its own test server, creates a fresh fixture at `artifacts/test-workspace.json`, performs 19 integration checks, and stops the server. It does not modify your saved workspace. Results and screenshots are written to `artifacts/`.

## Sample data and persistence

The sample contains 48 fictional customers, 8 products, 260 orders, 10 sales opportunities, and 4 team members. The reference date is October 15, 2026, keeping the demo reproducible.

Local data files are ignored by Git. To back up your workspace, copy `data/retail.json` while the application is stopped.

To intentionally discard changes and restore the original sample:

```sh
node scripts/seed-retail.mjs --reset
```

This replaces the current dataset. Keep a backup first if you need those records.

For an alternate data file, copy `.env.example` to `.env.local`, set an absolute `AR_CRM_DATA_PATH`, and ensure its parent folder exists and is writable. Avoid sharing one file across multiple application instances.

## Troubleshooting

- **Port 3200 is already in use:** stop the process using it, or run `npx next dev -p 3300` after `npm run seed`.
- **Port 3201 is already in use:** stop the existing process before running `npm test`. The runner does not stop unrelated processes.
- **`next` is not found:** run `npm ci` from the directory containing `package.json`.
- **Build files are missing:** run `npm run build` before `npm start`.
- **Python is not found:** install Python or set the `PYTHON` environment variable for the test runner.
- **Browser executable is missing:** run `python -m playwright install chromium` using the same Python installation as the test runner.
- **Permission errors saving records:** confirm that the chosen data directory is writable.
- **Empty or stale demo metrics:** check the date/store filters. Sample records use a fixed reference date, not the machine's current date.

## Before a live deployment

See [SECURITY.md](../SECURITY.md). Production authentication and authorization, transactional storage, backups, audit policies, actual payments/refunds, and messaging delivery require additional implementation. Campaign scheduling currently stores a plan; it does not send email or SMS.
