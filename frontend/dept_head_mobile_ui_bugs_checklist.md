# Department Head Mobile UI Bug & Responsiveness Checklist

> Generated following comprehensive UI testing of the Department Head Dashboard and all its subpages across mobile device viewports (320px - 428px, iPhone SE to iPhone 14 Pro Max / Android).
>
> **Safety Guarantee**: Every item below is frontend-only (`frontend/` directory). No backend code or contracts are touched.
> **Rule Compliance**: No emojis used; secure token and auth boundaries preserved.

---

## Scope of Source Files Tested

| Page / Component | File Path |
|---|---|
| Main Dashboard | `src/pages/institution/dashboard/department-head-dashboard-page.jsx` |
| Board Layout Container | `src/components/commons/dashboard-board.jsx` |
| Rearrange Controls | `src/components/commons/dashboard-rearrange-controls.jsx` |
| Period Comparison | `src/components/institution/department-period-comparison.jsx` |
| Co-Authorities Dialog | `src/components/institution/co-authorities-dialog.jsx` |
| Sections & Roster Tab | `src/components/institution/sections-tab.jsx` |
| Programs Page | `src/pages/institution/dashboard/department-head-programs-page.jsx` |
| Department Workspace | `src/pages/institution/departments/institution-department-workspace-page.jsx` |
| Assessment Results Page | `src/pages/institution/departments/institution-assessment-results-page.jsx` |
| Learner Analytics Detail | `src/pages/institution/departments/institution-department-learner-page.jsx` |
| Assessment Builder | `src/pages/institution/certifications/institution-assessment-builder-page.jsx` |
| Question Import Workspace | `src/components/question-bank/question-import-workspace.jsx` |
| Global Dialog Component | `src/components/ui/dialog.tsx` |
| Portal Top Navigation | `src/components/navigation/portal-navigation.jsx` |

---

## 1. Global Components & Navigation Shell

### 1.1 Floating corner close button overlaps dialog content on mobile
- **File**: `src/components/ui/dialog.tsx`
- **Problem**: `useCornerAnchor` positions a 48px round close button (`size-12`) outside the dialog at `rect.right + 8px`. On viewports `<= 428px` where `DialogContent` is `max-w-[calc(100%-2rem)]` (centered with only 16px side margin), the button is clamped to `left: ~319px`, which directly overlays the top-right dialog content, titles, and form fields.
- **Fix**:
  - [x] On mobile viewports (`< sm`), disable external corner anchor calculation and render the close button as an internal relative/absolute element (`absolute top-3 right-3 size-9`) inside the dialog container.
  - [x] Ensure tap target is at least 44px with adequate padding and accessible focus state.

### 1.2 Portal top navigation brand and header squeeze on narrow screens
- **File**: `src/components/navigation/portal-navigation.jsx`
- **Problem**: On 320px–375px screens, the brand block (`REBYU DEPARTMENT` + long institution name) conflicts with the mobile menu trigger, notification bell, and avatar dropdown, causing header wrapping or icon button compression.
- **Fix**:
  - [x] Add `max-w-[140px] xs:max-w-[180px] sm:max-w-xs` to the institution name label in `Brand`.
  - [x] Ensure action icons maintain a minimum `size-9` (36px) touch target with `gap-1` on mobile without triggering horizontal scroll on `header`.

### 1.3 Mobile hamburger drawer navigation options for Department Head
- **File**: `src/components/navigation/portal-navigation.jsx`
- **Problem**: The mobile navigation dropdown currently only contains "Overview" and "Programs". Subpages like the active department workspace, sections, and notifications require multiple nested taps.
- **Fix**:
  - [x] Add quick-navigation links in `departmentHeadGroups` for the active Department Workspace (`/institution/departments`), Sections (`/institution/departments?tab=learners`), and Notifications.

---

## 2. Department Head Main Dashboard (`/institution/department-head`)

