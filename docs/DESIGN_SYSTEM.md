# Phase 2 — Urdu RTL design system

Implemented locally on branch `phase-02-urdu-ui`. This is the authorized Phase 2 visual foundation, superseding the provisional Phase 1 master-record roadmap. Domain models, golden seed and the transaction engine remain the source of truth. Full business CRUD and Phase 3 data expansion are deferred.

## Tokens and visual identity

`src/styles/tokens.css` owns semantic values; `tailwind.config.js` maps them to utilities. `globals.css` owns typography/layout conventions and imports the print stylesheet. Components use tokens rather than embedding brand colors.

| Purpose | Light value | Dark behavior |
| --- | --- | --- |
| Primary emerald | `#164D46`; hover `#103F39` | Readable mint primary on dark panels |
| Secondary teal | `#27786C` | Lighter teal for contrast |
| Gold accent | `#D3B36A` | Same identity with dark foreground |
| Success | `#16875D` | Lighter success display color |
| Warning | `#D99621` | Lighter amber; separate accessible text tone |
| Danger | `#D94C4C` | Lighter danger; separate button/text foregrounds |
| Background / card | `#F6F8F7` / `#FFFFFF` | `#101B1A` / `#172624` |
| Text / secondary | `#1D2933` / `#687681` | Light foreground and subdued readable labels |
| Border | `#E5EBE8` | `#29403B` |

Standard radius is 12px; controls are at least 42px tall. Shadows are restrained. Focus uses the semantic ring color and reduced-motion preferences suppress animation. Stock/business states use text and icons as well as color.

## Typography

Noto Naskh Arabic is loaded locally from the existing font package, in 400/600/700 weights. No runtime font API is used. Main titles are 28px; section headings 18–20px; body/form labels 14–15px; tables 14px; secondary labels 12–13px. Urdu text has generous line height. `.number` uses a familiar system numeric font, tabular figures and Unicode isolation. Document codes/emails/phones/numeric controls explicitly use LTR. No additional font package was introduced.

## Layout and responsive rules

- Desktop at 1024px and above: fixed right sidebar, 272px wide; collapse to 80px with labeled icon links and native tooltips.
- Mobile/tablet below 1024px: full-width content and a native modal navigation drawer from the right, with inert background, focus trapping, Escape and restoration.
- Header wraps when needed; company identity, breadcrumb, search, real notifications, theme, settings and demo user remain usable.
- Cards use responsive grids; chart parents have `min-width: 0`; table overflow stays within a keyboard-focusable scrolling region.
- Design-system form controls stack on narrow screens; dialogs stay within viewport dimensions and scroll internally.

The browser suite checks 375, 768, 1024 and 1440px layouts. See `PHASE_2_ACCEPTANCE.md` for actual results and remaining verification limits.

## Theme and preferences

The separate versioned key `noor-textiles-erp-ui-v1` persists theme (`light`, `dark`, `system`), sidebar collapse, collapsed groups, preferred page size and selected demo role. It never stores domain records. A small pre-paint script applies the theme before React/CSS render; `ThemeProvider` follows system changes while system mode is selected. Invalid UI preferences produce a notice and are only overwritten after an explicit preference change. Storage failure reports that preferences are temporary.

The live ERP store mirrors role/theme for compatibility with Phase 1 consumers. The independent `createERPStore` factory retains its existing transient defaults and its single-snapshot persistence behavior. Business export/import/reset continue to use `noor-textiles-erp-demo-v1`; changing UI preferences never resets that snapshot.

## Data and financial honesty

`store/selectors/ui.ts` supplies dashboard/search/notification projections. Inventory uses the existing movement-derived selectors. Purchase value is the sum of posted goods-receipt quantities multiplied by their purchase-order unit price, in paisa; it is clearly labeled receipt valuation, not supplier invoicing. Unsafe monetary aggregates show unavailable/error states rather than inaccurate values.

Sales, profit and receivables are upcoming; no invented financial transactions or sales chart are created. The finished SKU remains catalogue-only with zero suits. Contractor notifications derive actual custody balances. Low-stock warnings use a labeled illustrative 100-meter UI threshold; no overdue notice is inferred without a due-date field.

Recent documents, activities, contractor progress, all charts and table examples come from the centralized snapshot. The form example is a single explicit UI-only record in transient `useUIStore` memory. It cannot create a supplier/order or change inventory, and it is excluded from persistence and domain export. File previews use local object URLs and never persist base64.

## Routes and showcase

`/design-system` demonstrates components, validated forms, real record tables, all five chart styles and A4 printing; tabs have keyboard navigation and can be deep-linked with `?tab=tables`, `charts` or `print`. `/processing/jobs` is a reserved honest placeholder. All original paths remain registered. Search can open a read-only existing master-record preview on its reserved destination; operational CRUD remains upcoming.

Six selectable demo work profiles reuse the current employee and show the actual underlying Phase 1 role/permission metadata. They are presentation contexts, not six fabricated staff records or secure authorization.

## Print and extension

The print showcase uses an existing purchase order, company, supplier, fabric lines, date, reference and paisa totals. A4 styles hide application chrome, repeat table headers, use borders and retain Urdu/LTR conventions. It is a print foundation; it does not post a new document or generate a real invoice.

Future modules should compose the documented controls and tables, pass real selectors into charts, and invoke validated transaction boundaries for business changes. Extend persisted schemas deliberately rather than storing ad hoc page mocks. Phase 3 should expand the connected deterministic dataset only when separately authorized.
