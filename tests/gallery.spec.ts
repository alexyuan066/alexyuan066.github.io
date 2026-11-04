import { test, expect, type Page } from '@playwright/test';
import { createRequire } from 'node:module';
import type { AxeResults } from 'axe-core';

const require = createRequire(import.meta.url);
const title = 'Ultrasonic Invasive-Plant Control';
const fixtures = {
  ultrasonic: Array.from({ length: 8 }, (_, index) => ({
    src: `/__gallery-fixtures__/ultrasonic-${index + 1}.svg`,
    alt: `Fixture view ${index + 1}`,
    caption: index === 1
      ? 'QA fixture caption 2: A deliberately long engineering concept description that stays fully visible below the preview at narrow widths, including this final sentence about the original uncropped drawing.'
      : `QA fixture caption ${index + 1}`,
    ...(index === 2 ? { credit: 'Test fixture credit' } : {}),
  })),
  aiaa: [{ src: '/__gallery-fixtures__/aiaa-1.svg', alt: 'Single fixture view', caption: 'QA single-image fixture' }],
  combustion: Array.from({ length: 8 }, (_, index) => ({ src: `/__gallery-fixtures__/combustion-${index + 1}.svg`, alt: `Tall fixture view ${index + 1}`, caption: `QA tall-image fixture ${index + 1}` })),
};
const browserErrors = new WeakMap<Page, string[]>();