### 2.1 Critical alerts missing mobile banner
- **File**: `src/pages/institution/dashboard/department-head-dashboard-page.jsx`
- **Problem**: The alert badge in the header action group is marked `hidden sm:inline-flex`. A comment exists for a mobile banner, but no mobile-specific banner is rendered above the controls on `< sm`. Critical alerts (e.g. expiring seat allocations, unpaid invoices, high at-risk counts) are invisible on mobile until the user scrolls past multiple bento cards.
- **Fix**:
  - [x] Render a full-width mobile alert button/banner directly above the context selectors on `< sm` when `alerts.length > 0`.
  - [x] Apply pulsing danger/amber styling and smooth scroll to `#dept-alert-strip` upon tap.

### 2.2 Header action buttons row blowup in rearranging mode
- **File**: `src/pages/institution/dashboard/department-head-dashboard-page.jsx` & `src/components/commons/dashboard-rearrange-controls.jsx`
- **Problem**: The toolbar uses `grid grid-cols-2 sm:flex sm:flex-wrap`. When rearranging mode is activated, `DashboardRearrangeControls` renders 3 buttons ("Reset layout", "Cancel", "Done") inside one of the 50%-width columns (~160px), pushing buttons offscreen.
- **Fix**:
  - [x] When `layout.rearranging` is active on mobile, break the rearrange controls out into a full-width sticky bottom bar (`fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur border-t p-3 flex justify-between items-center`).
  - [x] Normal state: keep action buttons in a clean 2x2 grid on mobile with equal height (`h-9`) and full width.

### 2.3 DashboardBoard fixed row height clips cards on mobile
- **File**: `src/components/commons/dashboard-board.jsx`
- **Problem**: `DashboardBoard` defines `layouts={{ lg: currentLayout, md: currentLayout }}` without `sm` or `xs` overrides. `react-grid-layout` calculates tile height using `row * 176px`. When tiles collapse from 3 or 6 columns into 1 column on mobile, vertical content expands significantly, causing content to be clipped by `BentoTile`'s `overflow-hidden`.
- **Fix**:
  - [x] Provide explicit responsive layouts for `sm`, `xs`, and `xxs` breakpoints in `DashboardBoard` where `h` is adjusted to fit mobile stacked content, or allow auto-height on single-column mobile viewports.
  - [x] Add internal vertical scrolling (`overflow-y-auto max-h-full`) to tiles containing variable content.

### 2.4 Department Progress tile (`dept-progress`) gauge & stat clipping
- **File**: `src/pages/institution/dashboard/department-head-dashboard-page.jsx`
- **Problem**: On 375px mobile screens, the radial gauge (`min-h-[180px]`) stacked above the 4 stat boxes (`grid-cols-2`, ~130px) plus header and footer totals ~420px, exceeding the 352px tile height and cutting off the footer text ("enrolments on X programmes").
- **Fix**:
  - [x] On mobile, reduce radial gauge container to `min-h-[140px]` and diameter to `max-w-[130px]`.
  - [x] Ensure stat boxes use compact padding (`p-2`) on `< sm`.

### 2.5 Section Breakdown tile (`dept-section-breakdown`) height truncation
- **File**: `src/pages/institution/dashboard/department-head-dashboard-page.jsx`
- **Problem**: Tile is configured with `row: 1` (`176px`). The card header stacks on mobile (`flex-col sm:flex-row`), consuming ~70px. Each section row takes ~90px. If more than 1 section exists, content is severely cramped in a tiny 30px scroll viewport.
- **Fix**:
  - [x] Increase row span on mobile or set `row: 2` default for `dept-section-breakdown`.
  - [x] Ensure section items stack cleanly: section name & badge on row 1, progress bar & actions on row 2.

### 2.6 Learner roster table sticky column & touch targets
- **File**: `src/pages/institution/dashboard/department-head-dashboard-page.jsx`
- **Problem**: Learner roster table uses `minWidth: 560`. The sticky student name column (`left-0`) has no right border/shadow, causing scrolling text behind it to bleed through. The action buttons in table rows have small touch areas.
- **Fix**:
  - [x] Add a subtle border/shadow to the sticky name column (`border-r border-border/50 shadow-xs`).
  - [x] Ensure learner link and row action buttons have a minimum 44px tap target.

