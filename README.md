# electronicdancemusic.audio

The public radio and Android download website. Editable site files are under `site/`. The build fingerprints the JavaScript, inlines the stylesheet, writes the service worker revision, and compresses responses for the Ubuntu origin.

## Develop locally

Install Node.js 22 or later. Run these commands from the repository.

```sh
npm ci
npm run check
python3 -m http.server 8080 --bind 127.0.0.1 --directory dist
```

Open `http://localhost:8080`. Live analytics requires the production HTTPS hostname. Cloudflare delivers this domain’s production preview audio and Android files on their existing routes. The included audio is available for local preview. Signed Android packages are supplied by the deployment and download service.

## Record and share a change

Sync a clean local branch with `git pull --ff-only`. Make related edits together, run `npm run check`, and review the diff before staging. Use a specific commit subject, such as `Defer station covers until they near the viewport`. In the commit body, explain the reason and record the checks you actually ran. Push the branch to GitHub with `git push`, or `git push -u origin <branch>` for a new branch.

Production runs from an immutable release on the Ubuntu host. The host’s deployment notes describe staging a committed build and activating it after verification. A GitHub push records the change. Production activation is a separate step.
