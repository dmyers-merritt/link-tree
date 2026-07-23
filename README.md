# Merritt Leasing Toolbox

A single-page hub ("link tree") for the Merritt Properties leasing team. Links to the team's
web tools and provides download links to the shared Excel/Word templates.

## What's here
- `index.html` — the entire site (self-contained, no build step)
- `netlify.toml` — Netlify config (publishes repo root)

## Web tools linked
- Rent Table Tool — https://rent-table.netlify.app
- Comp Database — https://merrittcomps.netlify.app
- Development Pipeline — https://devgraphs.netlify.app

## Templates
Template download links point at the **live files** in the Leasing SharePoint library:
`teams/Leasing/Shared Documents/Leasing OffSite Resources/Spreadsheets and Templates/`

They use SharePoint's `download.aspx?SourceUrl=` force-download endpoint, so clicking a
template downloads the current version (Merritt sign-in required) and opens it in desktop
Excel/Word. Because they point at the live files, edits to a template update the download
automatically — no redeploy needed.

### To add or change a template link
Copy an existing `<a class="file">` block in `index.html` and change the filename at the end
of the `SourceUrl=` path (URL-encode spaces as `%20`). The path must match the file name in
the SharePoint folder exactly.

## Deploy
Static site. Either:
1. **Netlify Drop** — drag this folder onto https://app.netlify.com/drop, or
2. Connect this repo to Netlify (like the rent-table site) for auto-deploy on push.
