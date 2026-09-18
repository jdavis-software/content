import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {escapeHtml as e} from './markdown.mjs';

/** Inspect image headers, not a full image decoder. Only PNG/JPEG social assets. */
export function rasterSize(bytes) {
  if(bytes.length>=33 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      && bytes.readUInt32BE(8)===13 && bytes.toString('ascii',12,16)==='IHDR') {
    return {type:'image/png',width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
  }
  if(bytes.length>=4 && bytes[0]===255 && bytes[1]===216) {
    let i=2;
    const frames=new Set([192,193,194,195,197,198,199,201,202,203,205,206,207]);
    while(i<bytes.length) {
      if(bytes[i++]!==255) break;
      while(i<bytes.length && bytes[i]===255)i++;
      const marker=bytes[i++];
      if(marker===218 || marker===217)break;
      if(marker===1 || (marker>=208 && marker<=215))continue;
      if(i+2>bytes.length)break;
      const length=bytes.readUInt16BE(i);
      if(length<2 || i+length>bytes.length)break;
      if(frames.has(marker) && length>=8) return {type:'image/jpeg',width:bytes.readUInt16BE(i+5),height:bytes.readUInt16BE(i+3)};
      i+=length;
    }
  }
  throw new Error('Expected PNG or JPEG image headers');
}

export async function validateSocialImage(pkg) {
  const s=pkg.meta.socialImage;
  if(s===undefined)return [];
  const errors=[];
  if(!s || typeof s!=='object' || Array.isArray(s))return ['socialImage must be an object'];
  if(typeof s.alt!=='string'||!s.alt.trim())errors.push('socialImage.alt is required');
  if(!Number.isInteger(s.width)||s.width<1||!Number.isInteger(s.height)||s.height<1)errors.push('socialImage needs positive integer dimensions');
  const local=typeof s.path==='string' && /^assets\/[a-zA-Z0-9_.-]+\.(png|jpg|jpeg)$/.test(s.path) && pkg.files.includes(s.path);
  if(!local)return [...errors,'socialImage.path must be a packaged PNG or JPEG'];
  const type=s.path.endsWith('.png')?'image/png':'image/jpeg';
  if(s.type!==type)errors.push('socialImage.type does not match its extension');
  try {
    const actual=rasterSize(await readFile(path.join(pkg.dir,s.path)));
    if(actual.type!==s.type || actual.width!==s.width || actual.height!==s.height)errors.push('socialImage metadata does not match image bytes');
  }catch{errors.push('socialImage has invalid image headers');}
  return errors;
}

/** Render into the initial HTML head so crawlers need no JavaScript. */
export function socialTags(url,image) {
  const tags=[['property','og:image',url],['property','og:image:secure_url',url],['property','og:image:alt',image.alt],
    ['name','twitter:image',url],['name','twitter:image:alt',image.alt]];
  if(image.type)tags.push(['property','og:image:type',image.type]);
  if(image.width)tags.push(['property','og:image:width',String(image.width)]);
  if(image.height)tags.push(['property','og:image:height',String(image.height)]);
  return tags.map(([key,name,value])=>`<meta ${key}="${name}" content="${e(value)}">`).join('');
}
