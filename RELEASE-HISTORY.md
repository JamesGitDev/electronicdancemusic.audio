# Website release notes

The dates below come from the preserved archives in UTC. The linked commits were reconstructed during the GitHub import. A snapshot can be a staging candidate or a public release.

## November 26, 2026

- **Behavior analytics.** Measure visible time, playback requests and starts, unmuted listening, buffering, and install interest after opt-in. Use the hostname and website revision to compare results.
- **Section analytics.** Measure navigation, section visibility, control exposure, playback sources, and install steps. Use fixed event labels and count buckets for search results.
- **Listening layout.** Put preview playback, browsing, and Android download within reach on the first screen. Measure discovery and downloads with the revised analytics. Layout revision `f7a45877ea69`.
- **Mobile loading.** Prioritize smaller phone artwork and defer below-the-fold images. The before and after mobile medians were 157 to 68 KiB, 1.51 to 1.48 seconds, Lighthouse 99 to 100. These came from three cold Lighthouse runs per version.
- **GitHub baseline.** [`d70a07c`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/d70a07c93eb16b6d36a89dc7763f25f396f908cb) imports the editable build and records release revision `b94564dde3dd`. The build reproduced the homepage, JavaScript bundle, and service worker from the live release.

## Keyboard and screen-reader accessibility

- Keep focus visible on station artwork, Save buttons, and genre filters. Reserve scroll space for the pinned player and the analytics notice, and reveal focused controls immediately during keyboard navigation.
- Restore focus after analytics consent and when a saved station disappears. Announce the search result count and expose the site footer as a landmark.
- Verified Chromium keyboard navigation and the accessibility tree at 1440, 390, and 320 CSS pixels. Rechecked playback, downloads, analytics consent, and privacy behavior in the local release preview.

- Matched station artwork buttons to their visible tags in both playback states. Search and Saved buttons now include their visible track details in the accessible name. The labeled Android preview is a named group.
- Rechecked the 38 listed PageSpeed items across 40 desktop and mobile states, including open dialogs, playing and paused controls, email verification, and the EDM.Audio settings transfer screen. The nine applicable rules passed.

## Search site-name markup

- Add Schema.org `WebSite` JSON-LD and matching `og:site_name` metadata to the canonical homepage.
- Verified the name and URL in the Schema Markup Validator with zero errors and zero warnings. The URL matches the canonical link and sitemap.

## Player progress animation

- Animate preview progress with a horizontal transform so the progress bar advances without changing layout width.
- Verified in mobile Chromium that the compositor handles the transition. Playback, pause, station changes, and the reduced-motion setting behaved as expected.

## Recovered snapshots

The file column shows changes to the archived frontend. Use the linked diff for additions, removals, and the Android package metadata for each version.

