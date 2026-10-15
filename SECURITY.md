# Security and deployment status

AR CRM is an open-source local demonstration and starting point for a retail CRM. It does not include authentication or multi-tenant isolation.

Do not expose the demo directly to the public internet or use it to store live customer records before adding authentication, server-side authorization, a transactional database, backups, and production operational controls.

The JSON persistence layer supports one Node.js process and a writable filesystem. It does not support concurrent instances, shared multi-user deployments, or ephemeral serverless storage. Campaign schedule states are planning records; they do not send messages.

## Reporting a vulnerability

Please avoid posting exploitable details or private data in public issues. Use GitHub's private vulnerability reporting option if it is enabled for this repository. Otherwise, contact the repository owner through the contact details on their public GitHub profile and ask for a private reporting channel.

## Dependency checks

Run `npm audit` to inspect the installed dependency set. The lockfile records the versions used for verification. Audit results are time-sensitive and do not replace application security review.
