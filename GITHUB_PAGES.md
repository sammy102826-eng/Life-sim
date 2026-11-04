# Deploy Life-sim on GitHub Pages

The root `index.html` launches the existing `Life sim relationships .html` through a relative, same-origin redirect. Query parameters and fragments are preserved. The original game HTML, JavaScript, CSS, artwork, features and save system are unchanged.

All game scripts and styles already use relative paths. They work under the repository site prefix `/Life-sim/`; no asset rewrites or build step are required. `.nojekyll` tells branch-based GitHub Pages to serve the files as a static site.

## One-time GitHub setup

1. Open `https://github.com/sammy102826-eng/Life-sim/settings/pages` with an account that can manage the repository.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select branch **main** and folder **/ (root)**, then **Save**.
4. Wait for the Pages deployment to succeed. GitHub shows the published URL in that settings page; build progress appears in the repository’s Actions tab.
5. Open `https://sammy102826-eng.github.io/Life-sim/` and refresh once the deployment completes.

GitHub Pages must be available for the repository’s visibility and account plan. If the option is unavailable, review repository visibility or the account’s Pages eligibility. A custom domain is optional.

The commit/push alone does not prove that Pages is enabled or that the public site is live. This task prepares and tests the deployment files; confirm the actual deployment result in GitHub.

## Saves

The launcher keeps the existing game filename and stays on the same origin. Existing saves on the same origin remain accessible. It uses `location.replace`, so the redirect-only page does not create an extra browser-history step.

Saves in Codex/local previews do not automatically move to `sammy102826-eng.github.io`: browser storage is origin-specific. Export your save JSON from the old address and import it through Save / load at the public address. Keep backups before switching addresses, browsers or domains.

## Validation

Run:

```sh
npm ci
npm test
```

The test suite includes a strict `/Life-sim/` server that rejects accidental domain-root asset paths. Deployment checks exercise:

- Root/index redirects with the correct filename, project prefix, query and fragment.
- Successful loading of all 24 local JavaScript/CSS dependencies.
- Desktop (1440px), phone (390px) and narrow phone (320px) gameplay/navigation and graphics.
- Preservation and loading of same-origin save data through the launcher.
- A manual launch link and explanation when JavaScript is disabled.

**Verified result: 78 tests passed, 0 failed, 0 skipped.** The existing gameplay, health, education, artwork, save and accessibility regressions also run. Chromium viewport checks are not physical-device or cross-browser certification.

## After the first deployment

Check the public site itself: create a life, visit Work/Stuff/Relationships/Other, confirm icons appear, save, reload and load the save. Confirm the same on a phone. A missing deployment/404 usually needs Pages settings or deployment progress checked; missing assets should be investigated with their exact requested URL.

The site uses local browser saves and the existing simulated shop. It needs no server credentials, backend API or real payment setup to play. Future commits pushed to the selected `main` branch will trigger the configured branch-based Pages deployment.
