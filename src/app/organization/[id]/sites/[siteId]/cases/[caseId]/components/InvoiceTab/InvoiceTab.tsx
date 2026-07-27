import React from "react";
import {
  Receipt,
  CircleCheckBig,
  Clock,
  CreditCard,
  Download,
  X,
  CalendarDays,
} from "lucide-react";
import {
  Button,
  Pill,
  StatCard,
  DataTable,
  Pagination,
  LoadingState,
  EmptyState,
  Select,
  type Column,
  type PillTone,
} from "@/design-system";
import {
  CaseInvoice,
  PaymentStatus,
  AddCaseInvoiceRequest,
} from "@/app/organization/types/caseindex";
import { useCaseInvoices } from "../../hooks/useCaseInvoices";
import { useListQuery } from "@/hooks/useListQuery";
import type { InvoiceListFilters } from "../../types/filterTypes";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import { formatRupees } from "../../utils";
import { formatDisplayDate, getStatusLabel } from "@/utils";
import GenerateInvoiceModal from "../../../../../../../../../components/modals/GenerateInvoiceModal";
import EditInvoiceModal from "../../../../../../../../../components/modals/EditInvoiceModal";

// Container props interface
interface InvoiceTabContainerProps {
  caseId: string;
  siteId: string;
  organizationId: string;
  /** Show generate/edit controls (resource ≥ Edit). Defaults to true. */
  canCreateOrEditResource?: boolean;
  /** Show delete controls (resource === Full). Defaults to true. */
  canDeleteResource?: boolean;
}

interface InvoiceTabProps {
  canCreateOrEditResource: boolean;
  canDeleteResource: boolean;
  // Invoice data
  invoices: CaseInvoice[];
  loadingInvoices: boolean;

  // Invoice forms
  showAddInvoice: boolean;
  addingInvoice: boolean;
  updatingInvoice: boolean;
  invoiceForm: AddCaseInvoiceRequest;

  // Delete invoice modal state
  deleteInvoiceModalOpen: boolean;
  invoiceToDelete: CaseInvoice | null;

  // Validation errors
  invoiceErrors: Record<string, string>;
  invoiceApiErrors: string[] | null;

  // Actions
  onSetShowAddInvoice: (show: boolean) => void;
  onInvoiceFormChange: (
    field: keyof AddCaseInvoiceRequest,
    value: string | number,
  ) => void;
  onAddInvoice: () => void;
  onCancelAddInvoice: () => void;
  onUpdateInvoice: (invoiceId: string, data: {
    amount: number;
    dueDate: string;
    paymentStatus: PaymentStatus;
    remarks: string;
    invoiceContent: string;
    invoiceFileName: string;
  }) => Promise<void>;
  onDeleteInvoice: (invoice: CaseInvoice) => void;
  onConfirmDeleteInvoice: () => Promise<void>;
  onCloseDeleteInvoiceModal: () => void;
  onUpdatePaymentStatus: (invoiceId: string, status: PaymentStatus) => void;
  onDownloadInvoice: (invoice: CaseInvoice) => void;
  onSetInvoiceApiErrors: (errors: string[] | null) => void;
  statusValue: string | undefined;
  sortValue: string;
  hasActiveFilters: boolean;
  onStatusFilterChange: (v: string | undefined) => void;
  onSortChange: (v: string) => void;
  onClearFilters: () => void;
}

const PAYMENT_STATUS_TONE: Record<PaymentStatus, PillTone> = {
  [PaymentStatus.Paid]: "ok",
  [PaymentStatus.Pending]: "warn",
  [PaymentStatus.Failed]: "danger",
  [PaymentStatus.None]: "neutral",
};

const STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "Paid", label: "Paid" },
  { value: "Overdue", label: "Overdue" },
  { value: "Cancelled", label: "Cancelled" },
];

