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

const featuredImages = [
  {
    filename: '01-boat-cad-angled.png',
    alt: 'Angled CAD view of the preliminary team boat concept. Modeled by a teammate.',
    caption: 'Preliminary team boat concept. CAD modeled by a teammate.',
  },
  {
    filename: '02-boat-cad-underside.png',
    alt: 'Underside CAD view of the preliminary boat concept, including the proposed grate and transducer arrangement.',
    caption: 'Underside view of the preliminary boat concept, showing the proposed grate and transducer arrangement. CAD modeled by a teammate.',
  },
  {
    filename: '03-concept-5-sketch.png',
    alt: "Alex Yuan's Concept 5 sketch showing a grate positioning plant stems beneath downward-facing transducers.",
    caption: 'My treatment concept using a grate to position plant stems beneath downward-facing transducers.',
  },
  {
    filename: '04-concept-2-alternative.png',
    alt: 'Concept 2 top and side sketches of a channel-based treatment alternative, with the original drawing-app toolbar intact.',
    caption: 'Alternative channel-based treatment concept considered during design selection. Potential stem tangling was a concern.',
  },
  {
    filename: '05-transducer-test-rig.png',
    alt: 'Team CAD model of a proposed adjustable transducer test rig.',
    caption: 'Proposed adjustable test rig for positioning the transducer during plant-treatment experiments. Team CAD model.',
  },
];
const teamMetadata = {
  alt: 'UConn senior design team portrait. Alex Yuan is second from the left.',
  caption: 'UConn senior design team, working with Windham Water Works. I am second from the left and serve as team manager.',
};

function expectCatalog(catalog: Catalog, includeTeam: boolean) {
  expect(Object.fromEntries(Object.entries(catalog).map(([id, images]) => [id, images.length]))).toEqual({
    ultrasonic: includeTeam ? 6 : 5, aiaa: 2, combustion: 1, manifold: 0, unknown: 0,
  });
  expect(catalog.ultrasonic.slice(0, 5).map(({ alt, caption }) => ({ alt, caption })), 'Featured image metadata is preserved in the five-image order').toEqual(featuredImages.map(({ alt, caption }) => ({ alt, caption })));
  if (includeTeam) {
    expect(catalog.ultrasonic[5]).toMatchObject(teamMetadata);
  }
  const first = catalog.aiaa[0];
  expect(first.alt === 'Fixture - overview' && first.caption === 'Fixture - caption' && first.credit === 'Test team', 'Numeric upload order and normalized metadata are preserved').toBe(true);
  const fallback = catalog.aiaa[1];
  expect(fallback.alt === 'detail' && fallback.caption === 'detail' && !('credit' in fallback), 'Uploads work without optional metadata').toBe(true);
  expect(catalog.combustion[0].caption === 'burner', 'Each permitted project gets filename-based labels').toBe(true);
}

test('Vite builds the five featured uploads and optional sixth team alias while excluding confidential files', async ({ page }) => {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-project-images-'));
  let server: ViteDevServer | undefined;
  let production: PreviewServer | undefined;
  const imageFiles = [
    ...featuredImages.map(({ filename }) => `ultrasonic/${filename}`),
    'aiaa/2 overview.PNG',
    'aiaa/10_detail.png',
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
    for (const { filename, ...metadata } of featuredImages) {
      expect(captions.ultrasonic[filename], 'Real source metadata matches the approved featured image').toEqual(metadata);
    }
    expect(captions.ultrasonic['06-team-photo.jpg'], 'Pending team metadata is copied from the real catalog').toEqual(teamMetadata);
    captions.aiaa = {
      ...captions.aiaa,
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

    for (const includeTeam of [false, true]) {
      if (includeTeam) {
        await page.setContent('<!doctype html><html><body style="margin:0;background:#243a55"></body></html>');
        const teamPhoto = await page.screenshot({ type: 'jpeg', clip: { x: 0, y: 0, width: 1, height: 1 } });
        fixtures.set('ultrasonic/Team 58.JPG', teamPhoto);
        await writeFile(join(root, 'src/assets/projects/ultrasonic/Team 58.JPG'), teamPhoto);
      }
      server = await createServer({
        root,
        configFile: false,
        cacheDir: join(root, '.vite-cache'),
        server: { host: '127.0.0.1', port: await unusedLoopbackPort(), strictPort: true, fs: { allow: [root] } },
        optimizeDeps: { noDiscovery: true },
        logLevel: 'error',
      });
      await server.listen();
      const address = server.httpServer?.address();
      if (!address || typeof address === 'string') throw new Error('Temporary Vite server has no TCP address');
      const baseURL = `http://127.0.0.1:${address.port}`;
      await page.goto(baseURL);
      await page.waitForFunction(() => Boolean((window as unknown as { __projectCatalog?: unknown }).__projectCatalog));
      const catalog: Catalog = await page.evaluate(() => (window as unknown as { __projectCatalog: Catalog }).__projectCatalog);
      expectCatalog(catalog, includeTeam);
      const filenames = (images: Catalog[string]) => images.map(image => decodeURIComponent(new URL(image.src, baseURL).pathname).split('/').at(-1));
      expect(filenames(catalog.ultrasonic)).toEqual([...featuredImages.map(({ filename }) => filename), ...(includeTeam ? ['Team 58.JPG'] : [])]);
      expect(filenames(catalog.aiaa)).toEqual(['2 overview.PNG', '10_detail.png']);

      const transformed = await server.transformRequest('/src/project-images.ts');
      expect(Boolean(transformed), 'Real Vite glob transformation succeeds').toBe(true);
      const allowedNames = [...featuredImages.map(({ filename }) => filename), '2 overview.PNG', '10_detail.png', '1_burner.PNG', ...(includeTeam ? ['Team 58.JPG'] : [])];
      expect(allowedNames.every(filename => transformed!.code.includes(filename) || transformed!.code.includes(filename.replaceAll(' ', '%20')))).toBe(true);
      expect(['1_confidential-fixture.png', '1_unknown-fixture.png', '1_nested-fixture.png', '3_notes.txt'].filter(filename => transformed!.code.includes(filename)), 'Excluded files never enter the import graph').toEqual([]);

      const asset = await page.request.get(new URL(catalog.aiaa[0].src, baseURL).href);
      expect(asset.status()).toBe(200);
      expect(asset.headers()['content-type']).toContain('image/png');
      expect((await asset.body()).equals(fixtures.get('aiaa/2 overview.PNG')!), 'Discovered URL serves the test upload bytes').toBe(true);

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
      expect(builtAssets.filter(name => /\.(?:png|jpg)$/i.test(name))).toHaveLength(includeTeam ? 9 : 8);
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
      expectCatalog(builtCatalog, includeTeam);
      for (const [project, images] of Object.entries(builtCatalog)) {
        for (let index = 0; index < images.length; index += 1) {
          const original = `${project}/${filenames(catalog[project])[index]}`;
          const builtImage = await page.request.get(new URL(images[index].src, productionURL).href);
          expect(builtImage.status()).toBe(200);
          expect((await builtImage.body()).equals(fixtures.get(original)!), 'Production catalog keeps upload order and exact original bytes').toBe(true);
        }
      }
      await page.goto('about:blank');
      await new Promise<void>((resolve, reject) => production!.httpServer.close(error => error ? reject(error) : resolve()));
      production = undefined;
    }
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
