# Publication runbook

## Website review
1. Review the article preview and sources. Verify current version facts and user-specific claims.
2. Confirm that every source file and asset is public-safe. Public Git history exists before Pages publication.
3. Approve the exact article revision outside agent-editable state. Merge only the reviewed change that sets status to published. `publishedUrl` may remain null until deployment is verified.
4. Run the production tests/build and inspect the built artifact. Choose the manual Pages deployment workflow.
5. Verify the actual public article route, canonical tag, linked media and social preview. Do not declare success from a candidate URL alone.

## LinkedIn handoff
Run `npm run studio -- prepare SLUG --account "CONFIRMED TARGET"`.

The resulting request contains final text, URL, package hash, target and local duplicate-coordination key. It is **not approval and not a publishing receipt**. The static review screen cannot authenticate a user or publish anything.

Discover the authenticated host's actual Zapier MCP LinkedIn action. Confirm the account/profile, media support and required fields. Use a supported share update; do not substitute a native LinkedIn Article/Newsletter operation. If unavailable, report the missing integration and keep the copy ready.

Ask for explicit approval of the exact final payload. Publish once through the authorized host action. After a timeout, reconcile before retrying. A local hash does not make the downstream provider idempotent.

## Record actual evidence
After a successful, independently inspected provider result, save an operator-confirmed receipt outside the repo, with this shape:

```json
{
  "slug": "parallel-agent-engineering",
  "platform": "linkedin",
  "account": "The confirmed target account",
  "packageHash": "the current SHA-256 package fingerprint",
  "providerPostId": "the actual provider ID",
  "url": "the actual HTTPS LinkedIn post URL",
  "recordedAt": "an ISO-8601 timestamp",
  "confirmedByHuman": true
}
```

Then run `npm run studio -- record SLUG --file /private/receipt.json` and `npm run studio -- status SLUG`. The record command stores an **operator attestation**, not independently queried provider verification. It refuses to overwrite an existing receipt. No automatic repeat posting occurs after article edits.

## Costs and credentials
No live model or publisher API is invoked by the base CLI. Reuse host tools when available. Do not paste PATs or API keys into articles, instructions or public GitHub files. Paid API generation and paid distribution usage need explicit budgeting; a ChatGPT subscription is not a blanket credit for API execution.

## Pages setup
The GitHub connection used for initial implementation may not expose Pages administration. Repository owner setup is Settings → Pages → GitHub Actions, followed by manual workflow dispatch. No alternate paid host is required. Add a protected deployment environment/review rules as appropriate; do not claim protection is enabled until verified.
