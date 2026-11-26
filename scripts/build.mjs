import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { transform } from 'esbuild';

const project = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(project, 'site');
const output = join(project, 'dist');
const bundleMarker = 'assets/site-app.js';
const cssMarker = '/* EDM_SITE_CSS */';
const revisionMarker = '__SITE_REVISION__';
const digest = value => createHash('sha256').update(value).digest('hex').slice(0, 12);

const build = await mkdtemp(join(project, '.site-build-'));
try {
  await cp(source, build, {recursive: true});
  const inputs = ['config.js', 'analytics-config.js', 'analytics.js', 'app.js'];
  const scripts = await Promise.all(inputs.map(name => readFile(join(source, name), 'utf8')));
  const {code} = await transform(scripts.join('\n;\n'), {minify: true, target: 'es2020', legalComments: 'none'});
  const bundle = 'assets/app.' + digest(code) + '.js';
  await writeFile(join(build, bundle), code);

  const template = await readFile(join(source, 'index.html'), 'utf8');
  const css = await readFile(join(source, 'styles.css'), 'utf8');
  const worker = await readFile(join(source, 'sw.js'), 'utf8');
  if (!template.includes(cssMarker) || !template.includes(bundleMarker) ||
      !worker.includes(bundleMarker) || !worker.includes(revisionMarker) || !template.includes('<html ')) {
    throw new Error('The site templates are missing a build marker.');
  }
  const html = template.replace(cssMarker, () => css).replace(bundleMarker, bundle);
  const revision = digest(html);
  await writeFile(join(build, 'index.html'), html.replace('<html ', '<html data-edm-release="' + revision + '" '));
  await writeFile(join(build, 'sw.js'), worker.replaceAll(bundleMarker, bundle).replaceAll(revisionMarker, revision));

  async function compress(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await compress(path);
      else if (/\.(html|css|js|webmanifest|json|svg|xml|txt)$/.test(entry.name)) {
        await writeFile(path + '.gz', gzipSync(await readFile(path), {level: 9}));
      }
    }
  }
  await compress(build);

  await rm(output, {recursive: true, force: true});
  await rename(build, output);
  console.log('Built website revision', revision);
} finally {
  await rm(build, {recursive: true, force: true});
}
