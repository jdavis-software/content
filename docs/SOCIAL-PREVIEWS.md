# Raster social previews

The article and homepage advertise `articles/parallel-agent-engineering/assets/og-linkedin-v1.png`, a 1200 × 627 PNG under 1 MB. The article uses a dedicated `metadata.socialImage` object with a local image path, true dimensions, and alternative text. It is independent of its live HTML/SVG diagrams. The same raster is the homepage thumbnail; the article body and both interactive diagrams are unchanged.

The static HTML head includes absolute HTTPS `og:image`/`og:image:secure_url`, MIME type, width, height and alternative text, plus `twitter:image`, its alternative text and `summary_large_image`. The homepage receives the first visible article's card while retaining website metadata. Article structured data uses the same image. SVG artwork is not advertised as a social preview merely because it is a page cover.

`lib/social-image.mjs` validates the declared local path and reads PNG/JPEG headers to ensure that file type and dimensions agree with metadata. This is a header check, not a general-purpose image decoder. Native tests verify the actual published PNG's hash, dimensions and production packaging, static metadata, and draft exclusion. No image generation or external image fetch runs in normal site builds. A future asset revision should have a new filename and reviewed metadata.

The generated artwork's provenance is recorded in the article asset package. The image came from the host image-generation tool; an exact provider model version was not exposed. The original generated image was center-cropped and resized, not a screenshot of the website. Technical animation source remains separately editable.

## Release verification

Run `npm run check`, deploy the reviewed production revision, and fetch the public article without executing JavaScript. Inspect its metadata and fetch the image URL. Require HTTP 200, `Content-Type: image/png`, correct bytes and 1200 × 627 dimensions. Image content is hosted on GitHub Pages; normal site loading has no dependency on any temporary transfer location.

## LinkedIn refresh

LinkedIn may have cached the earlier SVG/empty preview. Open https://www.linkedin.com/post-inspector/ and enter the canonical article URL:

https://jdavis-software.github.io/content/articles/parallel-agent-engineering/

Inspect the returned preview before composing a new share. Website deployment and even a public HTTP verification do not prove that LinkedIn has refreshed its cache. Existing LinkedIn posts retain their saved preview; changing the website does not automatically edit or replace a post. This pipeline does not create or delete LinkedIn posts.

References checked September 17, 2026:
- https://ogp.me/ — image structured properties.
- https://www.linkedin.com/help/linkedin/answer/a566445 — Page preview image guidance (1200 × 627).
- https://www.linkedin.com/help/linkedin/answer/a6269011 — Post Inspector and the existing-post limitation.
