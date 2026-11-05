import { test, expect, type Locator, type Page } from '@playwright/test';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import type { AxeResults } from 'axe-core';

const require = createRequire(import.meta.url);
const title = 'Ultrasonic Invasive-Plant Control';
const projectTitles = { ultrasonic: title, aiaa: 'Rocket Engineering & Team Leadership', combustion: 'Sustainable-Fuel Combustion Research' };
const fixtures = {
  ultrasonic: Array.from({ length: 8 }, (_, index) => ({
    src: `/__gallery-fixtures__/ultrasonic-${index + 1}.svg`,
    alt: `Fixture view ${index + 1}`,
    caption: index === 1
      ? 'QA fixture caption 2: A deliberately long engineering concept description that stays fully visible in the full-image viewer at narrow widths, including this final sentence about the original uncropped drawing.'
      : `QA fixture caption ${index + 1}`,
    ...(index === 2 ? { credit: 'Test fixture credit' } : {}),
  })),
  aiaa: [{ src: '/__gallery-fixtures__/aiaa-1.svg', alt: 'Single fixture view', caption: 'QA single-image fixture' }],
  combustion: Array.from({ length: 8 }, (_, index) => ({ src: `/__gallery-fixtures__/combustion-${index + 1}.svg`, alt: `Tall fixture view ${index + 1}`, caption: `QA tall-image fixture ${index + 1}` })),
};
const browserErrors = new WeakMap<Page, string[]>();

function trackErrors(page: Page) {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on('pageerror', () => errors.push('Page error'));
  page.on('console', message => { if (message.type() === 'error') errors.push('Console error'); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} resource failure`); });
  page.on('requestfailed', () => errors.push('Resource request failed'));
}

function entry(page: Page, id: string) {
  return page.locator('.work-entry').filter({ has: page.locator(`#${id}-trigger`) });
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= innerWidth)).toBe(true);
}

async function expectThumbnailOnly(gallery: Locator) {
  await expect(gallery.locator('.gallery-preview, .gallery-featured-figure, .gallery-preview-controls')).toHaveCount(0);
  expect(await gallery.evaluate(element => [...element.querySelectorAll('img, figure')].every(child => child.closest('.gallery-strip, dialog'))), 'Images appear only in small thumbnails or the popup').toBe(true);
}

async function expectAccessible(page: Page) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => {
    const browser = window as typeof window & { axe: { run: (context: Document, options: object) => Promise<AxeResults> } };
    const result = await browser.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return result.violations.map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) }));
  });
  expect(violations).toEqual([]);
}

