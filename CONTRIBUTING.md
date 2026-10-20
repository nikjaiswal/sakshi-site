# Contributing

SAKSHI's website is a public evidentiary record. Its edit history is part of
that record, so contributions follow a few rules.

## What goes where

- `content/pages/` holds the source of every page except profiles. Edit the
  body fragment there and run `npm run build`; the HTML in `site/` is
  generated and not committed.
- `site/assets/` holds the stylesheet, scripts and images. Edit them directly.
- `profiles-data/` holds one JSON file per company profile. Profile pages are
  never hand-edited. Change the data file, and the page is rendered from it.
- `profile-schema.json` defines the profile format. Changes to the schema
  need a matching change to `build/render-profiles.js`.

## Corrections to published profiles

Factual corrections to a profile go through the appeals and correction
process described on the Governance page. A correction is recorded as a new
entry in the profile's `correction_log` with the date and a description of
what changed. The original finding is not silently rewritten.

Companies that are the subject of a profile should use the response channel
stated on their profile rather than open a pull request.

## Before opening a pull request

Run the same checks that continuous integration runs:

```
npm ci
npm test
```

This renders the profile pages, validates every HTML file, and checks that
every internal link resolves.

## Content rules

- Draw substantive claims from the SAKSHI paper or from a published profile.
- Do not name a real company as a subject of investigation outside a
  profile in `profiles-data/`.
- Plain sentences. No marketing language.

## Commit messages

One change per commit. Say what changed and why in the first line. For
profile corrections, name the profile slug and the correction date.
