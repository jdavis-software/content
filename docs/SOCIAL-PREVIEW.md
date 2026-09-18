# Social preview images

The pilot has a dedicated 1200×627 PNG in `assets/og-linkedin-v1.png`. Article metadata declares its package-relative path, alt text, MIME type, and dimensions in `socialImage`. The static renderer emits absolute HTTPS `og:image` and `twitter:image` URLs with alt text and PNG dimensions. The homepage uses that image as its thumbnail. Neither interactive diagram nor the article body is replaced.

Validation checks that the file is local to the package, is declared as PNG, has a PNG/IHDR header, and matches the declared dimensions. Existing asset-size and symlink checks still apply. This header check is not a complete decoder; visual review remains required. The renderer helper participates in cache fingerprints. A changed image filename/content or metadata invalidates relevant article output.

The image is served from GitHub Pages, not from a media provider or temporary signed link. No image generation or external image fetch runs during normal builds. Preserve the generation record in assets/provenance.json. Use a new filename for a substantively changed card rather than relying on downstream caches to notice replaced bytes.

After deployment, verify the static head tags, the image HTTP status/MIME type, dimensions, and byte digest. The deployed article and both diagrams must still be present. Use LinkedIn Post Inspector to refresh LinkedIn’s metadata cache for future shares. Updating site metadata does not guarantee a previously published LinkedIn post’s preview changes; do not delete or repost on the user’s behalf.

References: https://ogp.me/ and https://www.linkedin.com/help/linkedin/answer/a6269011
