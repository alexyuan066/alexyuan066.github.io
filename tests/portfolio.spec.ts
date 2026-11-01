import { test, expect, type Page } from '@playwright/test';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import type { AxeResults } from 'axe-core';
import { parseContactConfig } from '../src/contact-config';

const require = createRequire(import.meta.url);
const configuredContact = parseContactConfig(require('../src/contact.json'));
const entries = [
  { id: 'ultrasonic', title: 'Ultrasonic Invasive-Plant Control' },
  { id: 'aiaa', title: 'Rocket Engineering & Team Leadership' },
  { id: 'combustion', title: 'Sustainable-Fuel Combustion Research' },
  { id: 'manifold', title: 'Water-Electrolysis Manifold Redesign' },
];
const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
});

test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page), 'Browser, network, and console errors').toEqual([]);
});

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    content: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
}

async function expectAccessible(page: Page) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const result = await page.evaluate(async () => {
    const browser = window as typeof window & {
      axe: { run: (context: Document, options: object) => Promise<AxeResults> };
    };
    return browser.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
  });
  expect(result.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    elements: violation.nodes.map(node => node.target),
  }))).toEqual([]);
}

test('navigation reaches real sections and all destinations are valid', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [name, id] of [['Work', 'work'], ['About', 'about'], ['Resume', 'resume'], ['Contact', 'contact']]) {
    await page.getByRole('navigation').getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect.poll(async () => page.locator(`#${id}`).evaluate(element => {
      const bounds = element.getBoundingClientRect();
      const headerBottom = document.querySelector('header')!.getBoundingClientRect().bottom;
      return bounds.top >= headerBottom - 1 && bounds.top < window.innerHeight && bounds.bottom > headerBottom;
    })).toBe(true);
  }
  await page.getByRole('link', { name: 'Back to top', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(100);

  const invalidDestinations = await page.locator('a').evaluateAll(links => links.flatMap(link => {
    const href = link.getAttribute('href') || '';
    if (!href || href === '#' || /^(javascript:|https?:\/\/(example\.|your-))/i.test(href)) return [href];
    if (href.startsWith('#') && !document.getElementById(href.slice(1))) return [href];
    return [];
  }));
  expect(invalidDestinations).toEqual([]);
});

test('contact links match validated optional settings and LinkedIn opens in a new tab', async ({ page }) => {
  const contact = page.locator('#contact');
  await expect(contact.locator('a[href^="mailto:"]')).toHaveCount(Number(Boolean(configuredContact.emailHref)));
  await expect(contact.locator('a[href^="tel:"]')).toHaveCount(Number(Boolean(configuredContact.phoneHref)));
  const linkedIn = contact.getByRole('link', { name: 'LinkedIn', exact: true });
  await expect(linkedIn).toHaveCount(Number(Boolean(configuredContact.linkedIn)));
  const linkCount = [configuredContact.emailHref, configuredContact.phoneHref, configuredContact.linkedIn].filter(Boolean).length;
  await expect(contact.getByRole('link')).toHaveCount(linkCount);
  await expect(contact.getByRole('button')).toHaveCount(0);
  await expect(contact.locator('.contact-pending')).toHaveCount(linkCount === 0 ? 1 : 0);
  if (configuredContact.linkedIn) {
    await expect(linkedIn).toHaveAttribute('target', '_blank');
    await expect(linkedIn).toHaveAttribute('rel', 'noreferrer');
  }
});

test('the resume link serves and downloads the configured local file exactly', async ({ page }) => {
  test.skip(!configuredContact.resume?.startsWith('/'), 'No local resume is configured');
  const resumeLink = page.locator('#resume').getByRole('link', { name: 'Download resume', exact: true });
  await expect(resumeLink).toHaveCount(1);
  await expect(resumeLink).toHaveAttribute('download', '');
  const href = await resumeLink.getAttribute('href');
  expect(href === configuredContact.resume, 'Resume link uses the validated configured path').toBe(true);
  expect(Boolean(href?.startsWith('/') && !href.includes(' '))).toBe(true);
  const resumeURL = new URL(href!, page.url());
  const response = await page.request.get(resumeURL.href);
  expect(response.status()).toBe(200);
  const served = await response.body();
  if (resumeURL.pathname.toLowerCase().endsWith('.docx')) {
    expect(served.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])), 'Resume is a Word ZIP package').toBe(true);
  }
  const original = await readFile(new URL(`../public${resumeURL.pathname}`, import.meta.url));
  expect(served.equals(original), 'Served resume bytes match the uploaded file').toBe(true);

  const downloadPromise = page.waitForEvent('download');
  await resumeLink.click();
  const download = await downloadPromise;
  expect(await download.failure()).toBeNull();
  const downloadedPath = await download.path();
  expect(Boolean(downloadedPath)).toBe(true);
  expect((await readFile(downloadedPath!)).equals(original), 'Downloaded resume bytes match the uploaded file').toBe(true);
});

