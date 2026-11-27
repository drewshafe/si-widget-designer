# One-Pager templates from the design canvas

These are the artboards from the **Post-Meeting One-Pager** design canvas, copied as-is.
`onepager.html` renders them in the Rep Hub's One-Pager editor and lists them in the
Template dropdown (`TPL_MENU`).

## Adding or updating a template

1. Copy the artboard's `.dc.html` from the canvas into this folder, keeping its file name.
2. Download any `/_blob/<id>` image it uses into `../onepager-assets/` (new ones go in `dc/`).
3. Replace each `/_blob/<id>` in the file with `onepager-assets/<file>`.
4. For a new template, add one `['dc:<file name without .dc.html>', 'Label']` line to `TPL_MENU` in `onepager.html`.

The renderer supports the parts the canvas templates use:

- `{{dotted.lookups}}` in text and attributes;
- `<sc-if value>` and `<sc-for list as>`;
- the template's `Component.renderVals()`;
- `data-props` Tweaks, which the editor shows as side-panel controls by section.

It doesn't support `<dc-import>`, so sample boards built from imports aren't listed.

Two images have a special role:

- `merchant-logo-placeholder` shows the Brand Folder's logo when the folder has one.
- `merchant-banner-placeholder` shows the merchant banner uploaded in the recap.

Reps can click any image to replace it.
