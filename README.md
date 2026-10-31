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

Work, skills, introduction, and About copy are in `src/content.ts`. Optional contact details and the resume destination are in `src/contact.json`; leave unused fields as empty strings. [Contact instructions](docs/CONTACT.md) explain how to enter them directly in GitHub without sending them in chat. Approved images go in `public/media/` with a source, accessible description, and caption. Browser printing includes every story, even when collapsed on screen.

See [copy review](docs/COPY_REVIEW.md), [assets](docs/ASSET_CHECKLIST.md), and [editing and publishing](docs/EDITING_AND_PUBLISHING.md). The latest copy follows Alex's annotated review. The 30% HyAxiom flow improvement is simulated; gasket testing and 80% VBA savings are separate contributions. Senior design remains preliminary. Research now includes Alex's supplied LabVIEW, calibration, and mesh-modification details, and the AIAA story includes the jointly developed Simulink model.

The site is hosted at `https://alexyuan066.github.io/`. The pinned workflow in `.github/workflows/deploy-pages.yml` deploys changes pushed to `main` in `alexyuan066/alexyuan066.github.io`. GitHub Pages uses GitHub Actions as its source. Local edits and review artifacts do not change the published version until they are pushed. See [GitHub Pages setup](docs/GITHUB_PAGES.md) for background.

The source was recovered from the conversation after an older environment snapshot restored an empty checkout, and is now tracked in Git. Dependencies are pinned. Publishing a cloud environment snapshot and deploying the website are separate operations.
