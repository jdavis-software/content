import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {escapeHtml as escape} from './markdown.mjs';

const TYPES = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg'};
const LOCAL = /^assets\/[a-zA-Z0-9_.-]+\.(png|jpe?g)$/;

// Read raster headers without decoding pixels or adding a build dependency.
export function rasterInfo(bytes) {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16) === 'IHDR') {
    return {type: 'image/png', width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
  }
  if (bytes.length < 4 || bytes[0] !== 255 || bytes[1] !== 216) throw new Error('Not a PNG or JPEG image');
  let offset = 2;
  const startOfFrame = new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
  while (offset < bytes.length) {
    if (bytes[offset++] !== 255) break;
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
    if (offset + 2 > bytes.length) break;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) break;
    if (startOfFrame.has(marker) && length >= 8) return {type: 'image/jpeg', height: bytes.readUInt16BE(offset+3), width: bytes.readUInt16BE(offset+5)};
    offset += length;
  }
  throw new Error('Image dimensions could not be read');
}

export async function validateSocialImage(pkg) {
  const image = pkg.meta.socialImage;
  if (image === undefined) return [];
  const errors = [];
  if (!image || typeof image !== 'object' || Array.isArray(image)) return ['socialImage must be an object'];
  if (typeof image.alt !== 'string' || !image.alt.trim()) errors.push('socialImage.alt is required');
  for (const key of ['width','height']) if (!Number.isInteger(image[key]) || image[key] < 1) errors.push(`socialImage.${key} must be a positive integer`);
  if (typeof image.path !== 'string' || !LOCAL.test(image.path) || !pkg.files.includes(image.path)) {
    errors.push('socialImage.path must name a packaged PNG or JPEG');
    return errors;
  }
  try {
    const bytes = await readFile(path.join(pkg.dir,image.path));
    const info = rasterInfo(bytes);
    if (info.type !== TYPES[path.extname(image.path)]) errors.push('Social image extension does not match its bytes');
    if (info.width !== image.width || info.height !== image.height) errors.push('Social image dimensions do not match metadata');
  } catch { errors.push('Social image has an invalid raster header'); }
  return errors;
}

// Only a declared raster card is advertised. SVG remains valid for on-page art.
export function socialImageFor(config,pkg) {
  const image = pkg?.meta.socialImage;
  if (!image) return null;
  return {...image, type: TYPES[path.extname(image.path)], url: `${config.origin}${config.basePath}/articles/${pkg.slug}/${image.path}`};
}

export function socialImageTags(image) {
  if (!image) return '';
  return `<meta property="og:image" content="${escape(image.url)}"><meta property="og:image:secure_url" content="${escape(image.url)}"><meta property="og:image:type" content="${escape(image.type)}"><meta property="og:image:width" content="${image.width}"><meta property="og:image:height" content="${image.height}"><meta property="og:image:alt" content="${escape(image.alt)}"><meta name="twitter:image" content="${escape(image.url)}"><meta name="twitter:image:alt" content="${escape(image.alt)}">`;
}
