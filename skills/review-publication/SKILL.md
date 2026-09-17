---
name: review-publication
description: Review technical claims, public disclosure, artifacts and the exact publishing payload before a separate authorized publication.
---

# Review publication

Run npm run check. Inspect the preview, evidence ledger, claim classifications, alt text, social media format, public URL configuration and private/public boundary. Validation detects supported structural errors; it cannot prove technical truth or certify all secrets absent.

Prepare the request with `npm run studio -- prepare SLUG --account "CONFIRMED ACCOUNT"`. Show the full text, destination, URL, media list and package hash. A JSON approved field, a local build or a checkbox in the review UI is not authorization. Obtain explicit human approval through the host or a separately enforced repository review gate.

For website publication, approve the article revision, update its status through the reviewed change, deploy the production build and verify the actual URL. For LinkedIn, separately inspect the currently connected Zapier action schema and account. If the action or authentication is absent, return a precise blocked status. Never simulate a receipt or assume an API supports a feature because another connector does.

After a publishing timeout, reconcile before retrying. The local V1 idempotency key is a coordination aid, not a guarantee of provider-side exactly-once delivery. Record the actual response after operator confirmation; record rejects duplicate receipts. If the post already exists, do not create another one just because article content changed.

Return evidence: actual commit, build, live URL, provider ID and receipt where available. Keep unknown states unknown. Do not silently turn publishing on in CI.
