// Prépare les photos de la boutique : filigrane + upload de l'original privé + manifest.
//
// Usage:
//   node scripts/prepare-photos.mjs [dossier-source]
//
// 1. Dépose les photos originales (haute résolution) dans boutique-photos-source/,
//    ou passe un dossier externe en argument (ex: le dossier d'export Lightroom)
// 2. Lance ce script
// 3. Il génère un aperçu filigrané dans boutique/previews/, upload l'original en privé
//    sur Vercel Blob, et régénère photos.json (prix par défaut à ajuster ensuite)

import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { put } from '@vercel/blob';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_DIR = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, 'boutique-photos-source');
const PREVIEW_DIR = path.join(ROOT, 'boutique', 'previews');
const MANIFEST_PATH = path.join(ROOT, 'photos.json');
const DEFAULT_PRICE_CENTS = Number(process.env.DEFAULT_PRICE_CENTS || 600);
const PREVIEW_MAX_WIDTH = 1600;
const WATERMARK_TEXT = 'ÉCURIES DU LANDRAN — APERÇU';

loadEnvLocal();

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error(
    'BLOB_READ_WRITE_TOKEN manquant. Crée un store Vercel Blob (Storage > Create Database > Blob) ' +
      'pour ce projet, puis récupère la variable avec `vercel env pull .env.local`.'
  );
  process.exit(1);
}

const SUPPORTED_EXT = new Set(['.jpg', '.jpeg', '.png']);

function loadEnvLocal() {
  const envPath = path.join(ROOT, '.env.local');
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^"(.*)"$/, '$1');
    }
  }
}

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function watermarkSvg(width, height) {
  const tile = 340;
  const cols = Math.ceil(width / tile) + 2;
  const rows = Math.ceil(height / tile) + 2;
  let texts = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tile - tile;
      const y = r * tile - tile;
      texts += `<text x="${x}" y="${y}" font-size="28" font-family="Helvetica, Arial, sans-serif" fill="rgba(255,255,255,0.55)" transform="rotate(-30 ${x} ${y})">${WATERMARK_TEXT}</text>`;
    }
  }
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${texts}</svg>`
  );
}

async function main() {
  await mkdir(PREVIEW_DIR, { recursive: true });

  if (!existsSync(SOURCE_DIR)) {
    console.error(`Dossier introuvable : ${SOURCE_DIR}`);
    process.exit(1);
  }

  const files = (await readdir(SOURCE_DIR)).filter((f) =>
    SUPPORTED_EXT.has(path.extname(f).toLowerCase())
  );

  if (files.length === 0) {
    console.log(`Aucune photo (.jpg/.jpeg/.png) trouvée dans ${SOURCE_DIR}`);
    return;
  }

  let manifest = [];
  if (existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
    } catch {
      manifest = [];
    }
  }
  const byId = new Map(manifest.map((p) => [p.id, p]));

  const failures = [];

  for (const file of files) {
    try {
      const ext = path.extname(file).toLowerCase();
      const id = slugify(path.basename(file, ext));

      if (byId.has(id) && existsSync(path.join(PREVIEW_DIR, `${id}.jpg`))) {
        continue; // déjà traité lors d'un run précédent (reprise après erreur/interruption)
      }

      const srcPath = path.join(SOURCE_DIR, file);
      const original = await readFile(srcPath);

      const { data: resized, info } = await sharp(original)
        .rotate()
        .resize({ width: PREVIEW_MAX_WIDTH, withoutEnlargement: true })
        .toBuffer({ resolveWithObject: true });

      const previewBuffer = await sharp(resized)
        .composite([{ input: watermarkSvg(info.width, info.height) }])
        .jpeg({ quality: 78 })
        .toBuffer();

      const previewFile = `${id}.jpg`;
      await writeFile(path.join(PREVIEW_DIR, previewFile), previewBuffer);

      const originalPathname = `originals/${id}${ext}`;
      await put(originalPathname, original, {
        access: 'private',
        contentType: ext === '.png' ? 'image/png' : 'image/jpeg',
        allowOverwrite: true,
      });

      const existing = byId.get(id);
      byId.set(id, {
        id,
        title: existing?.title || id.replace(/-/g, ' '),
        file: `boutique/previews/${previewFile}`,
        originalPathname,
        price: existing?.price ?? DEFAULT_PRICE_CENTS,
      });

      await writeFile(MANIFEST_PATH, JSON.stringify(Array.from(byId.values()), null, 2) + '\n');
      console.log(`OK  ${file} -> aperçu: ${previewFile}, original privé: ${originalPathname} (${byId.size}/${files.length})`);
    } catch (err) {
      failures.push({ file, error: err.message });
      console.error(`ECHEC  ${file} -> ${err.message}`);
    }
  }

  if (failures.length) {
    console.log(`\n${failures.length} photo(s) en échec :`);
    failures.forEach((f) => console.log(`  - ${f.file}: ${f.error}`));
  }

  console.log(`\nphotos.json mis à jour (${byId.size} photo(s)). Ajuste les prix (en centimes) si besoin.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
