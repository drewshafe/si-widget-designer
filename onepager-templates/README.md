# One-Pager templates from the design canvas

These are the artboards from the **Post-Meeting One-Pager** design canvas, copied as-is.
`onepager.html` renders them in the Rep Hub's One-Pager editor. Its Template dropdown is built from
`manifest.json`, and the **↻ Update** button next to it re-reads that file to pick up new and changed templates
without a page reload.

## Syncing from the design project

A Rep Hub page can't read the design project itself (it's private to claude.ai), so new designs reach the
Rep Hub in two steps:

1. Download the canvas's `project/` files (the `*.dc.html` boards and `canvas.json`) into a folder, and run:

   ```
   python3 onepager-templates/sync.py <that folder>
   ```

   It copies the templates that changed, points their images at `../onepager-assets/`, and rebuilds
   `manifest.json`. If a board uses an image it hasn't seen, it lists it and stops: download that image into
   `../onepager-assets/dc/`, add its blob id to `blobs.json`, and run again.
2. Commit and push. Reps click **↻ Update** (or reload) to see them.

Asking Claude to "sync the One-Pager templates from the design project" does both steps.

What the sync picks up:

- `Recap*`, `Tpl-*` and `Main*` boards. Filled-in samples (`Sample-*`), live merchant pages and boards that only
  `<dc-import>` another board are skipped.
- `<name>-Landscape` becomes the landscape version of `<name>`, behind the editor's Portrait / Landscape switch.
- A new template goes into a group by its name, with its canvas title as the label (both editable in
  `manifest.json`, and kept on later syncs). It's tagged "New" in the dropdown for 14 days.

## What the renderer supports

- `{{dotted.lookups}}` in text and attributes;
- `<sc-if value>` and `<sc-for list as>`;
- the template's `Component.renderVals()`;
- `data-props` Tweaks, which the editor shows as side-panel controls by section;
- the page size of the board's top element (Letter portrait 816×1056 or landscape 1056×816), for the PDF too.

Two images have a special role:

- `merchant-logo-placeholder` shows the Brand Folder's logo when the folder has one.
- `merchant-banner-placeholder` shows the merchant banner uploaded in the recap.

Reps can click any image to replace it.

## ROI templates

On `Tpl-ROI*` templates, Deal data gets **ROI numbers**: paste an ROI Calculator link, or pick an ROI scenario
saved in the merchant's Brand Folder. The editor runs the calculator itself (hidden, on the same github.io site)
with those settings and fills the template's `[placeholders]` with its results: baseline, claims covered, revenue
share, net value, assumptions and a link to the merchant's calculator. If a template's placeholder text changes on
the canvas, update `roiTokens()` in `onepager.html` to match.
