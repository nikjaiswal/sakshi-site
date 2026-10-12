# SAKSHI website

Static website for SAKSHI (Structured Accountability through Knowledge,
Scrutiny, and Health Integrity), a community-operated investigative platform
for accountability in clinical AI deployment. SAKSHI is a project of MIT
Critical Data, the Laboratory for Computational Physiology at MIT.

Contact: lcp-sakshi@mit.edu

## Why this repository is public

The website is part of SAKSHI's evidentiary record, and so is this
repository. Every change to every page, and above all every change to a
published profile, is a visible commit with a date and an author. Nothing on
the site is edited silently. Readers, profiled companies, journalists and
regulators can check what the site said at any point in time.

Profile pages are therefore never hand-edited. Each profile is a structured
data file in `profiles-data/`, validated against `profile-schema.json` and
rendered to HTML at build time. A correction to a published finding is a
change to the data file plus an entry in its `correction_log`.

No profiles have been published. `profiles-data/` is empty by design and
contains no sample or placeholder profiles.

## Repository layout

```
site/                   The website. Plain HTML, one stylesheet, one small script.
  index.html            Home
  protocol/             The Protocol
  governance/           Governance
  case-study/           Case Study (hypothetical composite)
  get-involved/         Get Involved
  about/                About, including Publications
  profiles/             Rendered at build time from profiles-data/ (not committed)
  assets/               style.css, site.js, mark.svg
  _headers              Security headers served by Cloudflare Pages
  404.html
profiles-data/          One JSON file per profile. Empty.
profile-schema.json     Documented JSON Schema for profile data files.
build/
  render-profiles.js    Renders site/profiles/ from profiles-data/. Fails on invalid data.
  check-links.js        Checks that every internal link and fragment resolves.
  lib.js                Shared page layout used by the renderer.
.github/workflows/      CI: build, HTML validation, link check on every push.
wrangler.toml           Cloudflare Pages output directory.
```

## Working locally

Requirements: Node 20 or later. The site itself has no runtime dependencies;
Node is used only to render profile pages and to run checks.

```
npm ci
npm run build          # render site/profiles/ from profiles-data/
npm run validate       # html-validate on every page
npm run check-links    # every internal link and #fragment must resolve
npm test               # all three
npm run serve          # http://localhost:8080 (needs python3)
```

Editing a static page is editing the HTML in `site/`. The header, status
line and footer are repeated in each page by hand and in `build/lib.js` for
rendered profile pages; keep them in step.

The footer of every page links to this repository, so each page points at
its own edit history. The URL is set once as `repoUrl` in `build/lib.js`;
the static pages in `site/` carry the same link by hand.

## Adding or correcting a profile

1. Create `profiles-data/<slug>.json` following `profile-schema.json`. The
   `slug` field must equal the filename.
2. Run `npm test`. The build fails with a field-by-field report if the file
   does not match the schema.
3. Open a pull request. The profile is published only after the editorial
   process described on the Governance page has run.
4. For a correction, change the data and append an entry to `correction_log`
   with the date, a description, and the trigger. Do not rewrite the original
   finding without recording the change.

## Deploying to Cloudflare Pages

Cloudflare Pages builds the site from this repository on every push to the
production branch and serves it from Cloudflare's edge.

Build settings:

| Setting                | Value            |
| ---------------------- | ---------------- |
| Framework preset       | None             |
| Build command          | `npm run build`  |
| Build output directory | `site`           |
| Root directory         | `/`              |
| Node version           | 22 (set `NODE_VERSION=22` as an environment variable if the default is older) |

### Connecting the repository

1. Push this repository to GitHub as a public repository.
2. In the Cloudflare dashboard, open Workers & Pages, choose Create, then
   Pages, then Connect to Git.
3. Authorize Cloudflare's GitHub app for the organization or account that owns
   the repository, and select the repository.
4. Set the production branch (usually `main`), the build command and the
   output directory as in the table above. Leave the framework preset as None.
5. Save and deploy. The first build gives the site a `*.pages.dev` address.
   Every later push to the production branch deploys automatically; pushes to
   other branches get preview deployments at their own addresses.

`wrangler.toml` records the output directory for anyone deploying with the
Wrangler CLI instead of the dashboard:

```
npx wrangler pages deploy site --project-name sakshi
```

### Pointing a custom domain at the site

1. In the Pages project, open Custom domains and choose Set up a custom
   domain. Enter the hostname, for example `sakshi.example.org`.
2. If the domain's DNS is already on Cloudflare, the dashboard adds the
   record for you. Otherwise, at the DNS provider, add a CNAME record for the
   hostname pointing at the project's `*.pages.dev` address.
3. Wait for the certificate to issue (usually minutes). Cloudflare serves the
   site over HTTPS at the custom hostname.

### Pointing an mit.edu hostname at the site

MIT's DNS is managed centrally, so an `mit.edu` hostname is a request to
MIT IS&T rather than something the project configures on its own.

1. Decide the hostname, for example `sakshi.mit.edu`, and confirm with the
   lab's DLC administrator that the project may request it.
2. In the Cloudflare Pages project, add the hostname under Custom domains.
   Cloudflare will show the CNAME target (the project's `*.pages.dev`
   address) and will wait for DNS to point at it.
3. Ask MIT IS&T to create a CNAME record for the hostname pointing at that
   `*.pages.dev` target. Requests go through the IS&T Service Desk or the
   DNS request form, and should name the hostname, the CNAME target, and the
   responsible contact. Note that a CNAME cannot be used for the bare
   `mit.edu` apex; a subdomain is required.
4. Once the record is live, Cloudflare validates it and issues a
   certificate. Check the hostname in a browser and confirm the `_headers`
   security headers are present.

If IS&T prefers to host the site on MIT infrastructure instead, the `site/`
directory after `npm run build` is a complete static site and can be served
by any web server.

## License

Content is licensed under Creative Commons Attribution 4.0 International
(CC BY 4.0); see `LICENSE`. The small build scripts in `build/` may be reused
under the same terms.
