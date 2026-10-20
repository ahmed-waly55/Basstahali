import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SimpleJsonTranslationParser, Xliff2TranslationParser } from '@angular/localize/tools';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function readCatalog(relativePath, source = false) {
  const filePath = resolve(root, relativePath);
  const contents = await readFile(filePath, 'utf8');
  const parser = new Xliff2TranslationParser();
  const analysis = parser.analyze(filePath, contents);

  assert(analysis.canParse, analysis.diagnostics.formatDiagnostics(relativePath));
  const bundle = parser.parse(filePath, contents, analysis.hint);
  // Source XLIFF intentionally has no targets: Angular's parser reads each source instead.
  const diagnostics = bundle.diagnostics.messages.filter(
    ({ type, message }) =>
      !(source && type === 'warning' && message.includes('Missing <target> element')),
  );
  assert.equal(diagnostics.length, 0, `${relativePath}: ${JSON.stringify(diagnostics)}`);
  assert(Object.keys(bundle.translations).length > 0, `${relativePath}: empty catalog`);
  return bundle;
}

const arabic = await readCatalog('src/locale/messages.xlf', true);
const english = await readCatalog('src/locale/messages.en.xlf');
assert.equal(english.locale, 'en', 'English XLIFF must declare trgLang="en"');
assert.deepEqual(
  Object.keys(arabic.translations).sort(),
  Object.keys(english.translations).sort(),
  'Arabic and English catalogs must contain the same message IDs',
);

for (const [id, source] of Object.entries(arabic.translations)) {
  assert.deepEqual(
    [...source.placeholderNames].sort(),
    [...english.translations[id].placeholderNames].sort(),
    `Translation ${id} must preserve every source placeholder`,
  );
}

await mkdir(resolve(root, 'public/i118'), { recursive: true });
for (const [locale, bundle] of [
  ['ar', arabic],
  ['en', english],
]) {
  const translations = Object.fromEntries(
    Object.entries(bundle.translations).map(([id, translation]) => [id, translation.text]),
  );
  const output = `${JSON.stringify({ locale, translations }, null, 2)}\n`;
  const outputPath = resolve(root, `public/i118/${locale}.json`);

  // Round-trip through Angular's runtime JSON parser to catch malformed placeholders.
  const parser = new SimpleJsonTranslationParser();
  const analysis = parser.analyze(outputPath, output);
  assert(analysis.canParse, analysis.diagnostics.formatDiagnostics(outputPath));
  const parsed = parser.parse(outputPath, output, analysis.hint);
  assert(!parsed.diagnostics.hasErrors, parsed.diagnostics.formatDiagnostics(outputPath));
  for (const [id, translation] of Object.entries(bundle.translations)) {
    assert.deepEqual(
      parsed.translations[id].messageParts,
      translation.messageParts,
      `${locale}: ${id}`,
    );
    assert.deepEqual(
      parsed.translations[id].placeholderNames,
      translation.placeholderNames,
      `${locale}: ${id}`,
    );
  }

  await writeFile(outputPath, output);
  console.log(
    `Generated public/i118/${locale}.json (${Object.keys(translations).length} messages)`,
  );
}