function entry(page: Page, id: string) {
  return page.locator('.work-entry').filter({ has: page.locator(`#${id}-trigger`) });
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= innerWidth)).toBe(true);
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
    const errors: string[] = [];
    browserErrors.set(page, errors);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} resource failure`); });
    page.on('requestfailed', request => errors.push(request.failure()?.errorText || 'Resource request failed'));
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
      status: 200,
      contentType: 'text/javascript',
      body: `const fixtures = ${JSON.stringify(fixtures)}; export function getProjectImages(id) { return fixtures[id] || []; }`,
    }));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
  });

  test.afterEach(async ({ page }) => {
    expect(browserErrors.get(page), 'Gallery browser and resource errors').toEqual([]);
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
  });

  test('single-image galleries retain the right controls and confidential work has no gallery', async ({ page }) => {
    await expect(entry(page, 'manifold').locator('.project-gallery')).toHaveCount(0);
    for (const id of ['aiaa', 'combustion']) {
      await expect(entry(page, id).locator('.gallery-preview')).toHaveCount(0);
      await expect(entry(page, id).locator('.gallery-preview-controls')).toHaveCount(0);
      await expect(entry(page, id).locator('.project-gallery.is-featured')).toHaveCount(0);
    }
    const opener = entry(page, 'aiaa').locator('.gallery-thumbnail');
    await expect(opener).toHaveCount(1);
    await expect(entry(page, 'aiaa').locator('.gallery-scroll-controls')).toHaveCount(0);
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Rocket Engineering & Team Leadership', exact: true });
    await expect(dialog.locator('.gallery-counter')).toHaveText('Image 1 of 1');
    await expect(dialog.getByRole('button', { name: 'Previous image', exact: true })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Next image', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();

    await page.route(/\/src\/project-images\.ts(?:\?|$)/, route => route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: `const fixtures = ${JSON.stringify({ ...fixtures, ultrasonic: fixtures.ultrasonic.slice(0, 1) })}; export function getProjectImages(id) { return fixtures[id] || []; }`,
    }));
    await page.reload();
    const featured = entry(page, 'ultrasonic').locator('.project-gallery');
    await expect(featured.locator('.gallery-preview-controls')).toBeVisible();
    await expect(featured.locator('.gallery-preview-controls .gallery-counter')).toHaveText('Image 1 of 1');
    for (const button of await featured.locator('.gallery-preview-controls button').all()) await expect(button).toBeDisabled();
    await featured.locator('.gallery-preview').click();
    await expect(featured.locator('dialog')).toBeVisible();
    await expect(featured.locator('dialog .gallery-counter')).toHaveText('Image 1 of 1');
    await expect(featured.locator('.gallery-viewer-controls button')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(featured.locator('.gallery-preview')).toBeFocused();
  });

  for (const width of [1440, 768, 375, 320]) {
    test(`Senior preview, gallery strips, and dialogs fit and pass accessibility checks at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 812 });
      const work = entry(page, 'ultrasonic');
      const gallery = work.locator('.project-gallery');
      await gallery.scrollIntoViewIfNeeded();
      await expect(gallery).toHaveClass(/is-featured/);
      await expect(gallery.locator('.gallery-thumbnail')).toHaveCount(8);
      const preview = gallery.locator('.gallery-preview');
      const controls = gallery.locator('.gallery-preview-controls');
      const counter = controls.locator('.gallery-counter');
      await expect(controls).toBeVisible();
      await expect(counter).toHaveText('Image 1 of 8');
      await expect(preview.locator('img')).toHaveAttribute('src', fixtures.ultrasonic[0].src);
      await expect(gallery.locator('.gallery-thumbnail[aria-current="true"]')).toHaveAccessibleName(/Open image 1 of 8/);
      const previous = controls.getByRole('button', { name: `Previous ${title} image`, exact: true });
      const next = controls.getByRole('button', { name: `Next ${title} image`, exact: true });
      await expect(previous).toBeEnabled();
      await expect(next).toBeEnabled();
      await next.click();
      await expect(counter).toHaveText('Image 2 of 8');
      await expect(gallery.locator('.gallery-featured-caption > p').first()).toHaveText(fixtures.ultrasonic[1].caption);
      expect(await gallery.locator('.gallery-featured-caption').evaluate(element => {
        const style = getComputedStyle(element);
        const caption = element.querySelector('p')!;
        return style.overflowY === 'visible' && caption.scrollHeight <= caption.clientHeight + 1
          && getComputedStyle(caption).getPropertyValue('-webkit-line-clamp') === 'none';
      }), 'Full preview captions remain untruncated').toBe(true);
      await preview.focus();
      await page.keyboard.press('ArrowRight');
      await expect(counter).toHaveText('Image 3 of 8');
      await page.keyboard.press('ArrowLeft');
      await expect(counter).toHaveText('Image 2 of 8');
      await previous.click();
      await expect(counter).toHaveText('Image 1 of 8');
      await previous.click();
      await expect(counter).toHaveText('Image 8 of 8');
      await next.click();
      await expect(counter).toHaveText('Image 1 of 8');
      await expect.poll(() => preview.locator('img').evaluate(element => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
      expect(await preview.locator('img').evaluate(element => {
        const image = element as HTMLImageElement;
        const style = getComputedStyle(image);
        const parent = image.parentElement!.getBoundingClientRect();
        const bounds = image.getBoundingClientRect();
        return style.objectFit === 'contain' && bounds.width > 0 && bounds.height > 0
          && bounds.left >= parent.left && bounds.right <= parent.right
          && bounds.top >= parent.top && bounds.bottom <= parent.bottom;
      }), 'Featured images remain uncropped within the preview').toBe(true);

      // The other galleries retain their original horizontal-strip navigation.
      const ordinaryGallery = entry(page, 'combustion').locator('.project-gallery');
      const strip = ordinaryGallery.locator('.gallery-strip');
      await expect.poll(() => strip.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
      const left = ordinaryGallery.getByRole('button', { name: 'Scroll Sustainable-Fuel Combustion Research images left', exact: true });
      const right = ordinaryGallery.getByRole('button', { name: 'Scroll Sustainable-Fuel Combustion Research images right', exact: true });
      await expect(left).toBeDisabled();
      await right.click();
      await expect.poll(() => strip.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      await expect(left).toBeEnabled();
      await left.click();
      await expect.poll(() => strip.evaluate(element => element.scrollLeft)).toBeLessThan(2);
      for (const id of ['ultrasonic', 'aiaa', 'combustion']) {
        const preview = entry(page, id).locator('.work-preview');
        expect(await preview.evaluate(element => {
          const panel = element.querySelector('.work-aside')!;
          const gallery = element.querySelector('.project-gallery')!;
          const trigger = element.querySelector('.detail-trigger')!;
          return Boolean(panel.compareDocumentPosition(gallery) & Node.DOCUMENT_POSITION_FOLLOWING)
            && Boolean(gallery.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING)
            && gallery.getBoundingClientRect().bottom <= trigger.getBoundingClientRect().top + 1;
        })).toBe(true);
        if (width < 760) {
          expect(await preview.evaluate(element => element.querySelector('.work-aside')!.getBoundingClientRect().bottom <= element.querySelector('.project-gallery')!.getBoundingClientRect().top + 1)).toBe(true);
        }
      }
      await expectNoOverflow(page);
      await expectAccessible(page);
      if (process.env.PORTFOLIO_CAPTURE_GALLERY === '1' && [1440, 375].includes(width)) {
        await gallery.screenshot({ path: `/workspace/artifacts/gallery-fixture-${width === 1440 ? 'desktop' : 'mobile'}.png` });
      }
      const opener = preview;
      await opener.click();
      const dialog = page.getByRole('dialog', { name: title, exact: true });
      await expect(dialog).toBeVisible();
      await expect.poll(() => dialog.getByRole('img').evaluate(element => {
        const image = element as HTMLImageElement;
        return image.complete && image.naturalWidth > 0;
      })).toBe(true);
      expect(await dialog.getByRole('img').evaluate(element => getComputedStyle(element).objectFit)).toBe('contain');
      const box = (await dialog.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(box.y + box.height).toBeLessThanOrEqual(width === 1440 ? 900 : 812);
      await expectNoOverflow(page);
      await expectAccessible(page);
      if (process.env.PORTFOLIO_CAPTURE_GALLERY === '1' && [1440, 375].includes(width)) {
        await dialog.screenshot({ path: `/workspace/artifacts/gallery-dialog-fixture-${width === 1440 ? 'desktop' : 'mobile'}.png` });
      }
      await page.keyboard.press('Escape');
      await expect(opener).toBeFocused();
      await expectNoOverflow(page);
      const thumbnailOpener = gallery.locator('.gallery-thumbnail').first();
      await thumbnailOpener.click();
      await page.keyboard.press('ArrowLeft');
      await expect(dialog.locator('.gallery-counter')).toHaveText('Image 8 of 8');
      await page.keyboard.press('Escape');
      await expect(thumbnailOpener).toBeFocused();
      expect(await thumbnailOpener.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const strip = element.closest('.gallery-strip')!.getBoundingClientRect();
        return bounds.left >= strip.left && bounds.right <= strip.right
          && bounds.left >= 0 && bounds.right <= innerWidth;
      }), 'The original thumbnail remains fully visible after modal navigation').toBe(true);
      await expect(counter).toHaveText('Image 8 of 8');
    });
  }

  test('Senior preview supports horizontal touch swipes without opening the full-image viewer', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const gallery = entry(page, 'ultrasonic').locator('.project-gallery');
    const preview = gallery.locator('.gallery-preview');
    const counter = gallery.locator('.gallery-preview-controls .gallery-counter');
    await preview.scrollIntoViewIfNeeded();
    const bounds = (await preview.boundingBox())!;
    const x = bounds.x + bounds.width * .65;
    const y = bounds.y + bounds.height * .5;
    const session = await context.newCDPSession(page);
    async function swipe(distance: number) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      for (const portion of [.25, .5, .75, 1]) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + distance * portion, y, id: 1 }] });
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    try {
      await swipe(-60);
      await expect(counter).toHaveText('Image 2 of 8');
      await expect(gallery.locator('dialog')).toBeHidden();
      await swipe(60);
      await expect(counter).toHaveText('Image 1 of 8');
      await expect(gallery.locator('dialog')).toBeHidden();
      await swipe(-39);
      await expect(counter).toHaveText('Image 1 of 8');
      await expect(gallery.locator('dialog')).toBeHidden();
      // Keyboard activation remains available immediately after a swipe.
      await preview.press('Enter');
      await expect(gallery.locator('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(preview).toBeFocused();
      await expectNoOverflow(page);
    } finally {
      await session.detach();
    }
  });
});
