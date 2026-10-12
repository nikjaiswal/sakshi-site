# profiles-data

One JSON file per published SAKSHI profile. The filename is the profile's
slug, for example `example-company.json`, and must match the `slug` field
inside the file.

Every file in this directory is validated against `../profile-schema.json`
and rendered to `site/profiles/<slug>/` by `npm run build`. Invalid files
fail the build.

This directory is empty by design. No profiles have been published. Sample
or placeholder profiles are not added here, because every file in this
directory is treated as a public finding.

Files in this directory that are not `.json` are ignored by the renderer.
