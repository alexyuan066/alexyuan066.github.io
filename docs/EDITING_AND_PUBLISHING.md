# Editing and publishing the portfolio

## The easiest way to request text changes

Send the section name, the current text, and the replacement you want. You can also say what you want the wording to communicate and ask for a draft. For example:

```text
Section: About, paragraph 3
Current: [paste the current paragraph]
Replace with: [paste the new paragraph]
```

[COPY_REVIEW.md](COPY_REVIEW.md) contains the current copy, including all four expanded work stories, with spaces for requested changes. You can copy sections into a message or edit the worksheet and return it. Editing the worksheet alone does not change the website; the approved replacements must be applied to the site files.

An annotated PDF is also practical. Use a PDF with every work entry expanded so the supporting stories are visible. Highlight the affected passage and attach a comment with the replacement text, or mark a deletion clearly. For layout feedback, name the section and describe the desired change. Include a short text note if handwriting or a comment is ambiguous. A PDF captures one layout and viewport; expansion behavior and mobile interactions should still be reviewed in the working site.

## Editing files directly

There is currently no CMS or browser-based text editor. Content is stored in plain TypeScript/React files:

| What to change | File |
| --- | --- |
| Work titles, context, dates, preview summaries, tags, supporting panels, expanded stories, and confidentiality note | `src/content.ts` |
| Skills, public email, LinkedIn URL, and resume URL | `src/content.ts` |
| Introduction, About paragraphs, Education and Contact labels/text, navigation, shared controls, and footer | `src/App.tsx` |
| Browser title and search description | `index.html` |
| Colors, typography, spacing, and responsive layout | `src/styles.css` |

Keep a string's surrounding quotes and the surrounding commas/brackets intact when editing `src/content.ts`. An apostrophe inside a single-quoted string needs escaping as `\'`, or use double quotes around that string. Missing email, LinkedIn, and resume destinations should stay `null` until the real address, URL, or file is supplied. See [ASSET_CHECKLIST.md](ASSET_CHECKLIST.md) for media, caption, attribution, and public-sharing requirements.

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

A public website needs a web host. No public deployment or custom domain has been configured for this portfolio, and no public site URL exists yet. A manual upload of the built site is the easiest initial route and does not require committing or pushing the source code first.

## The easiest initial route: a Netlify manual upload

The build archive for this review is `/workspace/artifacts/portfolio-site.zip`. It contains the production files from `dist`, with `index.html` and the `assets` directory at the archive's top level. Netlify can host these static files without a GitHub connection.

When Alex is ready to make the reviewed version public:

1. Review the copy, confidentiality-sensitive material, resume/contact information, and media permissions.
2. Download `portfolio-site.zip` and sign in to Netlify so the deployed site can be managed later.
3. Use Netlify's manual deployment or Drop upload workflow. Upload the ZIP, or extract it and upload the folder that directly contains `index.html` and `assets`. Upload the built files, not the source-code checkout. If the upload interface requests a folder rather than a ZIP, use the extracted folder.
4. Netlify deploys the files and shows a generated public address under `*.netlify.app`. The upload creates a public deployment; there is no separate publishing action required afterward.
5. Check navigation, expanded stories, mobile layouts, and any supplied downloads at that address before sharing it.

You can edit the site name in Netlify's settings to change the assigned subdomain, subject to availability. For example, `alex-yuan-portfolio-example.netlify.app` illustrates the format only; it is not a live site, a reserved name, or an availability check. The actual URL will come from Netlify after upload.

For later changes, update the source, run `npm run build`, and upload a fresh archive or folder of the new `dist` contents to the same Netlify site. Manual deployment does not automatically publish source-file edits. Keep the source files separately; the build ZIP is an upload package, not a replacement for the editable project.

## Git-based alternative: Vercel

If automatic deployments from GitHub are preferred later, Vercel is another suitable host for this static React/Vite site. The current checkout has no commits, so the reviewed code must first be committed and pushed to the intended repository. After public publication is approved, import that repository into Vercel, use the Vite preset with build command `npm run build` and output directory `dist`, and use a Node version compatible with the repository. The README records the validated version.

Vercel provides an address under `*.vercel.app`; connecting a repository can start a deployment immediately. Subsequent commits can trigger deployments. No Vercel project or deployment has been created here.

## Using your own URL

A custom domain, such as a personal `.com` domain, is optional. You need to own the domain, either by purchasing an available one or using one you already control. Domain registration/renewal is separate from website hosting; no domain availability or pricing has been checked here.

After deployment, add the domain in Netlify's domain settings, or the corresponding settings of the host you chose. The host provides the DNS instructions to follow at your domain registrar or DNS provider. Use those exact records, choose whether the main address uses the root domain or `www`, and let the host verify the connection and provision HTTPS after setup. DNS changes can take time to propagate. Keep the existing domain's email and other service records intact when making these changes.

Text updates do not require buying another domain. The host serves the new build at the same connected domain after an approved deployment. Public deployment and domain/DNS changes should be performed only when Alex authorizes them; this guide has not performed either action.
