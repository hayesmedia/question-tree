# Read access to the saved team project

Set `PROJECT_READ_TOKEN` as a Production secret on the Cloudflare `question-tree` Worker. Use a unique random token of at least 32 characters. Keep `SITE_PASSWORD` for normal browser access. No Cloudflare account API token is needed for this endpoint.

Store the same value securely in the Codex environment as `PROJECT_READ_TOKEN`. Restrict its HTTPS destination to `question-tree.dry-bonus-373b.workers.dev` and allow that hostname in environment network settings. Never put the value in chat, source files, URLs or logs.

Request `GET https://question-tree.dry-bonus-373b.workers.dev/api/project` with the header `Authorization: Bearer <PROJECT_READ_TOKEN>`. The JSON response contains the current revision, saved flow, and recovery backups. A missing saved flow means the team project has not yet been saved. Read tokens cannot write, log in, subscribe to live updates, or access assets. Invalid or disabled tokens return 401; prohibited operations return 403.

Rotate or remove the Cloudflare secret to revoke access. Update the Codex secret when rotating it. Cloudflare deployment and Codex network/secret configuration must be verified separately; passing local tests does not prove production access.