---

## 3. Period-over-Period Performance Comparison (`department-period-comparison.jsx`)

### 3.1 Date range badge overflow on mobile
- **File**: `src/components/institution/department-period-comparison.jsx`
- **Problem**: The comparison badge (`Current: Oct 1, 2026 - Dec 31, 2026 -> Baseline: Oct 1, 2025 - Dec 31, 2025`) measures over 350px wide. Inside a padded card on 375px screens, this overflows horizontally.
- **Fix**:
  - [x] On mobile (`< sm`), stack the date range tags into two compact rows: Current period on top, Baseline period below.
  - [x] Use shortened date formats on mobile (e.g. `10/01/26 - 12/31/26`).

### 3.2 Comparison tabs wrapping into multiple broken lines
- **File**: `src/components/institution/department-period-comparison.jsx`
- **Problem**: The 4 tabs ("Programme Scorecard", "Visual Trajectory", "Learner Momentum", "Executive Insights") sit in a `flex items-center gap-1.5` container without horizontal scrolling. On mobile screens, they wrap into 3 awkward lines, increasing header height drastically.
- **Fix**:
  - [x] Convert tab bar container to `flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1.5 scrollbar-none`.
  - [x] Add a right-fade gradient affordance for horizontal scroll indication.

### 3.3 Metric comparison cards stacking & height overflow
- **File**: `src/components/institution/department-period-comparison.jsx`
- **Problem**: 6 metric cards in `grid-cols-2` take 3 vertical rows (~260px). When combined with header, tabs, and active tab content, the tile height exceeds the fixed row height in `DashboardBoard`.
- **Fix**:
  - [x] Ensure `PeriodComparisonTile` outer wrapper has `overflow-y-auto` on mobile.
  - [x] Use compact typography for metric labels (`text-[10px]`) and baseline tags on mobile.

---

## 4. Co-Authorities Dialog (`co-authorities-dialog.jsx`)

### 4.1 Invite form input and button wrapping on mobile
- **File**: `src/components/institution/co-authorities-dialog.jsx`
- **Problem**: In `CoAuthoritiesPanel`, the email invitation form uses `flex flex-col gap-3 sm:flex-row sm:items-end`. On mobile screens, the button text wraps awkwardly and lacks full width.
- **Fix**:
  - [x] On mobile, render the submit button as a full-width button (`w-full sm:w-auto h-10`).
  - [x] Add explicit loading spinner state and minimum 44px height.

### 4.2 Pending invitation cards text truncation
- **File**: `src/components/institution/co-authorities-dialog.jsx`
- **Problem**: Long faculty emails (e.g., `associate.dean.ramirez@university.edu.ph`) overflow card boundaries in the mobile card list view.
- **Fix**:
  - [x] Add `break-all` or `truncate max-w-[200px]` to email labels in both table cells and mobile card items.

---

## 5. Department Head Programs Page (`department-head-programs-page.jsx`)

### 5.1 Department section header action buttons wrap awkwardly
- **File**: `src/pages/institution/dashboard/department-head-programs-page.jsx`
- **Problem**: Header title and action buttons ("Manage sections" and "Add program") are in `flex flex-wrap items-center justify-between gap-3`. When the department name wraps on mobile, the buttons sit left-aligned with uneven whitespace.
- **Fix**:
  - [x] On mobile (`< sm`), make the button group full-width with `grid grid-cols-2 gap-2 w-full`.

### 5.2 ProgramDialog overflow & hidden action buttons
- **File**: `src/pages/institution/dashboard/department-head-programs-page.jsx`
- **Problem**: `ProgramDialog` lacks `max-h-[85dvh] overflow-y-auto`. When the department offers multiple certifications, or when the mobile software keyboard is open, the form body overflows and hides the `Cancel` and `Save changes` buttons below the screen fold.
- **Fix**:
  - [x] Wrap form content in a scrollable container with `max-h-[calc(85dvh-8rem)] overflow-y-auto px-1`.
  - [x] Keep `DialogFooter` sticky at the bottom with a subtle top border.

