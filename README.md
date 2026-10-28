# Alex Yuan — engineering portfolio

React, TypeScript, and Vite portfolio with all four work stories expanding in place. The latest styling uses locally bundled IBM Plex Sans, forest/olive accents, and the supporting box before the details button on mobile.

## Start

Use the existing isolated checkout; do not create a Git worktree unless requested. Node.js 24 and npm are used in this environment.

```sh
cd /workspace/engineering-portfolio
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm run dev -- --port 5173 --strictPort
```

## Validate

```sh
npm run build
npm test
```

Playwright uses `/usr/bin/chromium`; `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select a different installed browser. The suite starts Vite if needed.

## Edit and review

Work, skills, optional media, and contact destinations are in `src/content.ts`. The remaining page text is in `src/App.tsx`. Keep missing destinations null. Approved images go in `public/media/` with a source, accessible description, and caption. Browser printing includes every story, even when collapsed on screen.

See [copy review](docs/COPY_REVIEW.md), [assets](docs/ASSET_CHECKLIST.md), and [editing and publishing](docs/EDITING_AND_PUBLISHING.md). HyAxiom claims remain draft material for Alex's review. The 30% flow improvement is simulated; gasket testing and 80% VBA savings are separate contributions. Senior design is preliminary, and the AIAA connector recommendation is untested.

For the requested `alexyuan066.github.io` address, see [GitHub Pages setup](docs/GITHUB_PAGES.md). A pinned GitHub Actions workflow is prepared in `.github/workflows/deploy-pages.yml`; it deploys only from `alexyuan066/alexyuan066.github.io`. Copying the workflow into the current `engineering-portfolio` repository does not publish it. GitHub repository creation, content approval, source upload, and Pages activation remain separate steps.

The source was recovered from the conversation after an older environment snapshot restored an empty checkout. Dependencies are pinned to the last recorded versions. No public website deployment has been performed. Publishing an environment snapshot and hosting the website are separate operations.
