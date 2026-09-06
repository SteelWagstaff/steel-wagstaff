import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outputRoot = path.join(root, 'public', '_optimized-images');
const imageSources = [
  path.join(root, 'public', 'steel_wagstaff.jpg'),
  path.join(root, 'public', 'pb_team.jpg'),
  path.join(root, 'public', 'spring_camas.jpg'),
  path.join(root, 'public', 'oracle.webp'),
  path.join(root, 'public', 'writing'),
  path.join(root, 'public', 'commonplace-media'),
];
const widths = [640, 1280];
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

async function getImageFiles(source) {
  const stats = await fs.stat(source);
  if (stats.isFile()) return [source];

  const entries = await fs.readdir(source, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isFile() ? getImageFiles(path.join(source, entry.name)) : []))).flat();
}

async function optimize(source) {
  const relativeSource = path.relative(path.join(root, 'public'), source);
  const parsed = path.parse(relativeSource);
  const outputDirectory = path.join(outputRoot, parsed.dir);
  const sourceMtime = (await fs.stat(source)).mtimeMs;
  const outputs = widths.flatMap((width) => [
    path.join(outputDirectory, `${parsed.name}-${width}.avif`),
    path.join(outputDirectory, `${parsed.name}-${width}.webp`),
  ]);

  const outputStats = await Promise.all(outputs.map((output) => fs.stat(output).catch(() => null)));
  if (outputStats.every((stats) => stats && stats.mtimeMs >= sourceMtime)) return false;

  await fs.mkdir(outputDirectory, { recursive: true });
  await Promise.all(widths.flatMap((width) => [
    ['avif', { avif: { quality: 50 } }],
    ['webp', { webp: { quality: 72 } }],
  ].map(async ([format, options]) => {
    const output = path.join(outputDirectory, `${parsed.name}-${width}.${format}`);

    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .toFormat(format, options)
      .toFile(output);
  })));

  return true;
}

const files = (await Promise.all(imageSources.map(getImageFiles))).flat().filter((file) => imageExtensions.has(path.extname(file).toLowerCase()));
let generated = 0;
for (const file of files) generated += Number(await optimize(file));

console.log(`Image optimization complete: ${generated} generated, ${files.length - generated} skipped.`);