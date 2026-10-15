# Contributing to AR CRM

Thanks for helping make retail software more useful and approachable.

## Local setup

Use Node.js 22 or newer and npm:

```sh
git clone https://github.com/alirezarezaeei78/ar-crm.git
cd ar-crm
npm ci
npm run dev
```

The app runs at http://localhost:3200. The initial dataset is generated automatically. No API keys or database service are needed.

## Before opening a pull request

1. Create a branch for one focused change.
2. Keep labels, empty states, and validation messages in English.
3. Preserve keyboard access, responsive layouts, and reduced-motion support.
4. Format the files you change with `npm run format`.
5. Run `npm run build`. Include a browser check when changing a workflow.
6. Describe the problem, resulting behavior, and checks performed. Include screenshots for interface changes.

Optional integration tests require Python and Playwright:

```sh
python -m pip install -r requirements-test.txt
python -m playwright install chromium
npm test
```

The suite uses a separate dataset and server on port 3201. Never commit local JSON records, secrets, or real customer data.

## Good first contributions

- Accessible customer or inventory import with preview and validation.
- A transactional database adapter with migrations.
- Authentication and server-side role enforcement.
- Explicit refund and payment reconciliation workflows.
- Email/SMS provider adapters with consent and delivery tracking.
- Broader keyboard, screen-reader, and workflow coverage.

Open an issue before starting a large architectural change. Bug reports should include reproduction steps, expected behavior, your runtime version, and redacted screenshots when useful.

By contributing, you agree that your contribution may be distributed under the project's MIT license.
