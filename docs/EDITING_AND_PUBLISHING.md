# Editing and publishing the portfolio

## The easiest way to request text changes

Send the section name, the current text, and the replacement you want. You can also say what you want the wording to communicate and ask for a draft. For example:

```text
Section: About, paragraph 3
Current: [paste the current paragraph]
Replace with: [paste the new paragraph]
```

[COPY_REVIEW.md](COPY_REVIEW.md) contains the annotated revision's copy, including all four expanded work stories, with spaces for requested changes. You can copy sections into a message or edit the worksheet and return it. Editing the worksheet alone does not change the website; the approved replacements must be applied to the site files.

An annotated PDF is also practical. Use a PDF with every work entry expanded so the supporting stories are visible. Highlight the affected passage and attach a comment with the replacement text, or mark a deletion clearly. For layout feedback, name the section and describe the desired change. Include a short text note if handwriting or a comment is ambiguous. A PDF captures one layout and viewport; expansion behavior and mobile interactions should still be reviewed in the working site.

## Editing files directly

There is currently no CMS or browser-based text editor. Content is stored in plain TypeScript/React files:

| What to change | File |
| --- | --- |
| Work titles, context, dates, preview summaries, tags, supporting panels, expanded stories, and confidentiality note | `src/content.ts` |
| Introduction (`introduction`), About paragraphs (`aboutParagraphs`), name, and skills | `src/content.ts` |
| Optional public email, phone, LinkedIn URL, and resume URL | `src/contact.json`; see [CONTACT.md](CONTACT.md) |
| Education and Contact labels/text, navigation, shared controls, and footer | `src/App.tsx` |
| Browser title and search description | `index.html` |
| Colors, typography, spacing, and responsive layout | `src/styles.css` |

Keep a string's surrounding quotes and the surrounding commas/brackets intact when editing `src/content.ts`. An apostrophe inside a single-quoted string needs escaping as `\'`, or use double quotes around that string. Keep unwanted or unavailable contact fields as empty strings (`""`) in `src/contact.json`. The contact values are public website information, not secrets; Alex can edit them directly without sending their values in chat. See [CONTACT.md](CONTACT.md) for the file format and self-editing steps, and [ASSET_CHECKLIST.md](ASSET_CHECKLIST.md) for media, caption, attribution, and public-sharing requirements.

Run the site from the checkout:

```sh
npm run dev -- --port 5173 --strictPort
```

The development preview updates when files are saved. Before sharing a revised version, run:

```sh
npm run build
npm test
```

Keep simulation results labeled as simulated, preliminary work labeled as preliminary, and recommendations distinct from implemented or tested changes. HyAxiom wording and metrics remain subject to Alex's confidentiality review.

## What “publishing” means

Saving or publishing a Codex environment configuration/snapshot makes that development setup reusable for future Codex work. It does not deploy this portfolio as a public website. The development preview is a separate way to inspect the working app.

A public version already exists at **https://alexyuan066.github.io/**, hosted by GitHub Pages from **`alexyuan066/alexyuan066.github.io`**. Its publishing source is already configured as **GitHub Actions**. This revision includes the annotated copy changes and `src/contact.json` setup. Verify publication through the workflow and the live site; saving files or building locally does not publish an update.

## Updating the existing GitHub Pages site

The existing `.github/workflows/deploy-pages.yml` workflow runs on pushes to `main` and can also be started manually from GitHub Actions. For an approved update:

1. Check the local changes and run the build and relevant tests.
2. Commit and push the approved source changes to the existing repository's `main` branch. This triggers a public deployment; no separate Pages-source setup is needed.
3. Wait for the Pages workflow to succeed. It installs locked dependencies with `npm ci`, builds with `npm run build`, and deploys `dist`.
4. Refresh https://alexyuan066.github.io/ and check the updated wording, navigation, mobile layout, expanded stories, and any supplied downloads.

For the contact fields, follow [CONTACT.md](CONTACT.md) or open [the contact file editor](https://github.com/alexyuan066/alexyuan066.github.io/edit/main/src/contact.json). Editing that file on GitHub and committing to `main` uses the same automatic deployment workflow. There is no need to change React components or supply contact values in chat.

See [GITHUB_PAGES.md](GITHUB_PAGES.md) for the repository and deployment configuration. The GitHub Pages address stays the same after an update.

## Optional alternative hosts

There is no need to move hosts to edit the existing portfolio. If Alex later chooses Netlify, a manual deployment can upload a fresh archive or folder of the built `dist` contents, with `index.html` and `assets` at the top level. That creates a public Netlify deployment; subsequent edits require a fresh build and upload unless Git integration is configured. An older exported ZIP does not automatically include later edits.

Vercel is another optional Git-based host: import the saved repository, use the Vite preset with build command `npm run build` and output directory `dist`, and use a compatible Node version. Connecting a repository can start a public deployment immediately, and later commits can trigger deployments.

These alternatives assign addresses under `*.netlify.app` or `*.vercel.app`, respectively. No Netlify or Vercel deployment has been configured by this revision.

## Using your own URL

A purchased domain is not needed for the existing `alexyuan066.github.io` address, and that address needs no DNS edits. A separate custom domain, such as a personal `.com` domain, is optional. You would need to own it, either by purchasing an available domain or using one you already control. Domain registration/renewal is separate from website hosting; no custom-domain availability or pricing has been checked here.

If a custom domain is chosen later, use GitHub Pages' custom-domain settings and its DNS instructions at the domain registrar or DNS provider. Follow the host's required records, choose whether the main address uses the root domain or `www`, and let the host verify the connection and provision HTTPS. DNS changes can take time to propagate. Keep the existing domain's email and other service records intact when making these changes.

Text updates keep the same address after a successful deployment. Confirm the intended commit's workflow result and the live page before reporting an update as published. Routine text and contact edits require no domain/DNS changes.