| Date (UTC) | Commit | Change | Website files changed |
| --- | --- | --- | --- |
| 2026-10-30 | [`ab1b6d8`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/ab1b6d877bc9e8bca259c8a04d778f86fa653294) | Recover the original ElectronicDanceMusic.Audio website package | `_headers`, `app.js`, `config.js`, `index.html`, `manifest.webmanifest`, `styles.css`, `sw.js`, 16 assets files |
| 2026-10-30 | [`49b7cb3`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/49b7cb3820eb7052e814116f49ba37135ccc0a80) | Prepare the first private website staging snapshot | `index.html`, `sw.js` |
| 2026-10-30 | [`28fd852`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/28fd8526665765b0e3f032af4ff1ff6b404a600c) | Prepare the first public site with routed media | `_headers`, `app.js`, `config.js`, `index.html`, `sw.js`, 4 assets files |
| 2026-10-31 | [`11245f7`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/11245f77a2116826e4bb8951e51a1a5f721da3e6) | Add optional website analytics (Android 0.3.5) | `analytics-config.js`, `analytics.js`, `app.js`, `config.js`, `index.html`, `styles.css`, `sw.js` |
| 2026-10-31 | [`0324646`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/032464697b73e68a81d7cab25b271ad39f152eb4) | Refine analytics and the Android download link (Android 0.3.5) | `app.js`, `sw.js` |
| 2026-10-31 | [`d950e23`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/d950e2303bf4221f3360440c74be02d7900f275c) | Add the Android domain association (Android 0.3.5) | 1 .well-known file |
| 2026-10-31 | [`1dda186`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/1dda1864c369c68027f915091e7d3997fc43bb2a) | Improve the mobile layout for Android 0.3.6 (Android 0.3.6) | `config.js`, `index.html`, `sw.js`, `verify-email.html` |
| 2026-10-31 | [`6c67f08`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/6c67f08feb2126150459d70c487b1a61e8daa184) | Update account password reset links (Android 0.3.7) | `config.js`, `index.html`, `sw.js`, `verify-email.html` |
| 2026-10-31 | [`9e233e2`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/9e233e2fa40b9194a9826b7952ba5a1c323ca7aa) | Link directly to the signed Android download (Android 0.3.7) | `app.js`, `index.html`, `sw.js`, `verify-email.html` |
| 2026-10-31 | [`ddd4d9d`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/ddd4d9d3352cd0c514d013e2a423991793a252b4) | Publish account verification and Android 0.3.8 links (Android 0.3.8) | `config.js`, `index.html`, `sw.js`, `verify-email.html` |
| 2026-10-31 | [`2074e82`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/2074e82bac6b4f241dd567844e9bc6229699e721) | Update listener player guidance for Android 0.3.9 (Android 0.3.9) | `config.js`, `index.html`, `sw.js`, `verify-email.html` |
| 2026-10-31 | [`f98431e`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/f98431ea5c0646c44b571a05c33a90d8f41a019b) | Update the Android onboarding release (Android 0.3.10) | `config.js`, `index.html`, `sw.js`, `verify-email.html` |
| 2026-10-31 | [`32191b5`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/32191b53ea2875869398cbebe7e7ab025a0dc1be) | Document direct live playback in the Android app (Android 0.3.11) | `config.js`, `index.html`, `sw.js`, `verify-email.html` |
| 2026-10-31 | [`4e81b1e`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/4e81b1e081f3b310a58b2bb67cff2bac7bee9af2) | Update the website for the Android analytics release (Android 0.3.12) | `config.js`, `index.html`, `sw.js`, `verify-email.html` |
| 2026-10-31 | [`84fe3b6`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/84fe3b6130bbebd93a7257450b5f39b7f164dc90) | Add responsive artwork and reduce mobile transfer (Android 0.3.12) | `app.js`, `index.html`, `sw.js`, 20 assets files |
| 2026-10-31 | [`21f3e80`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/21f3e8064020cfa7b7a2ccd0bdaff2152c6508ed) | Add precompressed assets and finish mobile optimization (Android 0.3.12) | Android release metadata |
| 2026-10-31 | [`a0cd15e`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/a0cd15e7e080f6dab81263e31acf14c1c33ea426) | Update Android layout guidance and download links (Android 0.3.13) | `config.js`, `index.html`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-01 | [`d7022ee`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/d7022eec65babba57e8b7624a6e12d745a6debcf) | Record the Android 0.3.15 release candidate (Android 0.3.15-rc1) | `app.js`, `config.js`, `index.html`, `sw.js`, `verify-email.html`, 2 assets files |
| 2026-11-01 | [`3f67a74`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/3f67a74d2dd72827d18ae0a52282d05df05953c8) | Update the release for live track reactions (Android 0.3.15-rc2) | `config.js`, `index.html`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-01 | [`0b3c512`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/0b3c512f17139d4aa07a726ce3ae3855acef2634) | Update the release for live station selection (Android 0.3.15-rc3) | `config.js`, `index.html`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-01 | [`d0ff8cc`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/d0ff8ccb9b29fdbf88170212fc63dbb71bacf307) | Update the release for playback notifications (Android 0.3.15-rc4) | `config.js`, `index.html`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-01 | [`90d931d`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/90d931dc9270c2acf30bd3f5a0b7dc5e4e951245) | Update the release for notification branding (Android 0.3.15-rc5) | `config.js`, `index.html`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-01 | [`4dc1891`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/4dc1891e7619aa46851c9e2ce2917d6f14c279b4) | Update the release for automatic artwork (Android 0.3.15-rc6) | `config.js`, `index.html`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-01 | [`c2a1fbe`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/c2a1fbe9ff5a9362fef37019ef792beea36c4734) | Update the release for Liked Songs Radio (Android 0.3.15-rc7) | `config.js`, `index.html`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-01 | [`30ba343`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/30ba34336671448c04669f9b813db7b7e21d73c0) | Update the release for personal discovery (Android 0.3.15-rc8) | `config.js`, `index.html`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-01 | [`5da1553`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/5da15530eb05b0c92b8a088347277843afad2a57) | Update the release for the Up Next queue (Android 0.3.15-rc9) | `config.js`, `index.html`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-02 | [`19dae58`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/19dae58976e67a03d76595900d51a29c76f05c09) | Update the release for persistent sign-in (Android 0.3.15-rc10) | `config.js`, `index.html`, `sw.js`, `verify-email.html`, 1 .well-known file, 1 assets file |
| 2026-11-02 | [`96c969a`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/96c969a2d6c8abca67ce1f9f1f2deee7326aeba0) | Update the release for optional saved sign-in (Android 0.3.15-rc11) | `config.js`, `index.html`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-02 | [`eecc988`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/eecc988f80c85a65a30999ea40f8069b9f4ec6d6) | Update the release for automatic session recovery (Android 0.3.15-rc12) | `config.js`, `index.html`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-02 | [`3dfd7b8`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/3dfd7b82cc27a9a07025fc4369655411f7aa088c) | Prepare robots and sitemap for site discovery (Android 0.3.15-rc12) | `robots.txt`, `sitemap.xml` |
| 2026-11-02 | [`14c3b32`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/14c3b32ffc5a5cec24ba0ba04e30f11e2faead8a) | Revise site discovery metadata (Android 0.3.15-rc12) | `robots.txt` |
| 2026-11-02 | [`101d1cc`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/101d1cc406c64de83dfb75c5d18104528d24906c) | Finalize the site discovery snapshot (Android 0.3.15-rc12) | `robots.txt` |
| 2026-11-02 | [`1b15381`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/1b15381feba368c9a2c9cfdb1576dfebecf1eabc) | Update the release for simpler sign-in (Android 0.3.16-rc2) | `config.js`, `index.html`, `release-notes.txt`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-03 | [`8cfc40f`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/8cfc40fa19d0e326c28f4ed821652c2ede6ac4d4) | Update the release for immediate artwork (Android 0.3.16-rc3) | `config.js`, `index.html`, `release-notes.txt`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-03 | [`3f19746`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/3f1974606b1b5e26c9ba9a33c6ad278c9074f315) | Update the release for tap-to-toggle reactions (Android 0.3.16-rc4) | `config.js`, `index.html`, `release-notes.txt`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-03 | [`be15060`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/be15060c9808a9202ab96914f304e4339064d9cb) | Update the release for device sign-in defaults (Android 0.3.16-rc5) | `config.js`, `index.html`, `release-notes.txt`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-04 | [`a28e432`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/a28e432884c9cc86f55e3e51d773b218d34b7f28) | Update the release for endless personal radio (Android 0.3.16-rc6) | `config.js`, `index.html`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-08 | [`010a51c`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/010a51cb805d879651a322e0376f0f8f774067ec) | Update the release for continuous playback (Android 0.3.16-rc8) | `config.js`, `index.html`, `release-notes.txt`, `sw.js`, `verify-email.html`, 1 assets file |
| 2026-11-26 | [`36c853d`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/36c853db194930a6180ea83ba7fd0a53518ecc7c) | Measure website engagement and listening with consent | `analytics.js`, `app.js`, `index.html`, `sw.js`, 2 assets files |
| 2026-11-26 | [`5401e2e`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/5401e2e3e81750f2e988762b8bf6fb924a6dc094) | Measure navigation and interactions in each website section | `analytics.js`, `app.js`, `index.html`, `sw.js`, 1 assets file |
| 2026-11-26 | [`3a9388b`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/3a9388b2bd74cdf0df943955212d154064d44c78) | Make preview playback and app download easier to reach | `analytics.js`, `app.js`, `config.js`, `index.html`, `styles.css`, `sw.js`, 1 assets file |
| 2026-11-26 | [`b1479bc`](https://github.com/JamesGitDev/electronicdancemusic.audio/commit/b1479bc4ebf93aa5d828e732312c045bd00a8cad) | Reduce mobile loading time with smaller prioritized assets | `app.js`, `index.html`, `sw.js`, 4 assets files |
