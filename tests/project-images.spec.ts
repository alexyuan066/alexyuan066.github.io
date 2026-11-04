import { test, expect } from '@playwright/test';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createServer as createPortProbe } from 'node:net';
import { crc32, deflateSync } from 'node:zlib';
import { build, createServer, preview, type PreviewServer, type ViteDevServer } from 'vite';

async function unusedLoopbackPort() {
  const probe = createPortProbe();
  await new Promise<void>((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const address = probe.address();
  if (!address || typeof address === 'string') throw new Error('Port probe has no TCP address');
  await new Promise<void>((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  return address.port;
}

function fixturePng(index: number) {
  const chunk = (name: string, data: Buffer) => {
    const type = Buffer.from(name);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(Buffer.concat([type, data])));
    return Buffer.concat([length, type, data, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.from([0, index * 29, 100, 180, 255]))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

type Catalog = Record<string, { src: string; alt: string; caption: string; credit?: string }[]>;

function expectCatalog(catalog: Catalog) {
  expect(Object.fromEntries(Object.entries(catalog).map(([id, images]) => [id, images.length]))).toEqual({
    ultrasonic: 2, aiaa: 1, combustion: 1, manifold: 0, unknown: 0,
  });
  const first = catalog.ultrasonic[0];
  expect(first.alt === 'Fixture - overview' && first.caption === 'Fixture - caption' && first.credit === 'Test team', 'Numeric upload order and normalized metadata are preserved').toBe(true);
  const fallback = catalog.ultrasonic[1];
  expect(fallback.alt === 'detail' && fallback.caption === 'detail' && !('credit' in fallback), 'Uploads work without optional metadata').toBe(true);
  expect(catalog.aiaa[0].alt === 'valve' && catalog.combustion[0].caption === 'burner', 'Each permitted project gets filename-based labels').toBe(true);
}

test('Vite discovers and builds approved project uploads with numeric ordering and optional metadata', async ({ page }) => {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-project-images-'));
  let server: ViteDevServer | undefined;
  let production: PreviewServer | undefined;
  const imageFiles = [
    'ultrasonic/2 overview.PNG',
    'ultrasonic/10_detail.png',
    'aiaa/1_valve.png',
    'combustion/1_burner.PNG',
    'ultrasonic/nested/1_nested-fixture.png',
    'manifold/1_confidential-fixture.png',
    'unknown/1_unknown-fixture.png',
  ];
  const fixtures = new Map(imageFiles.map((name, index) => [name, fixturePng(index)]));
  const forbiddenMarkers = ['confidential-fixture', 'unknown-fixture', 'nested-fixture', '3_notes.txt'];

  try {
    await mkdir(join(root, 'src'), { recursive: true });
    await copyFile(new URL('../src/project-images.ts', import.meta.url), join(root, 'src/project-images.ts'));
    const captionPath = join(root, 'src/gallery-captions.json');
    await copyFile(new URL('../src/gallery-captions.json', import.meta.url), captionPath);
    const captions = JSON.parse(await readFile(captionPath, 'utf8'));
    captions.ultrasonic = {
      ...captions.ultrasonic,
      '2 overview.PNG': {
        alt: ' Fixture\u2014overview ',
        caption: ' Fixture\u2014caption ',
        credit: ' Test team ',
      },
    };
    await writeFile(captionPath, JSON.stringify(captions));
    for (const [image, png] of fixtures) {
      const path = join(root, 'src/assets/projects', image);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, png);
    }
    await writeFile(join(root, 'src/assets/projects/ultrasonic/3_notes.txt'), 'Test-only non-image file');
    await writeFile(join(root, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
    await writeFile(join(root, 'src/main.ts'), `import { getProjectImages } from './project-images';
window.__projectCatalog = Object.fromEntries(['ultrasonic', 'aiaa', 'combustion', 'manifold', 'unknown'].map(id => [id, getProjectImages(id)]));`);
    await writeFile(join(root, 'index.html'), '<!doctype html><html lang="en"><head><title>Catalog integration fixture</title><link rel="icon" href="data:,"></head><body><main>Catalog fixture</main><script type="module" src="/src/main.ts"></script></body></html>');

    const port = await unusedLoopbackPort();
    server = await createServer({
      root,
      configFile: false,
      cacheDir: join(root, '.vite-cache'),
      server: { host: '127.0.0.1', port, strictPort: true, fs: { allow: [root] } },
      optimizeDeps: { noDiscovery: true },
      logLevel: 'error',
    });
    await server.listen();
    const address = server.httpServer?.address();
    if (!address || typeof address === 'string') throw new Error('Temporary Vite server has no TCP address');
    const baseURL = `http://127.0.0.1:${address.port}`;
    await page.goto(baseURL);
    const catalog: Catalog = await page.evaluate(async () => {
      const modulePath = '/src/project-images.ts';
      const { getProjectImages } = await import(modulePath);
      return {
        ultrasonic: getProjectImages('ultrasonic'),
        aiaa: getProjectImages('aiaa'),
        combustion: getProjectImages('combustion'),
        manifold: getProjectImages('manifold'),
        unknown: getProjectImages('unknown'),
      };
    });

    expectCatalog(catalog);
    const filenames = catalog.ultrasonic.map((image: { src: string }) => decodeURIComponent(new URL(image.src, baseURL).pathname).split('/').at(-1));
    expect(filenames).toEqual(['2 overview.PNG', '10_detail.png']);
    const first = catalog.ultrasonic[0];

    const transformed = await server.transformRequest('/src/project-images.ts');
    expect(Boolean(transformed), 'Real Vite glob transformation succeeds').toBe(true);
    const allowedImports = ['2 overview.PNG', '10_detail.png', '1_valve.png', '1_burner.PNG'].every(filename => {
      return transformed!.code.includes(filename) || transformed!.code.includes(filename.replaceAll(' ', '%20'));
    });
    expect(allowedImports).toBe(true);
    expect(['1_confidential-fixture.png', '1_unknown-fixture.png', '1_nested-fixture.png', '3_notes.txt'].filter(filename => transformed!.code.includes(filename)), 'Excluded files never enter the import graph').toEqual([]);

    const asset = await page.request.get(new URL(first.src, baseURL).href);
    expect(asset.status()).toBe(200);
    expect(asset.headers()['content-type']).toContain('image/png');
    expect((await asset.body()).equals(fixtures.get('ultrasonic/2 overview.PNG')!), 'Discovered URL serves the test upload bytes').toBe(true);

    await page.goto('about:blank');
    await server.close();
    server = undefined;
    await build({
      root,
      configFile: false,
      cacheDir: join(root, '.vite-cache'),
      build: { outDir: 'dist', emptyOutDir: true, assetsInlineLimit: 0, manifest: true },
      logLevel: 'error',
    });
    const builtAssets = await readdir(join(root, 'dist/assets'));
    expect(builtAssets.filter(name => name.toLowerCase().endsWith('.png'))).toHaveLength(4);
    expect(forbiddenMarkers.filter(marker => builtAssets.some(name => name.includes(marker))), 'Forbidden uploads are not emitted').toEqual([]);
    const builtScripts = await Promise.all(builtAssets.filter(name => name.endsWith('.js')).map(name => readFile(join(root, 'dist/assets', name), 'utf8')));
    const manifest = await readFile(join(root, 'dist/.vite/manifest.json'), 'utf8');
    expect(forbiddenMarkers.filter(marker => [...builtScripts, manifest].some(code => code.includes(marker))), 'Forbidden uploads are not referenced by production output').toEqual([]);

    production = await preview({
      root,
      configFile: false,
      build: { outDir: 'dist' },
      preview: { host: '127.0.0.1', port: await unusedLoopbackPort(), strictPort: true },
      logLevel: 'error',
    });
    const productionAddress = production.httpServer.address();
    if (!productionAddress || typeof productionAddress === 'string') throw new Error('Production preview has no TCP address');
    const productionURL = `http://127.0.0.1:${productionAddress.port}`;
    await page.goto(productionURL);
    await page.waitForFunction(() => Boolean((window as unknown as { __projectCatalog?: unknown }).__projectCatalog));
    const builtCatalog: Catalog = await page.evaluate(() => (window as unknown as { __projectCatalog: Catalog }).__projectCatalog);
    expectCatalog(builtCatalog);
    const builtImage = await page.request.get(new URL(builtCatalog.ultrasonic[0].src, productionURL).href);
    expect(builtImage.status()).toBe(200);
    expect((await builtImage.body()).equals(fixtures.get('ultrasonic/2 overview.PNG')!), 'Production catalog keeps the correct numbered upload and original bytes').toBe(true);
  } finally {
    try {
      await page.close();
    } finally {
      try {
        await Promise.all([
          server?.close(),
          production && new Promise<void>((resolve, reject) => production!.httpServer.close(error => error ? reject(error) : resolve())),
        ]);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  }
});
