// Détecte les numéros de dossard visibles sur chaque photo via un modèle de vision (Claude Haiku,
// via Vercel AI Gateway) et les enregistre dans photos.json pour permettre la recherche.
//
// Usage:
//   node scripts/detect-bib-numbers.mjs [dossier-source] [chemin-manifest]
//
// Idempotent : les photos qui ont déjà un champ `bibNumbers` dans photos.json sont ignorées,
// donc on peut relancer le script après une interruption sans tout refaire.

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { generateText, Output } from 'ai';
import { z } from 'zod';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_DIR = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(ROOT, 'boutique-photos-source');
const MANIFEST_PATH = process.argv[3] ? path.resolve(process.argv[3]) : path.join(ROOT, 'photos.json');
const MODEL = 'anthropic/claude-haiku-4.5';
const ANALYSIS_MAX_WIDTH = 1200;

loadEnvLocal();

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

const bibSchema = z.object({
  bibNumbers: z
    .array(z.string())
    .describe(
      'Les numéros de dossard/concours lisibles sur les cavaliers ou les chevaux dans la photo. Tableau vide si aucun numéro lisible.'
    ),
});

async function detectBibNumbers(imageBuffer) {
  const result = await generateText({
    model: MODEL,
    output: Output.object({ schema: bibSchema }),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Cette photo montre un concours équestre. Identifie le ou les numéros de dossard/concours visibles (portés par le cavalier ou attachés au cheval). Réponds uniquement avec les chiffres lisibles, sans autre texte. Si aucun numéro n\'est lisible, renvoie un tableau vide.',
          },
          { type: 'file', data: imageBuffer, mediaType: 'image/jpeg' },
        ],
      },
    ],
  });
  return result.output.bibNumbers;
}

async function main() {
  if (!existsSync(MANIFEST_PATH)) {
    console.error(`photos.json introuvable — lance d'abord scripts/prepare-photos.mjs`);
    process.exit(1);
  }
  if (!existsSync(SOURCE_DIR)) {
    console.error(`Dossier introuvable : ${SOURCE_DIR}`);
    process.exit(1);
  }

  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const todo = manifest.filter((p) => p.bibNumbers === undefined);

  console.log(`${todo.length}/${manifest.length} photo(s) à analyser.`);

  let done = 0;
  for (const photo of manifest) {
    if (photo.bibNumbers !== undefined) continue;

    try {
      const ext = path.extname(photo.originalPathname);
      const srcPath = path.join(SOURCE_DIR, `${photo.id}${ext}`);
      if (!existsSync(srcPath)) {
        throw new Error(`fichier source introuvable : ${srcPath}`);
      }

      const original = await readFile(srcPath);
      const analysisBuffer = await sharp(original)
        .rotate()
        .resize({ width: ANALYSIS_MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer();

      photo.bibNumbers = await detectBibNumbers(analysisBuffer);
      done += 1;
      console.log(`OK  ${photo.id} -> [${photo.bibNumbers.join(', ')}] (${done}/${todo.length})`);
    } catch (err) {
      photo.bibNumbers = [];
      console.error(`ECHEC  ${photo.id} -> ${err.message}`);
    }

    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  }

  console.log(`\nTerminé. photos.json mis à jour.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