test('the favicon renders the navy and off-white AY mark without a photo', async ({ page }) => {
  const icon = page.locator('link[rel="icon"]');
  await expect(icon).toHaveCount(1);
  await expect(icon).toHaveAttribute('type', 'image/svg+xml');
  const href = await icon.getAttribute('href');
  expect(Boolean(href?.includes('v=ay-1'))).toBe(true);
  const iconURL = new URL(href!, page.url()).href;
  const response = await page.request.get(iconURL);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
  const svg = (await response.body()).toString('utf8');
  const mark = await page.evaluate(source => {
    const document = new DOMParser().parseFromString(source, 'image/svg+xml');
    return {
      letters: document.querySelector('text')?.textContent?.trim(),
      colors: [...document.querySelectorAll('[fill]')].map(element => element.getAttribute('fill')),
      images: document.querySelectorAll('image').length,
      embeddedPhoto: source.includes('data:image/'),
    };
  }, svg);
  expect(mark.letters).toBe('AY');
  expect(mark.colors).toEqual(expect.arrayContaining(['#20344a', '#f7f6f0']));
  expect(mark.images).toBe(0);
  expect(mark.embeddedPhoto).toBe(false);
  const rendered = await page.evaluate(async source => {
    const image = new Image();
    image.src = source;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0, 16, 16);
    const pixels = context.getImageData(0, 0, 16, 16).data;
    return {
      visible: pixels.some((value, index) => index % 4 === 3 && value > 0),
      lightLetters: pixels.some((value, index) => index % 4 === 0 && value > 200 && pixels[index + 1] > 200 && pixels[index + 2] > 200 && pixels[index + 3] > 0),
    };
  }, iconURL);
  expect(rendered).toEqual({ visible: true, lightLetters: true });
});

test('page identity uses the plain AY home link and copy has no em dash characters', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page).toHaveTitle('Alex Yuan - Mechanical Engineering');
  const home = page.getByRole('link', { name: 'Alex Yuan - home', exact: true });
  await expect(home).toBeVisible();
  await expect(home).toHaveText('Alex Yuan - home');
  const visibleMark = await home.evaluate(element => {
    const value = getComputedStyle(element, '::before').content;
    return value === 'none' || value === 'normal' ? '' : value.replace(/^["']|["']$/g, '');
  });
  expect(visibleMark).toBe('AY');
  await expect(home.locator('img')).toHaveCount(0);
  expect(await home.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      border: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].every(value => value === '0px'),
      square: style.borderRadius === '0px',
      shadow: style.boxShadow === 'none',
      transparent: style.backgroundColor === 'rgba(0, 0, 0, 0)',
    };
  })).toEqual({ border: true, square: true, shadow: true, transparent: true });
  await page.getByRole('navigation').getByRole('link', { name: 'Work', exact: true }).click();
  await home.click();
  await expect(page).toHaveURL(/#top$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(100);
  const prohibitedCharacterCounts = await page.evaluate(() => {
    const hasCharacter = (value: string | null) => Boolean(value?.includes('\u2014'));
    return {
      title: Number(hasCharacter(document.title)),
      copy: Number(hasCharacter(document.body.textContent)),
      metadata: [...document.querySelectorAll('meta[content]')].filter(element => hasCharacter(element.getAttribute('content'))).length,
      accessibility: [...document.querySelectorAll('*')].flatMap(element => [...element.attributes]).filter(attribute => attribute.name.startsWith('aria-') && hasCharacter(attribute.value)).length,
      imageAlt: [...document.querySelectorAll('img[alt]')].filter(element => hasCharacter(element.getAttribute('alt'))).length,
    };
  });
  expect(prohibitedCharacterCounts).toEqual({ title: 0, copy: 0, metadata: 0, accessibility: 0, imageAlt: 0 });
});

test('each work story expands accessibly and closes with focus and orientation restored', async ({ page }) => {
  for (const entry of entries) {
    const trigger = page.locator(`#${entry.id}-trigger`);
    const story = page.locator(`#${entry.id}-story`);
    await expect(trigger).toHaveAccessibleName(new RegExp(entry.title));
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(story).toBeHidden();
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(story).toBeVisible();
    await expect(story).toHaveAttribute('role', 'region');
    await expect(story).toHaveAttribute('aria-labelledby', `${entry.id}-trigger`);
    await expect(story.locator('h4').first()).toBeVisible();
    await story.getByRole('button', { name: /^Close story/ }).click();
    await expect(story).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
    await expect.poll(() => trigger.evaluate(element => {
      const top = element.closest('.work-preview')!.getBoundingClientRect().top;
      return top >= document.querySelector('header')!.getBoundingClientRect().bottom - 1 && top < window.innerHeight / 2;
    })).toBe(true);
  }
});

