import {
  readFile,
  readdir,
  mkdir,
  copyFile,
  writeFile,
} from 'node:fs/promises';
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
await mkdir('public/licenses', { recursive: true });
const notices = [];
for (const [location, entry] of Object.entries(lock.packages)) {
  if (!location || entry.dev) continue;
  let names;
  try {
    names = await readdir(location);
  } catch {
    continue;
  }
  const metadata = JSON.parse(
    await readFile(`${location}/package.json`, 'utf8'),
  );
  const files = names.filter((name) =>
    /^(LICENSE|LICENCE|COPYING|NOTICE|OFL)([.-]|$)/i.test(name),
  );
  const copied = [];
  for (const file of files) {
    const dest = `${metadata.name.replaceAll('/', '-')}-${file}`;
    await copyFile(`${location}/${file}`, `public/licenses/${dest}`);
    copied.push(dest);
  }
  notices.push({
    name: metadata.name,
    version: metadata.version,
    license: metadata.license,
    files: copied,
  });
}
await writeFile(
  'public/licenses/index.json',
  JSON.stringify(notices, null, 2) + '\n',
);
console.log(
  `Retained license notices for ${notices.length} installed production packages (including optional Node-only dependencies).`,
);