---

## 6. Department Workspace Page (`institution-department-workspace-page.jsx` & `sections-tab.jsx`)

### 6.1 Workspace view switcher on mobile
- **File**: `src/pages/institution/departments/institution-department-workspace-page.jsx`
- **Problem**: `WorkspaceSidebar` renders a `<Select>` dropdown for workspace tabs on `< sm`. While functional, it hides the active tab context and requires two taps for every switch.
- **Fix**:
  - [x] Support a horizontally scrollable tab bar (`flex gap-1.5 overflow-x-auto pb-1 scrollbar-none`) with active indicator pill, allowing swipeable navigation across Sections, Authorities, Announcements, Curriculum, Question Bank, and Assessments.

### 6.2 Add Learners Dialog layout & staged list scrolling
- **File**: `src/components/institution/sections-tab.jsx`
- **Problem**: In `AddLearnersDialog`, manual entry has 3 inputs and an "Add" button in a 1-column stack on mobile. Staged learner list pushes the dialog footer offscreen because `DialogContent` lacks internal height boundaries.
- **Fix**:
  - [x] Add `max-h-[85dvh] overflow-y-auto` to `AddLearnersDialog`.
  - [x] Constrain staged learner list to `max-h-40 overflow-y-auto`.
  - [x] Make the "Add" button in manual mode full width with clear secondary styling to distinguish from the primary "Invite learners" action.

### 6.3 Sections accordion header text wrapping on mobile
- **File**: `src/components/institution/sections-tab.jsx`
- **Problem**: The accordion header for each section packs section icon, section name, pending badge, certification name, and learner count. On 320px–375px screens, badges wrap onto 3 staggered lines.
- **Fix**:
  - [x] Organize section header into a 2-line structure on mobile: Line 1 = Name + Pending Badge; Line 2 = Program/Cert + Learner Count.

---

## 7. Assessment Results Page (`institution-assessment-results-page.jsx`)

### 7.1 Summary stat tiles crowding on mobile
- **File**: `src/pages/institution/departments/institution-assessment-results-page.jsx`
- **Problem**: 4 stat tiles in `grid grid-cols-2 gap-3` on mobile can cause hint texts (e.g. "X not yet", "% of takers") to wrap into 3 lines, causing uneven tile heights.
- **Fix**:
  - [x] Standardize min-height on stat tiles (`min-h-[76px]`) and truncate or simplify hint text on mobile viewports.

### 7.2 Member attempt review sheet spacing on mobile
- **File**: `src/components/institution/member-attempt-review-sheet.jsx`
- **Problem**: Sheet header description combines assessment title, attempt number, and submission date into a single string that overflows or truncates illegibly on narrow screens.
- **Fix**:
  - [x] Break sheet header description into distinct lines on mobile.
  - [x] Ensure score stat and pass/fail badge wrap cleanly without overlapping sheet close button.

---

## 8. Department Learner Analytics Page (`institution-department-learner-page.jsx`)

### 8.1 Learner profile sidebar pushes analytics offscreen on mobile
- **File**: `src/pages/institution/departments/institution-department-learner-page.jsx`
- **Problem**: The page layout is `grid gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]`. On mobile screens, `<aside>` renders first with avatar, name, badges, 4 profile stats, and credentials card, requiring ~700px of scrolling before the user reaches any analytics or activity data.
- **Fix**:
  - [x] On mobile, render a compact collapsible profile summary banner (`flex items-center gap-3`) with an expand/collapse toggle for full profile stats.
  - [x] Place "Back to roster" button in a sticky top bar or immediately below the compact header.

### 8.2 53-Week Activity Grid horizontal scroll affordance
- **File**: `src/pages/institution/departments/institution-department-learner-page.jsx`
- **Problem**: `ActivityGrid` is ~750px wide. Inside `overflow-x-auto pb-1`, it abruptly truncates at screen edge without a scroll indicator or gradient overlay, making it appear as though only 20 weeks of activity exist.
- **Fix**:
  - [x] Add a right-fade gradient overlay (`pointer-events-none absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-card to-transparent`) and a subtle "Swipe to view full year" caption on mobile.

