# Dedicated social preview

The parallel-agent article uses `assets/og-parallel-agents-v1.png`, an optimized RGB PNG at 1200 × 627 pixels. It was generated through ChatGPT and cropped/resized for a wide social card. The precise model version was not exposed. Asset provenance includes dimensions, transformation and SHA-256. This is an editorial illustration, not evidence of throughput or a live architecture.

`metadata.socialImage` is independent from the editable SVG cover and interactive article diagrams. The PNG also supplies the homepage thumbnail; both interactive diagrams remain intact. The original article text, canonical URL and title are unchanged.

The renderer writes absolute HTTPS `og:image`, `og:image:secure_url`, `og:image:type`, width, height and alt fields into the initial HTML. Twitter image/title/description fields and the Article structured-data image agree. No JavaScript, authentication, external image CDN, or generation API is required for a crawler to read the published result. The final PNG is committed and served by GitHub Pages.

Social-image validation requires a local PNG or JPEG, nonempty alt text, and dimensions/type matching its headers. This is header validation, not a complete image decoder or a guarantee of crawler acceptance. The current PNG was additionally decoded and visually inspected before release. A new visual revision should use a new filename and update metadata rather than assume an old image URL will immediately refresh at every platform.

After deployment, use LinkedIn Post Inspector on the canonical article URL to refresh LinkedIn's cached metadata. That is a separate platform-side check: an HTTP 200 and correct Open Graph tags do not prove LinkedIn has refreshed its preview. Do not delete, repost, or edit an existing LinkedIn post automatically. The published site update does not create a LinkedIn post.

References:
- https://ogp.me/#structured
- https://www.linkedin.com/post-inspector/
