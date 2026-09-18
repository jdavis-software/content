import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {escapeHtml as e} from './markdown.mjs';

const PNG_SIGNATURE = Buffer.from([137,80,78,71,13,10,26,10]);
const LOCAL_PNG = /^assets\/[a-zA-Z0-9_.-]+\.png$/;

/** Read PNG header dimensions without another build dependency. Not a full image decoder. */
export function pngDimensions(bytes) {
  if (bytes.length < 33 || !bytes.subarray(0,8).equals(PNG_SIGNATURE) ||
      bytes.readUInt32BE(8) !== 13 || bytes.toString('ascii',12,16) !== 'IHDR') {
    throw new Error('Social image must be a PNG with an IHDR header');
  }
  const width=bytes.readUInt32BE(16), height=bytes.readUInt32BE(20);
  if (!width || !height) throw new Error('Social image dimensions must be positive');
  return {width,height};
}

/** Optional dedicated social image: existing packages may still use their cover fallback. */
export async function validateSocialImage(pkg) {
  const s=pkg.meta.socialImage, errors=[];
  if (s===undefined) return errors;
  if (!s || typeof s!=='object' || Array.isArray(s)) return ['socialImage must be an object'];
  if (typeof s.src!=='string' || !LOCAL_PNG.test(s.src) || !pkg.files.includes(s.src)) {
    return ['socialImage.src must name a packaged PNG under assets/'];
  }
  if (s.type!=='image/png') errors.push('socialImage.type must be image/png');
  if (typeof s.alt!=='string' || !s.alt.trim()) errors.push('socialImage.alt is required');
  if (!Number.isInteger(s.width) || s.width<1 || !Number.isInteger(s.height) || s.height<1) {
    errors.push('socialImage width and height must be positive integers');
  }
  try {
    const actual=pngDimensions(await readFile(path.join(pkg.dir,s.src)));
    if(actual.width!==s.width || actual.height!==s.height) errors.push('socialImage dimensions do not match the PNG');
  } catch(error) { errors.push(error.message); }
  return errors;
}

export function imageForArticle(meta) {
  return meta.socialImage ?? {src:meta.coverImage,alt:meta.coverAlt};
}

/** Output static head metadata: link crawlers do not need to run JavaScript. */
export function socialImageTags(meta, articleUrl) {
  const image=imageForArticle(meta), url=articleUrl+image.src;
  const dimensions=Number.isInteger(image.width)&&Number.isInteger(image.height)
    ? `<meta property="og:image:width" content="${image.width}"><meta property="og:image:height" content="${image.height}">` : '';
  const type=image.type?`<meta property="og:image:type" content="${e(image.type)}">`:'';
  return `<meta property="og:image" content="${e(url)}"><meta property="og:image:secure_url" content="${e(url)}">${type}${dimensions}<meta property="og:image:alt" content="${e(image.alt)}"><meta name="twitter:image" content="${e(url)}"><meta name="twitter:image:alt" content="${e(image.alt)}">`;
}