test('skip link and work disclosures work from the keyboard', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  const trigger = page.locator('#manifold-trigger');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#manifold-story')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#manifold-story')).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const width of [1440, 375, 320]) {
  test(`layout has no horizontal overflow at ${width}px, including all expanded stories`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 812 });
    await expectNoHorizontalOverflow(page);
    const photo = page.locator('#about .about-photo');
    await photo.scrollIntoViewIfNeeded();
    await expect.poll(() => photo.evaluate(element => {
      const image = element as HTMLImageElement;
      return image.complete && image.naturalWidth > 0;
    })).toBe(true);
    const photoBox = (await photo.boundingBox())!;
    const copyBox = (await page.locator('#about .about-copy').boundingBox())!;
    expect(photoBox.width).toBeCloseTo(photoBox.height, 0);
    expect(await photo.evaluate(element => {
      const style = getComputedStyle(element);
      return {
        objectFit: style.objectFit,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
        borders: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
        padding: style.padding,
      };
    })).toEqual({ objectFit: 'contain', borderRadius: '0px', boxShadow: 'none', borders: ['0px', '0px', '0px', '0px'], padding: '0px' });
    if (width === 1440) {
      expect(photoBox.x + photoBox.width).toBeLessThanOrEqual(copyBox.x);
      expect(photoBox.y).toBeLessThan(copyBox.y + copyBox.height);
      expect(photoBox.y + photoBox.height).toBeGreaterThan(copyBox.y);
    } else {
      expect(photoBox.y + photoBox.height).toBeLessThanOrEqual(copyBox.y);
    }
    const entryStyles = await page.locator('.work-entry').evaluateAll(elements => elements.map(element => {
      const heading = getComputedStyle(element.querySelector('h3')!);
      const button = getComputedStyle(element.querySelector('.detail-trigger')!);
      const summary = getComputedStyle(element.querySelector('.work-summary')!);
      return JSON.stringify({
        heading: [heading.fontFamily, heading.fontSize, heading.fontWeight, heading.color],
        button: [button.fontFamily, button.fontSize, button.fontWeight, button.color, button.padding, button.border],
        summary: [summary.fontFamily, summary.fontSize, summary.lineHeight],
      });
    }));
    expect(new Set(entryStyles).size, 'Work entries share title, summary, and disclosure styles').toBe(1);
    if (width < 760) {
      const panelOrder = await page.locator('.work-entry').evaluateAll(elements => elements.map(element => {
        const panel = element.querySelector('.work-aside, .work-media')!;
        const trigger = element.querySelector('.detail-trigger')!;
        return {
          id: trigger.id,
          panelPrecedesTriggerInDOM: Boolean(panel.compareDocumentPosition(trigger) & Node.DOCUMENT_POSITION_FOLLOWING),
          panelAppearsAboveTrigger: panel.getBoundingClientRect().bottom <= trigger.getBoundingClientRect().top + 1,
        };
      }));
      expect(panelOrder, 'Mobile readers see supporting evidence before the disclosure action').toEqual(entries.map(entry => ({
        id: `${entry.id}-trigger`,
        panelPrecedesTriggerInDOM: true,
        panelAppearsAboveTrigger: true,
      })));
    }
    for (const entry of entries) await page.locator(`#${entry.id}-trigger`).click();
    await expect(page.getByRole('button', { name: /^Close story/ })).toHaveCount(4);
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Alex Yuan', exact: true })).toBeVisible();
  });
}

test('closing every mobile story returns focus to a fully visible trigger', async ({ page }) => {
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 812 });
    for (const entry of entries) {
      const trigger = page.locator(`#${entry.id}-trigger`);
      const story = page.locator(`#${entry.id}-story`);
      await trigger.click();
      await story.getByRole('button', { name: /^Close story/ }).click();
      await expect(story).toBeHidden();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
      await expect.poll(() => trigger.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        return bounds.top >= document.querySelector('header')!.getBoundingClientRect().bottom && bounds.bottom <= window.innerHeight;
      })).toBe(true);
      await expectNoHorizontalOverflow(page);
    }
  }
});

test('reduced motion removes smooth scrolling and long transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  const transitionDuration = await page.locator('.detail-trigger').first().evaluate(element => getComputedStyle(element).transitionDuration);
  expect(transitionDuration.split(',').every(duration => Number.parseFloat(duration) <= 0.01)).toBe(true);
  await page.getByRole('navigation').getByRole('link', { name: 'Work', exact: true }).click();
  await expect(page).toHaveURL(/#work$/);
});

test('collapsed and expanded desktop/mobile content passes WCAG accessibility checks', async ({ page }) => {
  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 812 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expectAccessible(page);
    for (const entry of entries) await page.locator(`#${entry.id}-trigger`).click();
    await expectAccessible(page);
  }
});