const InvoiceTabPresentation: React.FC<InvoiceTabProps> = ({
  canCreateOrEditResource,
  canDeleteResource,
  invoices,
  loadingInvoices,
  showAddInvoice,
  addingInvoice,
  updatingInvoice,
  invoiceForm,
  deleteInvoiceModalOpen,
  invoiceToDelete,
  invoiceErrors,
  invoiceApiErrors,
  onSetShowAddInvoice,
  onInvoiceFormChange,
  onAddInvoice,
  onCancelAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onConfirmDeleteInvoice,
  onCloseDeleteInvoiceModal,
  onUpdatePaymentStatus,
  onDownloadInvoice,
  onSetInvoiceApiErrors,
  statusValue,
  sortValue,
  hasActiveFilters,
  onStatusFilterChange,
  onSortChange,
  onClearFilters,
}) => {
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [selectedEditInvoice, setSelectedEditInvoice] = React.useState<CaseInvoice | null>(null);

  // Calculate summary totals
  const summaryData = React.useMemo(() => {
    const totalPendingAmount = invoices
      .filter(
        (invoice) =>
          invoice.paymentStatus === PaymentStatus.Pending ||
          invoice.paymentStatus === PaymentStatus.Failed ||
          invoice.paymentStatus === PaymentStatus.None,
      )
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const totalReceivedAmount = invoices
      .filter((invoice) => invoice.paymentStatus === PaymentStatus.Paid)
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    const totalAmount = invoices.reduce(
      (sum, invoice) => sum + invoice.amount,
      0,
    );

    return {
      totalPendingAmount,
      totalReceivedAmount,
      totalAmount,
      pendingCount: invoices.filter(
        (invoice) =>
          invoice.paymentStatus === PaymentStatus.Pending ||
          invoice.paymentStatus === PaymentStatus.Failed ||
          invoice.paymentStatus === PaymentStatus.None,
      ).length,
      paidCount: invoices.filter(
        (invoice) => invoice.paymentStatus === PaymentStatus.Paid,
      ).length,
    };
  }, [invoices]);

  const handleEditClick = (invoice: CaseInvoice) => {
    setSelectedEditInvoice(invoice);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (data: {
    amount: number;
    dueDate: string;
    paymentStatus: PaymentStatus;
    remarks: string;
    invoiceContent: string;
    invoiceFileName: string;
  }) => {
    if (selectedEditInvoice) {
      await onUpdateInvoice(selectedEditInvoice.id, data);
      setEditModalOpen(false);
      setSelectedEditInvoice(null);
    }
  };

  const handleDeleteFromModal = () => {
    if (selectedEditInvoice) onDeleteInvoice(selectedEditInvoice);
  };

  const handleConfirmDeleteAndClose = async () => {
    await onConfirmDeleteInvoice();
    setEditModalOpen(false);
    setSelectedEditInvoice(null);
  };

  const canOpen = canCreateOrEditResource || canDeleteResource;

  const columns: Column<CaseInvoice>[] = [
    {
      key: "invoice",
      header: "Invoice #",
      render: (inv) => (
        <div className="case-row-title">
          <b>{inv.invoiceFileName}</b>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (inv) => (
        <span style={{ fontWeight: 600, color: "var(--brand)" }}>
          {formatRupees(inv.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (inv) => (
        <Pill tone={PAYMENT_STATUS_TONE[inv.paymentStatus] ?? "neutral"} dot>
          {getStatusLabel(inv.paymentStatus)}
        </Pill>
      ),
    },
    {
      key: "generated",
      header: "Generated date",
      render: (inv) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <CalendarDays width={14} height={14} style={{ color: "var(--text-3)" }} aria-hidden />
          {formatDisplayDate(inv.generatedDate)}
        </span>
      ),
    },
    {
      key: "due",
      header: "Due date",
      render: (inv) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <CalendarDays width={14} height={14} style={{ color: "var(--text-3)" }} aria-hidden />
          {formatDisplayDate(inv.dueDate)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (inv) => (
        <span style={{ display: "inline-flex", gap: 4, justifyContent: "flex-end" }}>
          {inv.paymentStatus !== PaymentStatus.Paid && (
            <Button
              variant="ghost"
              icon={CreditCard}
              title="Mark as Paid"
              aria-label="Mark as Paid"
              onClick={(e) => {
                e.stopPropagation();
                onUpdatePaymentStatus(inv.id, PaymentStatus.Paid);
              }}
            />
          )}
          {inv.invoiceContent && inv.invoiceContent.trim() !== "" && (
            <Button
              variant="ghost"
              icon={Download}
              title="Download Invoice File"
              aria-label="Download Invoice File"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadInvoice(inv);
              }}
            />
          )}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="toolbar">
        {canCreateOrEditResource && (
          <Button variant="primary" icon={Receipt} onClick={() => onSetShowAddInvoice(true)}>
            Generate invoice
          </Button>
        )}
        <span className="grow" />
        <div className="selectbox">
          <Select
            aria-label="Status"
            value={statusValue ?? ""}
            onChange={(e) => onStatusFilterChange(e.target.value || undefined)}
          >
            <option value="">All status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="selectbox">
          <Select aria-label="Sort" value={sortValue} onChange={(e) => onSortChange(e.target.value)}>
            <option value="">Default sort</option>
            <option value="createdDate:desc">Newest first</option>
            <option value="createdDate:asc">Oldest first</option>
            <option value="status:asc">Status A→Z</option>
          </Select>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" icon={X} onClick={onClearFilters}>
            Clear
          </Button>
        )}
      </div>

      {/* Invoice Summary */}
      {invoices.length > 0 && (
        <div className="stat-row" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <StatCard
            icon={CircleCheckBig}
            tone="ok"
            value={formatRupees(summaryData.totalReceivedAmount)}
            label={`Total received · ${summaryData.paidCount} invoice${summaryData.paidCount !== 1 ? "s" : ""}`}
          />
          <StatCard
            icon={Clock}
            tone="warn"
            value={formatRupees(summaryData.totalPendingAmount)}
            label={`Pending payment · ${summaryData.pendingCount} invoice${summaryData.pendingCount !== 1 ? "s" : ""}`}
          />
          <StatCard
            icon={Receipt}
            tone="violet"
            value={formatRupees(summaryData.totalAmount)}
            label={`Total amount · ${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
          />
        </div>
      )}

      {/* Add Invoice Modal */}
      <GenerateInvoiceModal
        open={showAddInvoice}
        loading={addingInvoice}
        invoiceForm={invoiceForm}
        invoiceErrors={invoiceErrors}
        invoiceApiErrors={invoiceApiErrors}
        onClose={onCancelAddInvoice}
        onSubmit={onAddInvoice}
        onFormChange={onInvoiceFormChange}
        onSetApiErrors={onSetInvoiceApiErrors}
      />

      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        open={editModalOpen}
        loading={updatingInvoice}
        invoice={selectedEditInvoice}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedEditInvoice(null);
        }}
        onSubmit={handleEditSubmit}
        canDelete={canDeleteResource}
        onDelete={handleDeleteFromModal}
      />

      {/* Invoices List */}
      {loadingInvoices ? (
        <LoadingState message="Loading invoices…" />
      ) : invoices.length > 0 ? (
        <DataTable
          columns={columns}
          rows={invoices}
          getRowKey={(inv) => String(inv.id)}
          onRowClick={canOpen ? (inv) => handleEditClick(inv) : undefined}
        />
      ) : (
        <EmptyState
          icon={Receipt}
          title="No invoices generated"
          description={
            canCreateOrEditResource
              ? "Click 'Generate invoice' to create a new invoice for this case."
              : "No invoices have been generated for this case."
          }
          action={
            canCreateOrEditResource ? (
              <Button variant="primary" icon={Receipt} onClick={() => onSetShowAddInvoice(true)}>
                Generate invoice
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Delete Invoice Modal */}
      <DeleteConfirmationModal
        open={deleteInvoiceModalOpen}
        onClose={onCloseDeleteInvoiceModal}
        onConfirm={handleConfirmDeleteAndClose}
        entityType="invoice"
        entityName={invoiceToDelete?.invoiceFileName}
      />
    </div>
  );
};

// Container component
export const InvoiceTab: React.FC<InvoiceTabContainerProps> = ({
  caseId,
  siteId,
  organizationId,
  canCreateOrEditResource = true,
  canDeleteResource = true,
}) => {
  const { params, state, setPage, setSort, clearSort, setFilter, clearFilters } = useListQuery<InvoiceListFilters>({
    defaultSort: { sortBy: "createdDate", sortDirection: "desc" },
    sortableFields: ["createdDate", "status"],
    filterKeys: ['status'],
  });
  const invoicesHook = useCaseInvoices(organizationId, siteId, caseId, params);
  const meta = invoicesHook.invoicesMeta;

  const hasActiveFilters = !!state.filters.status;
  const sortValue = state.sortBy ? `${state.sortBy}:${state.sortDirection ?? 'asc'}` : '';
  const handleSortChange = (val: string) => {
    if (!val) { clearSort(); return; }
    const [field, dir] = val.split(':');
    setSort(field, dir as 'asc' | 'desc');
  };

  return (
    <>
    <InvoiceTabPresentation
      canCreateOrEditResource={canCreateOrEditResource}
      canDeleteResource={canDeleteResource}
      invoices={invoicesHook.invoices}
      loadingInvoices={invoicesHook.loadingInvoices}
      showAddInvoice={invoicesHook.showAddInvoice}
      addingInvoice={invoicesHook.addingInvoice}
      updatingInvoice={invoicesHook.updatingInvoice}
      invoiceForm={invoicesHook.invoiceForm}
      deleteInvoiceModalOpen={invoicesHook.deleteInvoiceModalOpen}
      invoiceToDelete={invoicesHook.invoiceToDelete}
      invoiceErrors={invoicesHook.invoiceErrors}
      invoiceApiErrors={invoicesHook.invoiceApiErrors}
      onSetShowAddInvoice={invoicesHook.setShowAddInvoice}
      onInvoiceFormChange={invoicesHook.handleInvoiceFormChange}
      onAddInvoice={invoicesHook.handleAddInvoice}
      onCancelAddInvoice={invoicesHook.handleCancelAddInvoice}
      onUpdateInvoice={invoicesHook.handleUpdateInvoiceWithData}
      onDeleteInvoice={invoicesHook.handleDeleteInvoice}
      onConfirmDeleteInvoice={invoicesHook.confirmDeleteInvoice}
      onCloseDeleteInvoiceModal={invoicesHook.handleCloseDeleteInvoiceModal}
      onUpdatePaymentStatus={invoicesHook.handleUpdatePaymentStatus}
      onDownloadInvoice={invoicesHook.handleDownloadInvoice}
      onSetInvoiceApiErrors={invoicesHook.setInvoiceApiErrors}
      statusValue={state.filters.status}
      sortValue={sortValue}
      hasActiveFilters={hasActiveFilters}
      onStatusFilterChange={(v) => setFilter('status', v)}
      onSortChange={handleSortChange}
      onClearFilters={clearFilters}
    />
    {meta && meta.totalCount > 0 && (
      <div className="tbl-foot" style={{ marginTop: 14 }}>
        <span className="cnt">
          {meta.totalCount} invoice{meta.totalCount === 1 ? "" : "s"}
        </span>
        <Pagination
          page={state.page}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          disabled={invoicesHook.loadingInvoices}
        />
      </div>
    )}
    </>
  );
};