test.describe('project image galleries with test-only routed fixtures', () => {
  test.beforeEach(async ({ page }) => {
    trackErrors(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/__gallery-fixtures__/*', async route => {
      const filename = new URL(route.request().url()).pathname.split('/').at(-1)!;
      const tall = filename.startsWith('combustion');
      const width = tall ? 800 : 1200;
      const height = tall ? 1200 : 800;
      const body = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#243b4b"/><text x="40" y="90" font-family="Arial,sans-serif" font-size="44" fill="#f7f6f0">QA fixture: ${filename.replace('.svg', '')}</text></svg>`;
      await route.fulfill({ status: 200, contentType: 'image/svg+xml', body });
    });
    await page.route(/\/src\/project-images\.ts(?:\?|$)/, route => route.fulfill({
      status: 200, contentType: 'text/javascript',
      body: `const fixtures = ${JSON.stringify(fixtures)}; export function getProjectImages(id) { return fixtures[id] || []; }`,
    }));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
  });

  test.afterEach(async ({ page }) => {
    expect(browserErrors.get(page), 'Gallery browser and resource errors').toEqual([]);
  });

  test('initial gallery fragment navigation reaches the mounted gallery below the sticky header', async ({ page }) => {
    for (const width of [1440, 375, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/?v=gallery-fix#ultrasonic-images');
      await page.evaluate(() => document.fonts.ready);
      const gallery = page.locator('#ultrasonic-images');
      await expect(gallery).toBeVisible();
      await expect.poll(() => gallery.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const header = document.querySelector('header')!.getBoundingClientRect();
        return bounds.top >= header.bottom - 1 && bounds.top < innerHeight;
      })).toBe(true);
      await expect(gallery.locator('.gallery-thumbnail')).toHaveCount(8);
      await expectThumbnailOnly(gallery);
      await expect(page.locator('#ultrasonic-story')).toBeHidden();
    }
  });

  test('dialog keyboard navigation preserves the inline story and returns focus to its thumbnail', async ({ page }) => {
    const work = entry(page, 'ultrasonic');
    await work.locator('.detail-trigger').click();
    await expect(page.locator('#ultrasonic-story')).toBeVisible();
    const opener = work.locator('.gallery-thumbnail').nth(2);
    await expect(opener).toHaveAccessibleName(/Open image 3 of 8/);
    const previousOverflow = await page.evaluate(() => document.body.style.overflow);
    await opener.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: title, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close image viewer' })).toBeFocused();
    await expect(dialog.getByRole('img')).toHaveAttribute('alt', 'Fixture view 3');
    await expect(dialog.getByText('Test fixture credit', { exact: true })).toBeVisible();
    await expect(dialog.locator('.gallery-counter')).toHaveText('Image 3 of 8');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await dialog.getByRole('button', { name: 'Next image', exact: true }).click();
    await expect(dialog.locator('.gallery-counter')).toHaveText('Image 4 of 8');
    await dialog.getByRole('button', { name: 'Previous image', exact: true }).click();
    await expect(dialog.locator('.gallery-counter')).toHaveText('Image 3 of 8');
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('img')).toHaveAttribute('alt', 'Fixture view 4');
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.locator('.gallery-counter')).toHaveText('Image 3 of 8');
    for (let index = 0; index < 3; index++) await page.keyboard.press('ArrowLeft');
    await expect(dialog.locator('.gallery-counter')).toHaveText('Image 8 of 8');
    await page.keyboard.press('ArrowRight');
    await expect(dialog.locator('.gallery-counter')).toHaveText('Image 1 of 8');
    for (let index = 0; index < 4; index++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate(element => document.activeElement === document.body || element.contains(document.activeElement)), 'Tab does not reach background controls').toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(previousOverflow);
    await expect(page.locator('#ultrasonic-story')).toBeVisible();
    await opener.press('Enter');
    await dialog.getByRole('button', { name: 'Close image viewer' }).click();
    await expect(opener).toBeFocused();
    await expectThumbnailOnly(work.locator('.project-gallery'));
  });

  test('single-image projects share the thumbnail format and confidential work has no gallery', async ({ page }) => {
    await expect(entry(page, 'manifold').locator('.project-gallery')).toHaveCount(0);
    const aiaa = entry(page, 'aiaa').locator('.project-gallery');
    await expectThumbnailOnly(aiaa);
    const opener = aiaa.locator('.gallery-thumbnail');
    await expect(opener).toHaveCount(1);
    await expect(aiaa.locator('.gallery-scroll-controls')).toHaveCount(0);
    await opener.click();
    const dialog = aiaa.getByRole('dialog');
    await expect(dialog.locator('.gallery-counter')).toHaveText('Image 1 of 1');
    await expect(dialog.locator('.gallery-viewer-controls button')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
    await page.route(/\/src\/project-images\.ts(?:\?|$)/, route => route.fulfill({
      status: 200, contentType: 'text/javascript',
      body: `const fixtures = ${JSON.stringify({ ...fixtures, ultrasonic: fixtures.ultrasonic.slice(0, 1) })}; export function getProjectImages(id) { return fixtures[id] || []; }`,
    }));
    await page.reload();
    const senior = entry(page, 'ultrasonic').locator('.project-gallery');
    await expectThumbnailOnly(senior);
    await expect(senior.locator('.gallery-thumbnail')).toHaveCount(1);
    await expect(senior.locator('.gallery-scroll-controls')).toHaveCount(0);
    await senior.locator('.gallery-thumbnail').click();
    await expect(senior.locator('dialog .gallery-counter')).toHaveText('Image 1 of 1');
    await expect(senior.locator('.gallery-viewer-controls button')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(senior.locator('.gallery-thumbnail')).toBeFocused();
  });

  for (const width of [1440, 768, 375, 320]) {
    test(`uniform thumbnail strips and dialogs fit and pass accessibility checks at ${width}px`, async ({ page }) => {
      const height = width === 1440 ? 900 : 812;
      await page.setViewportSize({ width, height });
      const gallery = entry(page, 'ultrasonic').locator('.project-gallery');
      await gallery.scrollIntoViewIfNeeded();
      const frameSizes = [];
      for (const [id, projectTitle] of Object.entries(projectTitles)) {
        const work = entry(page, id);
        const images = work.locator('.project-gallery');
        await expectThumbnailOnly(images);
        await expect(images.locator('.gallery-thumbnail')).toHaveCount(fixtures[id as keyof typeof fixtures].length);
        frameSizes.push(await images.locator('.gallery-thumbnail-image').first().evaluate(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
        for (const thumbnail of await images.locator('.gallery-thumbnail').all()) {
          expect(await thumbnail.evaluate(element => {
            const image = element.querySelector('img')!.getBoundingClientRect();
            const frame = element.querySelector('.gallery-thumbnail-image')!.getBoundingClientRect();
            const caption = element.querySelector('.gallery-thumbnail-caption')!.getBoundingClientRect();
            return image.left >= frame.left && image.right <= frame.right
              && image.top >= frame.top && image.bottom <= frame.bottom && caption.top >= frame.bottom - 1;
          }), 'Thumbnail images stay within small frames and above their captions').toBe(true);
        }
        if (id !== 'aiaa') {
          const strip = images.locator('.gallery-strip');
          await expect.poll(() => strip.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
          const left = images.getByRole('button', { name: `Scroll ${projectTitle} images left`, exact: true });
          const right = images.getByRole('button', { name: `Scroll ${projectTitle} images right`, exact: true });
          await expect(left).toBeDisabled();
          await right.click();
          await expect.poll(() => strip.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
          await expect(left).toBeEnabled();
          await left.click();
          await expect.poll(() => strip.evaluate(element => element.scrollLeft)).toBeLessThan(2);
        }
        const preview = work.locator('.work-preview');
        expect(await preview.evaluate(element => {
          const panel = element.querySelector('.work-aside')!;
          const gallery = element.querySelector('.project-gallery')!;
          const trigger = element.querySelector('.detail-trigger')!;
          return Boolean(panel.compareDocumentPosition(gallery) & Node.DOCUMENT_POSITION_FOLLOWING)
            && Boolean(gallery.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING)
            && gallery.getBoundingClientRect().bottom <= trigger.getBoundingClientRect().top + 1;
        })).toBe(true);
        if (width < 760) expect(await preview.evaluate(element => element.querySelector('.work-aside')!.getBoundingClientRect().bottom <= element.querySelector('.project-gallery')!.getBoundingClientRect().top + 1)).toBe(true);
      }
      expect(new Set(frameSizes.map(size => `${size.width}:${size.height}`)).size, 'All projects share identical thumbnail sizing').toBe(1);
      expect(frameSizes[0].height).toBeLessThanOrEqual(112);
      await expectNoOverflow(page);
      await expectAccessible(page);
      if (process.env.PORTFOLIO_CAPTURE_GALLERY === '1' && [1440, 375].includes(width)) await gallery.screenshot({ path: `/workspace/artifacts/gallery-fixture-${width === 1440 ? 'desktop' : 'mobile'}.png` });
      const opener = gallery.locator('.gallery-thumbnail').first();
      await opener.click();
      const dialog = gallery.getByRole('dialog', { name: title, exact: true });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Next image', exact: true }).click();
      await expect(dialog.locator('figcaption > p').first()).toHaveText(fixtures.ultrasonic[1].caption);
      expect(await dialog.locator('figcaption').evaluate(element => element.scrollHeight <= element.clientHeight + 1), 'The popup displays the full caption').toBe(true);
      await expect.poll(() => dialog.getByRole('img').evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
      expect(await dialog.getByRole('img').evaluate(element => getComputedStyle(element).objectFit)).toBe('contain');
      const box = (await dialog.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y + box.height).toBeLessThanOrEqual(height);
      await expectNoOverflow(page);
      await expectAccessible(page);
      if (process.env.PORTFOLIO_CAPTURE_GALLERY === '1' && [1440, 375].includes(width)) await dialog.screenshot({ path: `/workspace/artifacts/gallery-dialog-fixture-${width === 1440 ? 'desktop' : 'mobile'}.png` });
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await expect(dialog.locator('.gallery-counter')).toHaveText('Image 8 of 8');
      await page.keyboard.press('Escape');
      await expect(opener).toBeFocused();
      expect(await opener.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const strip = element.closest('.gallery-strip')!.getBoundingClientRect();
        return bounds.left >= strip.left && bounds.right <= strip.right && bounds.left >= 0 && bounds.right <= innerWidth;
      }), 'The original thumbnail remains fully visible after modal navigation').toBe(true);
      await expectNoOverflow(page);
      await expectThumbnailOnly(gallery);
    });
  }

  test('native horizontal touch swipes scroll the thumbnail strip without opening the popup', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const gallery = entry(page, 'ultrasonic').locator('.project-gallery');
    const strip = gallery.locator('.gallery-strip');
    await strip.scrollIntoViewIfNeeded();
    const bounds = (await strip.boundingBox())!;
    const y = bounds.y + 40;
    const session = await context.newCDPSession(page);
    async function swipe(start: number, end: number) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start, y, id: 1 }] });
      for (let step = 1; step <= 8; step++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start + (end - start) * step / 8, y, id: 1 }] });
        await page.waitForTimeout(16);
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    try {
      await swipe(bounds.x + bounds.width * .8, bounds.x + bounds.width * .2);
      await expect.poll(() => strip.evaluate(element => element.scrollLeft)).toBeGreaterThan(20);
      await expect(gallery.locator('dialog')).toBeHidden();
      const afterLeft = await strip.evaluate(element => element.scrollLeft);
      await swipe(bounds.x + bounds.width * .2, bounds.x + bounds.width * .8);
      await expect.poll(() => strip.evaluate(element => element.scrollLeft)).toBeLessThan(afterLeft - 20);
      await expect(gallery.locator('dialog')).toBeHidden();
      const opener = gallery.locator('.gallery-thumbnail').first();
      await opener.focus();
      await opener.press('Enter');
      await expect(gallery.locator('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(opener).toBeFocused();
      await expectNoOverflow(page);
    } finally {
      await session.detach();
    }
  });
});

test('the six actual Senior uploads render only as ordered thumbnails and open their original images', async ({ page }) => {
  trackErrors(page);
  const names = ['01-boat-cad-angled.png', '02-boat-cad-underside.png', '03-concept-5-sketch.png', '04-concept-2-alternative.png', '05-transducer-test-rig.png', 'ME_team58.jpg'];
  const captions = require('../src/gallery-captions.json').ultrasonic;
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/?v=thumbnails#ultrasonic-images');
    await page.evaluate(() => document.fonts.ready);
    const gallery = page.locator('#ultrasonic-images');
    await expectThumbnailOnly(gallery);
    await expect(page.locator('#ultrasonic-story')).toBeHidden();
    await expect(gallery.locator('.gallery-thumbnail')).toHaveCount(6);
    const paths = await gallery.locator('.gallery-thumbnail img').evaluateAll(images => images.map(image => (image as HTMLImageElement).src));
    expect(paths.map(path => decodeURIComponent(new URL(path).pathname).split('/').at(-1))).toEqual(names);
    for (let index = 0; index < names.length; index++) {
      const thumbnail = gallery.locator('.gallery-thumbnail').nth(index);
      await thumbnail.scrollIntoViewIfNeeded();
      await expect.poll(() => thumbnail.locator('img').evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
      if (width === 1440) {
        const response = await page.request.get(paths[index]);
        expect(response.status()).toBe(200);
        const original = await readFile(new URL(`../src/assets/projects/ultrasonic/${names[index]}`, import.meta.url));
        expect((await response.body()).equals(original), 'Every actual gallery image serves its uploaded bytes unchanged').toBe(true);
      }
    }
    await gallery.locator('.gallery-strip').evaluate(element => element.scrollTo({ left: 0, behavior: 'instant' }));
    await expectAccessible(page);
    if (process.env.PORTFOLIO_CAPTURE_GALLERY === '1') await gallery.screenshot({ path: `/workspace/artifacts/senior-real-${width === 1440 ? 'desktop' : 'mobile'}.png` });
    const opener = gallery.locator('.gallery-thumbnail').first();
    await opener.click();
    const dialog = gallery.getByRole('dialog');
    await expect(dialog.getByRole('img')).toHaveAttribute('src', paths[0].replace(new URL(paths[0]).origin, ''));
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.locator('.gallery-counter')).toHaveText('Image 6 of 6');
    await expect(dialog.locator('figcaption > p').first()).toHaveText(captions['06-team-photo.jpg'].caption);
    await expect(dialog.getByRole('img')).toHaveAttribute('alt', captions['06-team-photo.jpg'].alt);
    expect(await dialog.getByRole('img').evaluate(element => getComputedStyle(element).objectFit)).toBe('contain');
    await expectAccessible(page);
    if (process.env.PORTFOLIO_CAPTURE_GALLERY === '1') await dialog.screenshot({ path: `/workspace/artifacts/senior-real-dialog-${width === 1440 ? 'desktop' : 'mobile'}.png` });
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
    await expectNoOverflow(page);
    await expectThumbnailOnly(gallery);
  }
  expect(browserErrors.get(page), 'Actual gallery browser and resource errors').toEqual([]);
});

const aiaaUploadNames = [
  'Hotfiretestflamephoto.JPG',
  'Hotfireteststandphoto.jpg',
  'CAD ethanol side start with tank.png',
  'Ethanol Fluid system.jpg',
  'Nitrous Fluid Piping.jpg',
  'Lockheed event.JPG',
];

for (const width of [1440, 768, 375, 320]) {
  test(`the six actual AIAA uploads keep full thumbnail captions and accessible original-image viewing at ${width}px`, async ({ page }) => {
    trackErrors(page);
    const height = width === 1440 ? 900 : 812;
    const captions = require('../src/gallery-captions.json').aiaa;
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?v=aiaa-gallery#aiaa-images');
    await page.evaluate(() => document.fonts.ready);
    const gallery = page.locator('#aiaa-images');
    await expectThumbnailOnly(gallery);
    await expect(gallery).toHaveClass(/gallery-wrap-captions/);
    await expect(page.locator('#ultrasonic-images')).not.toHaveClass(/gallery-wrap-captions/);
    await expect(page.locator('#aiaa-story')).toBeHidden();
    await expect(page.locator('#aiaa-trigger')).toHaveAttribute('aria-expanded', 'false');
    await expect(entry(page, 'aiaa').locator('video, iframe')).toHaveCount(0);
    await expect(gallery.locator('.gallery-thumbnail')).toHaveCount(6);
    const paths = await gallery.locator('.gallery-thumbnail img').evaluateAll(images => images.map(image => (image as HTMLImageElement).src));
    expect(paths.map(path => decodeURIComponent(new URL(path).pathname).split('/').at(-1))).toEqual(aiaaUploadNames);

    for (let index = 0; index < aiaaUploadNames.length; index++) {
      const thumbnail = gallery.locator('.gallery-thumbnail').nth(index);
      const metadata = captions[aiaaUploadNames[index]];
      expect(Boolean(metadata?.caption && metadata?.alt), 'Each actual AIAA image has its supplied caption and alt text').toBe(true);
      await thumbnail.scrollIntoViewIfNeeded();
      await expect.poll(() => thumbnail.locator('img').evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
      await expect(thumbnail.locator('.gallery-thumbnail-caption')).toHaveText(metadata.caption);
      expect((await thumbnail.getAttribute('aria-label'))?.includes(metadata.caption), 'The thumbnail name includes its visible caption').toBe(true);
      expect(await thumbnail.evaluate(element => {
        const image = element.querySelector('img')!;
        const imageBounds = image.getBoundingClientRect();
        const frame = element.querySelector('.gallery-thumbnail-image')!.getBoundingClientRect();
        const caption = element.querySelector('.gallery-thumbnail-caption')!;
        const bounds = caption.getBoundingClientRect();
        const style = getComputedStyle(caption);
        return getComputedStyle(image).objectFit === 'contain'
          && imageBounds.left >= frame.left && imageBounds.right <= frame.right
          && imageBounds.top >= frame.top && imageBounds.bottom <= frame.bottom
          && frame.height <= 112 && bounds.top >= frame.bottom - 1
          && caption.scrollHeight <= caption.clientHeight + 1
          && style.display === 'block' && style.overflowY === 'visible'
          && style.whiteSpace === 'normal';
      }), 'AIAA images remain in compact frames and complete captions wrap below them').toBe(true);
      if (width === 1440) {
        const response = await page.request.get(paths[index]);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toMatch(/^image\/(?:jpeg|png)$/);
        const original = await readFile(new URL(`../src/assets/projects/aiaa/${aiaaUploadNames[index]}`, import.meta.url));
        expect((await response.body()).equals(original), 'AIAA photographs, CAD, and whiteboards retain their uploaded bytes').toBe(true);
      }
    }

    const firstFrameHeight = await gallery.locator('.gallery-thumbnail-image').first().evaluate(element => element.getBoundingClientRect().height);
    expect(firstFrameHeight).toBe(await page.locator('#ultrasonic-images .gallery-thumbnail-image').first().evaluate(element => element.getBoundingClientRect().height));
    await gallery.locator('.gallery-strip').evaluate(element => element.scrollTo({ left: 0, behavior: 'instant' }));
    await expectNoOverflow(page);
    await expectAccessible(page);
    const capture = process.env.PORTFOLIO_CAPTURE_GALLERY === '1' && [1440, 375].includes(width);
    const device = width === 1440 ? 'desktop' : 'mobile';
    if (capture) await gallery.screenshot({ path: `/workspace/artifacts/aiaa-real-${device}.png` });
    const opener = gallery.locator('.gallery-thumbnail').first();
    await opener.scrollIntoViewIfNeeded();
    await opener.focus();
    await opener.press('Enter');
    const dialog = gallery.getByRole('dialog', { name: projectTitles.aiaa, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.gallery-counter')).toHaveText('Image 1 of 6');
    await expect(dialog.getByRole('img')).toHaveAttribute('src', paths[0].replace(new URL(paths[0]).origin, ''));
    await expect(dialog.getByRole('img')).toHaveAttribute('alt', captions[aiaaUploadNames[0]].alt);
    await expect(dialog.locator('figcaption > p').first()).toHaveText(captions[aiaaUploadNames[0]].caption);
    await expect(dialog.getByRole('button', { name: 'Close image viewer' })).toBeFocused();
    if (capture) await dialog.screenshot({ path: `/workspace/artifacts/aiaa-real-dialog-${device}.png` });
    await dialog.getByRole('button', { name: 'Next image', exact: true }).click();

    for (let index = 1; index < aiaaUploadNames.length; index++) {
      await expect(dialog.locator('.gallery-counter')).toHaveText(`Image ${index + 1} of 6`);
      await expect(dialog.getByRole('img')).toHaveAttribute('src', paths[index].replace(new URL(paths[index]).origin, ''));
      await expect(dialog.getByRole('img')).toHaveAttribute('alt', captions[aiaaUploadNames[index]].alt);
      await expect(dialog.locator('figcaption > p').first()).toHaveText(captions[aiaaUploadNames[index]].caption);
      await expect.poll(() => dialog.getByRole('img').evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
      expect(await dialog.getByRole('img').evaluate(element => getComputedStyle(element).objectFit)).toBe('contain');
      const bounds = (await dialog.boundingBox())!;
      expect(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= height, 'The native viewer remains within the viewport').toBe(true);
      if (index === 2 && capture) await dialog.screenshot({ path: `/workspace/artifacts/aiaa-real-cad-${device}.png` });
      if (index === 3) {
        await expectAccessible(page);
        if (capture) await dialog.screenshot({ path: `/workspace/artifacts/aiaa-real-whiteboard-${device}.png` });
      }
      if (index < aiaaUploadNames.length - 1) await page.keyboard.press('ArrowRight');
    }
    await page.keyboard.press('ArrowRight');
    await expect(dialog.locator('.gallery-counter')).toHaveText('Image 1 of 6');
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.locator('.gallery-counter')).toHaveText('Image 6 of 6');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(page.locator('#aiaa-story')).toBeHidden();
    await expectThumbnailOnly(gallery);
    await expectNoOverflow(page);
    expect(browserErrors.get(page), 'Actual AIAA browser and resource errors').toEqual([]);
  });
}
