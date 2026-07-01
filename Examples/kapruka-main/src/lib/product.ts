// cp1252 special chars (0x80–0x9F) to their byte values
const CP1252: Record<number, number> = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
  0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
  0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F,
};

export function decodeHtml(str: string): string {
  // Kapruka API sends malformed entities with & replaced by N or n
  const normalized = str
    .replace(/[Nn]#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

  // Fix UTF-8 mojibake: chars arrived as cp1252 codepoints, re-decode as UTF-8
  const bytes = new Uint8Array([...normalized].map(ch => {
    const cp = ch.charCodeAt(0);
    return CP1252[cp] ?? (cp <= 0xFF ? cp : 0x3F);
  }));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return normalized;
  }
}

export function optimizeImage(url: string | null, width = 400): string {
  if (!url) return "";
  return url.replace(/width=\d+/, `width=${width}`);
}

// Strips the Cloudflare image-transform prefix (e.g. /product-image/width=400,.../),
// returning the raw CDN URL as a fallback when the transform fails.
export function getRawImageUrl(url: string): string {
  return url.replace(/\/product-image\/[^/]+\//, "/");
}
