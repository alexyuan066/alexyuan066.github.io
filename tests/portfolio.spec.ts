import { test, expect, type Page } from '@playwright/test';
import { createRequire } from 'node:module';
import type { AxeResults } from 'axe-core';

const require = createRequire(import.meta.url);
const entries = [
  { id: 'manifold', title: 'Water-Electrolysis Manifold Redesign' },
  { id: 'ultrasonic', title: 'Ultrasonic Invasive-Plant Control' },
  { id: 'aiaa', title: 'Rocket Engineering & Team Leadership' },
  { id: 'combustion', title: 'Sustainable-Fuel Combustion Research' },
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
  const transitionDuration = await page.locator('.hero-intro .text-link svg').evaluate(element => getComputedStyle(element).transitionDuration);
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
