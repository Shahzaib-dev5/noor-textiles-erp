# Urdu RTL guidelines

## Document and layout

Keep `html lang="ur" dir="rtl"`. `ThemeProvider` enforces these attributes. Use Tailwind `start`, `end`, `ms`, `me`, `ps`, `pe`, `border-s` and `border-e`; use CSS `inset-inline-*` and `margin-inline-*` for dialogs/printing. The sidebar is physically on the right because `start` is RTL-aware. A drawer uses the same logical edge. Desktop content margin equals sidebar width.

Do not globally reverse every flex row or transform graphics. Brands, checkmarks, pie charts and chart series preserve their natural geometry. Navigation chevrons represent movement in the relevant RTL context. Tabs use ArrowLeft for the next RTL tab and ArrowRight for the previous one; Home/End select the endpoints.

## Text and data isolation

- Use the shared Urdu dictionary and status presentation map for repeated labels.
- Wrap mixed technical references in `<bdi>` or `dir="ltr"`; `.number` sets `unicode-bidi: isolate` and tabular numerals.
- Numeric/date/currency/email/phone/code inputs use LTR with Urdu labels outside them.
- Currency controls set their container LTR so the PKR suffix never overlaps the entered number.
- `formatPKR` receives integer paisa; it does not change stored values. Quantities preserve four decimal places. Dates use Asia/Karachi and ISO inputs.
- Tables align headers/cells to `start` and preserve numeric references separately; export keeps the original data with an Urdu BOM.

## Keyboard and dialogs

Native `dialog.showModal()` provides a modal top layer, focus containment, inert background and restoration to the trigger. Every modal/drawer has an accessible heading and a named close button. Escape/cancel invokes its controlled close callback; dirty example forms instead show a discard confirmation. Dialog contents remain scrollable inside the viewport. Global search supports Ctrl/Cmd+K, ArrowUp/Down, Enter and Escape. Searchable form selects support arrow keys and Enter without submitting the form accidentally.

Navigation groups expose `aria-expanded` and named controlled content. The collapsed sidebar retains meaningful link names and native `title` tooltips. Hidden mobile/desktop navigation does not remain visibly active off-screen. Pagination labels are Urdu, with previous/next icons appropriate to RTL; technical page numbers are isolated.

## Responsive tables and print

Keep overflow on the table wrapper, not on the page. The scrolling wrapper has an accessible label and keyboard focus. Toolbars and filter controls wrap naturally. Header and form labels must remain readable at 375px. Test desktop collapse, tablet/mobile drawer, both themes, real charts and long-reference tables.

Print is A4 with Urdu typography, logical text alignment, LTR document IDs, repeating table headers and clear totals/footer. Hide navigation/header/actions/toasts and preserve only the print document when its showcase is active.

## Checks and limits

Vitest tests document attributes, layout navigation, form/table/search actions and preserved business state. The Edge browser suite checks focus restoration/trapping, all four target widths, no unintended horizontal overflow, persistence and print visibility. Native browser focus behavior is not claimed from jsdom's dialog stub. Exhaustive assistive-technology and other-browser testing remain outside the current automated suite.
