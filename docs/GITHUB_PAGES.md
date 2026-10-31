# GitHub Pages: alexyuan066.github.io

The portfolio is live at **https://alexyuan066.github.io/** from the GitHub Pages user-site repository **`alexyuan066/alexyuan066.github.io`**. The former `engineering-portfolio` repository has already been renamed to this target; there is no repository-creation or rename step remaining.

## Publish an approved update

1. Review the revised copy and media, including the HyAxiom NDA material, metrics, and individual/team attribution. Run the build and relevant tests locally.
2. Commit and push the approved source changes to `main` in `alexyuan066/alexyuan066.github.io`. A push triggers the existing `.github/workflows/deploy-pages.yml` workflow and publishes the update when it succeeds.
3. Wait for the workflow's successful deployment, then check https://alexyuan066.github.io/. Verify the four expandable stories, mobile layout, navigation, updated wording, and any supplied downloads.

The workflow also supports a manual run from the repository's Actions area. Its repository guard allows deployment only from `alexyuan066/alexyuan066.github.io`, so copying it into a differently named repository does not publish that copy. The publishing source is already set to **Settings → Pages → GitHub Actions**; no additional Pages-settings change is needed for routine updates.

The workflow installs locked dependencies with `npm ci`, runs `npm run build`, and deploys the generated `dist` directory. Vite's default base path, `/`, suits this root address. A project deployment under `/engineering-portfolio/` would need its base path configured for that subdirectory.

## Revision and deployment verification

The annotated-review revision includes the updated introduction, retained About section, reordered work entries, revised engineering stories, and self-editable contact fields in `src/contact.json`. The duplicate education/GPA strip below the introduction is removed.

The renamed repository and GitHub API are accessible, and Pages reports `build_type: workflow`. To verify publication, check that the Pages workflow succeeds for the intended commit, then confirm the corresponding copy and layout on the live site. A local build or a pushed commit alone does not establish a successful deployment.

For direct self-editing of optional public contact details, see [CONTACT.md](CONTACT.md) and [the contact file editor](https://github.com/alexyuan066/alexyuan066.github.io/edit/main/src/contact.json). Committing an edit to `main` uses the existing automatic deployment workflow.

## Domain name

The `github.io` address does not require a purchased domain or DNS edits. A domain you own can be connected later through GitHub Pages and your domain provider; it is optional. No domain ownership or DNS changes are assumed or configured here.
