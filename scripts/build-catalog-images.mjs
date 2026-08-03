/**
 * One-time asset script: fetch the curated jewelry photographs and process
 * them into a cohesive catalogue set.
 *
 * Source: Unsplash CDN (images.unsplash.com) — real photographs, free licence
 * for commercial use, no attribution required (attribution kept in
 * CREDITS below as good practice). Each ID was visually reviewed before
 * being added here; unusable frames were discarded.
 *
 * Processing is deliberately restrained — these must still read as real
 * photographs, not filtered artwork:
 *   - square 1:1 crop using sharp's attention strategy (keeps the jewel)
 *   - saturation trimmed to 0.94 and a touch of warmth, so a set shot by
 *     different photographers sits together as one collection
 *   - very gentle contrast curve, no vignette, no heavy grading
 *   - WebP q82 at 1000px, plus a 600px @1x variant for cards
 *
 * Run:  node scripts/build-catalog-images.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const OUT_DIR = join(process.cwd(), 'public', 'products');
const SRC = (id, w = 1600) => `https://images.unsplash.com/${id}?w=${w}&q=85`;

/**
 * Curated set — every entry visually verified as real jewellery photography
 * AND checked against the brand aesthetic: delicate, dainty, classic,
 * understated. Quiet luxury, not statement pieces.
 *
 * Rejected on aesthetic grounds (too flashy / costume / oversized): the halo
 * solitaire on black, pink-sapphire halo, gemstone flower ring, crystal tennis
 * bracelet, boxed pearl strand, ornate flower studs, prop-heavy knot earrings.
 * Rejected on palette clash: earrings on a green leaf, yellow-nails/orange-tile
 * hand shot. Do not reinstate these without re-reading this note.
 */
const IMAGES = [
  // Rings — thin bands, tiny stones
  { name: 'ring-fine-band', id: 'photo-1708222170603-12471477b1d9' },
  { name: 'ring-thin-stack', id: 'photo-1608042314453-ae338d80c427' },
  { name: 'ring-worn-stack', id: 'photo-1596944924616-7b38e7cfac36' },
  // Necklaces — fine chains, small pendants
  { name: 'necklace-small-pendant', id: 'photo-1589128777073-263566ae5e4d' },
  { name: 'necklace-gold-pendant', id: 'photo-1620656798579-1984d9e87df7' },
  { name: 'necklace-pearl-drop', id: 'photo-1611085583191-a3b181a88401' },
  { name: 'necklace-layered-fine', id: 'photo-1675113495242-09e2616a4aa2' },
  { name: 'necklace-bezel-chain', id: 'photo-1631050165155-421c47e306f7' },
  { name: 'necklace-floral-chain', id: 'photo-1625792508553-5e66a81659fa' },
  // Earrings — small studs, fine huggies
  { name: 'earrings-fine-hoops', id: 'photo-1777999763640-b228fe3192de' },
  // Replaced photo-1761479267937: the studs sat tiny in a huge grey field, so
  // the card read as an empty frame even though the image loaded fine.
  { name: 'earrings-tiny-studs', id: 'photo-1761479271790-c7327d1bc5b3' },
  // Bracelets — thin chains
  { name: 'bracelet-fine-chain', id: 'photo-1744472457504-f99a96ecbd3e' },
  { name: 'bracelet-thin-beaded', id: 'photo-1740567389909-b36e9cadbef9' },
  { name: 'bracelet-slim-bangle', id: 'photo-1655707063513-a08dad26440e' },
  // Editorial / collection covers
  { name: 'editorial-necklace-onbody', id: 'photo-1611652022419-a9419f74343d' },

  // ── Metal variants ────────────────────────────────────────────────────
  // A metal option may only exist where we hold a REAL photograph of the
  // piece in that metal. These two are a genuinely matched pair: the same
  // milgrain-band solitaire style, photographed in warm gold and in rose.
  { name: 'ring-solitaire-yellow', id: 'photo-1716511956048-e0532bd9746e' },
  { name: 'ring-solitaire-rose', id: 'photo-1726256677740-dfd61fa1af26' },
  // Genuine white gold: silvery pendant, verified by eye (not a tint).
  { name: 'necklace-heart-white', id: 'photo-1588444837495-c6cfeb53f32d' },
];

/**
 * Shared grade — subtle on purpose.
 *
 * WARNING: do NOT use sharp's .tint() here. It converts to greyscale and
 * re-tints from luminance, which destroys all original colour — it turned
 * yellow-gold jewellery silver in the first run. Warmth is applied instead as
 * a per-channel linear tweak, which preserves the actual photograph.
 */
function grade(pipeline) {
  return pipeline
    .modulate({ saturation: 0.96, brightness: 1.02 })
    // Per-channel: lift red slightly, leave green, hold blue back a touch.
    // Gentle contrast; offsets keep highlights off the clip point.
    .linear([1.05, 1.03, 1.0], [-4, -4, -2]);
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  const results = [];

  for (const { name, id } of IMAGES) {
    const res = await fetch(SRC(id));
    if (!res.ok) {
      console.error(`FAIL ${name}: HTTP ${res.status}`);
      continue;
    }
    const input = Buffer.from(await res.arrayBuffer());

    for (const [suffix, size] of [
      ['', 1000],
      ['@600', 600],
    ]) {
      const out = join(OUT_DIR, `${name}${suffix}.webp`);
      const info = await grade(
        sharp(input).resize(size, size, { fit: 'cover', position: sharp.strategy.attention }),
      )
        .webp({ quality: 82 })
        .toFile(out);
      if (!suffix) results.push({ name, kb: Math.round(info.size / 1024) });
    }
    console.log(`ok   ${name}`);
  }

  // Machine-readable manifest so the data layer can be checked against reality.
  await writeFile(
    join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ generated: new Date().toISOString(), images: IMAGES, results }, null, 2),
  );
  console.log(`\n${results.length} images written to public/products/`);
  console.table(results);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
