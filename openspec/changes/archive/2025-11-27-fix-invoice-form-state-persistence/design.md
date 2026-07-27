# Design: Fix Invoice Form State Persistence

**Change ID**: `fix-invoice-form-state-persistence`

## Architecture Context

The invoice management feature follows a container/presentation pattern:

```
InvoiceTab (Container)
  └─ InvoiceTabPresentation (UI Component)
       └─ useCaseInvoices (State Management Hook)
```

### Current State Management

1. **Hook State** (`useCaseInvoices.ts`):
   - `invoiceForm`: Form field values (managed by hook)
   - `showAddInvoice`: Form visibility toggle (managed by hook)
   - `addingInvoice`: Submission loading state (managed by hook)

2. **Component State** (`InvoiceTab.tsx`):
   - `selectedFile`: File object for UI display (managed locally)
   - `uploadingFile`: File processing state (managed locally)

### Problem: State Synchronization

The issue occurs because the hook successfully resets `invoiceForm` after submission, but the component's local `selectedFile` state is not synchronized with this reset operation.

## Design Decision

### Selected Approach: Callback-Based State Reset

Implement a callback mechanism where the presentation component exposes a `resetFileSelection` function that the container calls after successful submission.

**Flow**:
```
1. User submits invoice
2. Hook's handleAddInvoice validates and sends API request
3. API request succeeds
4. Hook resets invoiceForm state
5. Hook calls resetFileSelection callback ← NEW
6. Component clears selectedFile and file input ← NEW
7. Hook sets showAddInvoice to false
8. User sees clean form on next open
```

### Implementation Strategy

#### Option 1: Imperative Callback (Selected)
```typescript
// InvoiceTabPresentation
const resetFileSelection = useCallback(() => {
  setSelectedFile(null);
  const fileInput = document.getElementById('invoice-file-upload') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
}, []);

// Pass as prop
onResetFileSelection={resetFileSelection}

// Container calls after successful submission
resetFileSelectionRef.current?.();
```

**Pros**:
- Simple, explicit control flow
- Minimal changes to existing code
- Clear separation of concerns
- No prop drilling

**Cons**:
- Requires ref management
- Slightly imperative style

#### Option 2: State Lifting (Rejected)
Move `selectedFile` state to the hook.

**Pros**:
- Centralized state management
- Automatic synchronization

**Cons**:
- Violates current architecture pattern
- File state is purely presentational
- Increases hook complexity
- Requires more extensive refactoring

#### Option 3: Effect-Based Synchronization (Rejected)
Use `useEffect` to watch `showAddInvoice` changes and clear file state.

**Pros**:
- Reactive, declarative approach

**Cons**:
- Implicit side effect dependency
- May trigger on unintended cases (e.g., cancel vs success)
- Harder to debug
- Race condition risks

### Why Callback Approach?

1. **Minimal Impact**: Only touches the specific state that needs resetting
2. **Clear Intent**: Explicit function name makes purpose obvious
3. **Maintainable**: Future developers understand the connection
4. **Testable**: Easy to verify the callback is invoked
5. **Consistent**: Matches existing `clearSelectedFile` pattern in Cancel handler

## Component Changes

### InvoiceTab.tsx

```typescript
// Add prop to interface
interface InvoiceTabProps {
  // ... existing props
  onResetFileSelection?: () => void;
}

// Create reset function in presentation component
const resetFileSelection = useCallback(() => {
  setSelectedFile(null);
  const fileInput = document.getElementById('invoice-file-upload') as HTMLInputElement;
  if (fileInput) fileInput.value = '';
}, []);

// Pass to container
<InvoiceTabPresentation
  // ... existing props
  onResetFileSelection={resetFileSelection}
/>
```

### useCaseInvoices.ts

```typescript
// Store ref to reset function
const fileSelectionResetRef = useRef<(() => void) | null>(null);

// Update handleAddInvoice
const handleAddInvoice = useCallback(async () => {
  // ... existing validation and submission logic

  // After successful submission (after line 129)
  addInvoiceValidation.reset();
  fileSelectionResetRef.current?.(); // ← ADD THIS
  setShowAddInvoice(false);
  showSuccess('Invoice added successfully');

  // ... rest of function
}, [/* dependencies */]);

// Return ref setter
return {
  // ... existing returns
  setFileSelectionReset: (fn: (() => void) | null) => {
    fileSelectionResetRef.current = fn;
  }
};
```

### Container Connection

```typescript
// In InvoiceTab container
useEffect(() => {
  invoicesHook.setFileSelectionReset(resetFileSelection);
  return () => invoicesHook.setFileSelectionReset(null);
}, [resetFileSelection]);
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Submits Invoice                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               useCaseInvoices.handleAddInvoice              │
│  1. Validate form data                                      │
│  2. Call addCaseInvoice API                                 │
│  3. Refresh invoice list                                    │
│  4. Reset invoiceForm state ✓ (existing)                   │
│  5. Clear validation errors ✓ (existing)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              NEW: Call resetFileSelection()                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          InvoiceTabPresentation.resetFileSelection          │
│  1. Clear selectedFile state                                │
│  2. Clear file input element value                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Close form (existing)                       │
│  setShowAddInvoice(false)                                   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           User reopens form - ALL STATE IS CLEAN            │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling

No additional error handling needed because:
1. File state reset is non-critical to submission success
2. Failure to reset won't corrupt data or break functionality
3. User can manually clear file if reset fails
4. Optional chaining (`?.`) prevents errors if callback not set

## Testing Considerations

### Unit Test Cases (if implemented later)
1. `resetFileSelection` clears `selectedFile` state
2. `resetFileSelection` clears file input element
3. `handleAddInvoice` calls reset callback after success
4. `handleAddInvoice` doesn't call reset callback on failure
5. Cancel button still clears file state independently

### Manual Test Scenarios
1. **Success path**: Submit → reopen → verify clean
2. **Cancel path**: Upload → cancel → reopen → verify clean
3. **Failure path**: Upload → submit (fail) → verify file retained
4. **Multiple submissions**: Submit → reopen → submit → reopen → verify clean each time

## Performance Impact

**None**. This change:
- Adds one function call per successful submission
- No additional re-renders
- No additional API calls
- No memory leaks (proper cleanup in useEffect)

## Backwards Compatibility

**Fully compatible**. No breaking changes:
- API contracts unchanged
- Data structures unchanged
- Existing behavior preserved
- Only adds new internal callback mechanism

## Future Considerations

If more form fields need similar reset logic in the future, consider:
1. Extracting to a custom `useFormReset` hook
2. Implementing a more comprehensive form state manager
3. Using React Hook Form or similar library

For now, the simple callback approach is sufficient and appropriate for this isolated case.
