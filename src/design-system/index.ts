/**
 * Lawsome design system — public barrel.
 *
 * Usage: wrap a surface in <LuiRoot> to establish the scope, then compose the
 * exported components. Everything is token-driven and scoped under `.lui-root`,
 * so the design system never affects legacy screens. Per-screen rollout is
 * gated via the feature-flag exports.
 */

// Scope + tokens/fonts
export { LuiRoot, default as LuiRootDefault } from "./LuiRoot";
export type { LuiRootProps } from "./LuiRoot";

// Theme interop (opt-in)
export { luiMuiTheme } from "./theme/muiTheme";
export { LuiThemeProvider } from "./theme/LuiThemeProvider";

// Feature flags
export {
  FLAG_DEFAULTS,
  FLAGS_ENV_VAR,
  FLAGS_STORAGE_KEY,
  isKnownFlag,
  allFlagKeys,
  resolveFlag,
  parseEnvFlags,
  parseOverrides,
} from "./flags/flags";
export type { FlagKey, FlagSources } from "./flags/flags";
export {
  useFeatureFlag,
  getFeatureFlag,
  setFlagOverride,
  FeatureGate,
} from "./flags/useFeatureFlag";
export type { FeatureGateProps } from "./flags/useFeatureFlag";

// Primitives
export { Button, GoogleButton } from "./components/Button";
export type { ButtonProps, ButtonVariant } from "./components/Button";
export { Pill } from "./components/Pill";
export type { PillProps, PillTone } from "./components/Pill";
export { Field, Input, Textarea, Select, Toggle } from "./components/form";
export type { FieldProps, ToggleProps } from "./components/form";
export {
  Spinner,
  LoadingState,
  Skeleton,
  EmptyState,
  ErrorState,
} from "./components/states";
export type {
  SpinnerProps,
  LoadingStateProps,
  SkeletonProps,
  EmptyStateProps,
  ErrorStateProps,
} from "./components/states";

// Composites
export { Card, SectionHead } from "./components/Card";
export type { CardProps, SectionHeadProps } from "./components/Card";
export { StatCard, KpiCard, Meter, LineBar } from "./components/StatCard";
export type { StatCardProps, KpiCardProps, MeterRow, StatTone } from "./components/StatCard";
export { Tabs } from "./components/Tabs";
export type { TabsProps, TabItem } from "./components/Tabs";
export { Dialog } from "./components/Dialog";
export type { DialogProps } from "./components/Dialog";
export { DataTable, Pagination, TableFoot } from "./components/DataTable";
export type { DataTableProps, Column, PaginationProps, SortDirection } from "./components/DataTable";

// Shells
export { AppShell } from "./components/AppShell";
export type { AppShellProps, NavGroup, NavItem, UserChip, Crumb } from "./components/AppShell";
export { AuthLayout } from "./components/AuthLayout";
export type { AuthLayoutProps, AuthHighlight } from "./components/AuthLayout";
export { AiPreviewPanel, AI_ROADMAP_NOTE } from "./components/AiPreviewPanel";
export type { AiPreviewPanelProps } from "./components/AiPreviewPanel";
export { StepWizard, StepperRail, WizardProgress } from "./components/StepWizard";
export type { StepWizardProps, WizardStep } from "./components/StepWizard";