### 8.3 Assessment attempt bar chart touch targets
- **File**: `src/pages/institution/departments/institution-department-learner-page.jsx`
- **Problem**: `AttemptBars` renders 56px-wide attempt buttons with small percentage numbers and thin bars. Tapping a specific attempt on a touch screen often misses or triggers page scroll.
- **Fix**:
  - [x] Increase attempt column button width to minimum 64px on mobile and increase touch target padding.

---

## 9. Assessment Builder & Question Import

### 9.1 Assessment Builder 3-column layout collapse
- **File**: `src/pages/institution/certifications/institution-assessment-builder-page.jsx`
- **Problem**: The 3 columns (Basics Sidebar, Questions Canvas, Bank/Navigation) stack vertically in a fixed `h-[calc(100vh-4rem)]` container. On mobile devices, the Basics form takes up the entire visible screen, burying the Questions canvas.
- **Fix**:
  - [x] On mobile screens (`< md`), introduce a segmented view switcher (e.g. `Settings`, `Questions`, `Summary`) so Department Heads can toggle between configuring parameters and reviewing question items without infinite vertical scrolling.

### 9.2 Question Import Workspace header & toolbar stacking
- **File**: `src/components/question-bank/question-import-workspace.jsx`
- **Problem**: Top header and question toolbar contain 5 action buttons ("Start over", "Add files", "Duplicates", "Tag with AI", "Preview & save") that wrap into multiple rows, taking up over 50% of the mobile viewport.
- **Fix**:
  - [x] Consolidate secondary actions on mobile into an action dropdown menu (`MoreVertical`), keeping only the primary action button ("Preview & save" or "Tag with AI") visible.
  - [x] Ensure search bar and filter pills stay sticky below the header on mobile.

---

## Execution Order & Priority

| Priority | ID | Issue Summary | Target File | Impact |
|---|---|---|---|---|
| Critical | 1.1 | Floating corner close button overlaps dialog content | `dialog.tsx` | Fixes overlapping close button across all dialogs |
| Critical | 2.1 | Missing mobile alert banner on dashboard | `department-head-dashboard-page.jsx` | Alerts visible on mobile |
| Critical | 2.2 | Rearrange buttons overflow in 2-column mobile grid | `department-head-dashboard-page.jsx` | Fixes layout blowout during tile rearranging |
| High | 2.3 | Bento tiles fixed height clipping content on mobile | `dashboard-board.jsx` | Prevents cards from cutting off text/charts |
| High | 2.4 | Dept Progress tile gauge & footer clipping | `department-head-dashboard-page.jsx` | Full gauge and footer visible on 375px |
| High | 2.5 | Section breakdown tile 1-row height constraint | `department-head-dashboard-page.jsx` | Expands section list readability |
| High | 3.2 | Comparison tabs wrapping into 3 lines | `department-period-comparison.jsx` | Clean horizontal scrolling tabs |
| High | 5.2 | ProgramDialog vertical overflow & hidden buttons | `department-head-programs-page.jsx` | Enables submitting program form on mobile |
| High | 6.2 | AddLearnersDialog vertical overflow & staged list | `sections-tab.jsx` | Enables inviting learners on mobile |
| Medium | 1.2 | Portal header brand compression on narrow screens | `portal-navigation.jsx` | Prevents header overflow on 320px screens |
| Medium | 3.1 | Comparison date tags text overflow | `department-period-comparison.jsx` | Compact 2-row layout on mobile |
| Medium | 4.1 | Co-authorities invite form button full width | `co-authorities-dialog.jsx` | 44px tap target & clean stacking |
| Medium | 8.1 | Learner profile aside pushes analytics offscreen | `institution-department-learner-page.jsx` | Quick access to learner data |
| Medium | 8.2 | 53-week activity grid scroll affordance | `institution-department-learner-page.jsx` | Gradient hint for horizontal scroll |
| Medium | 9.2 | Question import toolbar crowding | `question-import-workspace.jsx` | Consolidate actions into mobile menu |
