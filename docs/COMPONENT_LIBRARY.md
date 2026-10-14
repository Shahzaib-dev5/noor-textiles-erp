# Phase 2 component library

Components build on the existing React/TypeScript, Tailwind and shadcn-style Button/Card/Badge primitives. No dependency versions changed. Many related primitives intentionally share one meaningful file.

| Location | Exports / purpose |
| --- | --- |
| `components/layout/AppLayout.tsx` | AppLayout, PageContainer, PageActions: main outlet, protected storage notices, responsive margins, footer |
| `components/layout/AppSidebar.tsx` | AppSidebar, SidebarNavigation, SidebarGroup, SidebarItem: grouped central routes, persistence, active nested paths, compact tooltips |
| `components/layout/AppHeader.tsx` | AppHeader, BreadcrumbNavigation, ThemeSwitcher, DemoUserMenu: company, current page, six work profiles, underlying role metadata, notifications |
| `components/layout/MobileNavigation.tsx` | Accessible native modal navigation drawer |
| `components/layout/CompanyIdentity.tsx` | Current single-company branding without new company data |
| `components/layout/GlobalSearch.tsx` | Keyboard search over routes/suppliers/fabrics/contractors; result navigation |
| `components/layout/PageHeader.tsx` | Shared page title/subtitle/actions; existing PageHeading is a compatible export |
| `components/dashboard/StatCard.tsx` | title, value, subtitle, icon, optional trend/trendLabel, loading, status and onClick |
| `components/dashboard/QuickActions.tsx` | Six functional shortcuts to honest future module destinations |
| `components/dashboard/ActivityFeed.tsx` | Existing activity logs with SEED/USER origin and dates |
| `components/tables/DataTable.tsx` | DataTable, Toolbar, Filters, Pagination, ColumnHeader, RowActions, TableSkeleton, TableEmptyState, TableErrorState |
| `components/tables/StatusBadge.tsx` | Semantic display badge using `locales/ur/status.ts`; it never transitions a document |
| `components/forms/controls.tsx` | FormField, ValidationMessage, TextInput, NumberInput, CurrencyInput, QuantityInput, DateInput, SelectInput, SearchableSelect, TextArea, CheckboxField, RadioField, SwitchField, FileUploadPreview, FormSection, FormActions |
| `components/dialogs/Dialog.tsx` | FormDialog, DetailsDrawer, ConfirmationDialog, DeleteConfirmationDialog, UnsavedChangesDialog |
| `components/feedback/states.tsx` | AlertBanner, InlineError, SuccessMessage, EmptyState, LoadingOverlay |
| `components/feedback/ToastNotification.tsx` | Transient accessible toast presentation; `store/toasts.ts` owns messages/dismissal |
| `components/charts/Charts.tsx` | LineChart, BarChart, AreaChart, DonutChart, ProgressChart with responsive sizing, real-data props, Urdu labels, PKR/quantity formatting, theme, loading/empty states |
| `components/ui/tabs.tsx`, `accordion.tsx` | Keyboard RTL tabs and native accessible disclosure accordion |
| `features/design-system/*` | Live component reference, Zod/RHF UI-only form, real-record tables and purchase-order print showcase |

## Table contracts

`DataTable<T>` accepts stable `rowId`, real `rows`, typed `TableColumn<T>[]` with scalar value accessors and optional React renderers, typed predicate filters, optional details callback, loading/error and an optional initial page size. Search matches scalar values; numbers sort numerically and strings use Urdu-aware locale ordering. Sorting copies the filtered array and does not mutate the input. Page count clamps safely when rows/filter change.

Selection uses stable IDs. The header selects only filtered rows; selected export uses currently existing selected records, otherwise export uses all filtered records, not just the visible page. Visibility retains at least one data column. Page-size changes persist separately as UI preferences; a table without an explicit initial override respects them on its next mount. Loading/error/empty states are explicit. Details are read-only; no fake edit/delete actions are offered on domain records.

CSV includes a UTF-8 BOM, quoted headers/cells, escaped quotes, original precision and spreadsheet-formula protection. It invokes a real local download and reports success/failure via toast.

## Form contracts

Labels must refer to stable input IDs. Provide `aria-invalid` and error descriptions; `FormField` supplies the visible required marker and message. Native inputs retain registration refs through React 19. SearchableSelect provides listbox/combobox keyboard behavior and only commits known options.

The example validates name/email/local phone/code, positive four-decimal meter quantity, paisa-safe rupee price, real fabric ID, ISO date, notes and explicit UI-only confirmation. It updates one transient record with stable ID `ui-example:1`, never the domain ledger. Discard/delete confirmations apply only to this example. File previews accept bounded PNG/JPEG/WebP files, revoke object URLs and never persist file contents.

## Dialog, feedback and status contracts

Dialogs are controlled via `open/onClose` and labeled through generated IDs. The browser owns focus trapping/inert background/restoration. Confirmation actions require callbacks; no empty functional-looking button is generated. Settings reset invokes its unchanged Phase 1 store action only after confirmation.

Toasts have optional success/error/info tones and expire after six seconds, with explicit dismiss buttons. Banners/errors retain text, icons and semantic roles. Future paid/pending/overdue labels are visual vocabulary only; active badges render actual Phase 1 statuses. Different document state machines remain in the domain layer.

## Chart contracts

Supply real `{label, value}` data from selectors. Monetary values are integer paisa. Empty or all-zero series render honest empty states; the sales chart is explicitly upcoming. Chart colors are semantic CSS variables and adapt to the current theme. Legends/tooltips do not create data. Inventory charts label meters, not suits.

## Extension rules

Reuse central routes and selectors. Never create disconnected module mocks, alter domain types for convenience, or mutate authoritative stock through form controls. Implement later business transactions with meaningful tests before exposing their commands. The component showcase is a visual/interaction reference, not a completed manufacturing or accounting module.
