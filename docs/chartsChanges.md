# Charts Change Log

All changes made when adding the Pie and Line charts to the organization dashboard.

---

## Task 3 — Charts (Pie + Line) — 2026-03-23

### 1. `package.json` — recharts dependency added
**Changed:** Ran `npm install recharts` — added `recharts` as a dependency.
**Reason:** No chart library was present. Prototype uses recharts v3.7.0; installed the same.

---

### 2. `src/app/organization/[id]/page.tsx` — New recharts import (line ~48)
**Added:**
```ts
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
         LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
```
**Reason:** Required for rendering the two chart cards.

---

### 3. `src/app/organization/[id]/page.tsx` — Chart cards section (after metric cards)
**Added:** A new `{(() => { ... })()}` IIFE block inserted between the metric cards `</Grid>` and the `<Paper>` Tabs section.

Contains:
- **`PIE_COLORS`** — color map for Open (blue #3B82F6), In Progress (purple #8B5CF6), On Hold (amber #F59E0B), Closed (green #10B981)
- **`pieData`** — 3 segments matching prototype: Open (#3B82F6 blue), Pending (#F59E0B orange — combines InProgress+OnHold), Closed (#10B981 green); zero-value entries filtered out
- **`growthData`** — derives last-6-months monthly case intake from `allCases.createdDate / createdAt`
- **`renderPieLabel`** — inline function rendering outside labels `"Name: value"` for each pie segment
- **Pie chart card** (`Grid item xs={12} md={6}`) — donut chart, innerRadius 65, outerRadius 98, with Tooltip and Legend
- **Line chart card** (`Grid item xs={12} md={6}`) — monotone line, blue stroke #3B82F6, clean axes

**Reason:** Match the prototype screenshot showing "Case Status Distribution" (left) and "Firm Growth — Incoming Cases" (right) below the 4 metric cards.

---

### 4. `src/app/organization/services/api.ts` — Temporary console.log in fetchOrganizationCases (line ~373)
**Added:** `console.log('[fetchOrganizationCases] status=%s response.data=', response.status, response.data);`
**Reason:** Diagnose why `allCases` shows 0 — need to inspect actual API response structure (may be `{ data: [] }`, `{ items: [] }`, or a raw array).
**Note:** Remove this log once the response structure is confirmed and extraction is correct.

---

---

## Task 4 — Chart Componentisation — 2026-03-24

### 5. `src/app/organization/components/CaseStatusPieChart.tsx` — New component
**Added:** Extracted the pie chart into a standalone `CaseStatusPieChart` component.
- **Props:** `cases: Case[]`
- Derives `pieData` internally (Open / In Progress / On Hold / Closed segments, zero-value entries filtered out)
- Contains `renderPieLabel`, `PIE_COLORS`, and all recharts imports (`PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`, `ResponsiveContainer`)
- Card shell (`borderRadius 3`, `border #f1f5f9`, `p: 3`, `flex: 1`) included inside the component so the parent only needs a flex Grid item
**Reason:** Reduce inline complexity in `page.tsx`; makes the chart independently testable and reusable.

---

### 6. `src/app/organization/components/FirmGrowthLineChart.tsx` — New component
**Added:** Extracted the line chart into a standalone `FirmGrowthLineChart` component.
- **Props:** `cases: Case[]`
- Derives `growthData` (last 6 months monthly case count) internally via `buildGrowthData()`
- Contains all recharts imports (`LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`)
- Card shell included inside the component
**Reason:** Same as above — isolates growth chart logic from the dashboard page.

---

### 7. `src/app/organization/[id]/page.tsx` — Chart IIFE removed, components imported
**Changed:**
- Removed the inline `{(() => { ... })()}` IIFE block that held all chart logic
- Removed the `recharts` import line (no longer needed in `page.tsx`)
- Added imports for `CaseStatusPieChart` and `FirmGrowthLineChart`
- Replaced the IIFE with a clean Grid container holding the two components:
```tsx
<Grid container spacing={2} sx={{ mb: 3 }} alignItems="stretch">
  <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
    <CaseStatusPieChart cases={allCases} />
  </Grid>
  <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
    <FirmGrowthLineChart cases={allCases} />
  </Grid>
</Grid>
```
**Reason:** `page.tsx` now delegates chart rendering to components; equal-height layout preserved via `alignItems="stretch"` + `flex: 1` on each card.

---

### Pending
- Remove console.log from `fetchOrganizationCases` after debugging
- If `response.data` structure is different from `{ data: [...] }`, update the extraction line in `fetchOrganizationCases`
