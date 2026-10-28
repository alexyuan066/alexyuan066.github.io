# Publish at alexyuan066.github.io

The root address `https://alexyuan066.github.io/` uses a GitHub Pages user-site repository named **`alexyuan066/alexyuan066.github.io`**. Keeping the current repository name, `alexyuan066/engineering-portfolio`, would normally give a project address of `https://alexyuan066.github.io/engineering-portfolio/` instead.

## Steps when you are ready to publish

1. Choose the target repository: create `alexyuan066/alexyuan066.github.io`, or rename the current `engineering-portfolio` repository to `alexyuan066.github.io` in GitHub. Confirm the target before changing repository settings or the local remote.
2. Review the public copy, especially the HyAxiom NDA material and metrics. Save the approved site code and the prepared `.github/workflows/deploy-pages.yml` workflow in the chosen repository's `main` branch by committing and pushing them. If the target repository changed, update the local Git remote to that target first.
3. In the target repository, open **Settings → Pages** and select **GitHub Actions** as the source.
4. Run the prepared Pages workflow from the repository's Actions area, or let a push to `main` trigger it. The workflow also supports a manual run. Its repository guard prevents deployment from the current `engineering-portfolio` repository; it is intended to deploy only from `alexyuan066/alexyuan066.github.io`.
5. After the workflow succeeds, use the deployment link GitHub provides and check the site at `https://alexyuan066.github.io/`. Verify the four expandable stories, mobile layout, navigation, and any supplied downloads before sharing it.

The workflow installs locked dependencies with `npm ci`, runs `npm run build`, and deploys the generated `dist` directory. Vite's default base path, `/`, suits this root address. A project deployment under `/engineering-portfolio/` would need its base path configured for that subdirectory.

## Current status

The restored site code is local and uncommitted. The existing remote points to `alexyuan066/engineering-portfolio` and returned no remote refs. Read access to that original repository works.

We could not confirm whether `alexyuan066/alexyuan066.github.io` already exists with the available access: its Git lookup returned “Repository not found,” and the GitHub API lookup was forbidden. These responses do not prove the repository is absent. Check your GitHub account before creating or renaming a repository.

No repository creation, rename, push, Pages-settings change, or public deployment has been performed. The desired public site address is not live as a result of this local setup.

## Domain name

The `github.io` address does not require a purchased domain or DNS edits. A domain you own can be connected later through GitHub Pages and your domain provider; it is optional. No domain ownership or DNS changes are assumed or configured here.
