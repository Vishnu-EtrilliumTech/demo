import React from "react";
import { Receipt, UploadCloud, Paperclip, X, TriangleAlert } from "lucide-react";
import CurrencyInput from "react-currency-input-field";
import { Dialog, Field, Textarea, Select, Button } from "@/design-system";
import {
  PaymentStatus,
  AddCaseInvoiceRequest,
} from "@/app/organization/types/caseindex";
import { useToast } from "@/contexts/ToastContext";

interface GenerateInvoiceModalProps {
  open: boolean;
  loading: boolean;
  invoiceForm: AddCaseInvoiceRequest;
  invoiceErrors: Record<string, string>;
  invoiceApiErrors: string[] | null;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (
    field: keyof AddCaseInvoiceRequest,
    value: string | number,
  ) => void;
  onSetApiErrors: (errors: string[] | null) => void;
}

const FILE_INPUT_ID = "modal-invoice-file-upload";
const MAX_FILE_BYTES = 1048576; // 1MB

const GenerateInvoiceModal: React.FC<GenerateInvoiceModalProps> = ({
  open,
  loading,
  invoiceForm,
  invoiceErrors,
  invoiceApiErrors,
  onClose,
  onSubmit,
  onFormChange,
  onSetApiErrors,
}) => {
  const { showError } = useToast();
  const [localSelectedFile, setLocalSelectedFile] = React.useState<File | null>(
    null,
  );
  const [localUploadingFile, setLocalUploadingFile] = React.useState(false);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (1MB = 1048576 bytes)
      if (file.size > MAX_FILE_BYTES) {
        showError("File size exceeds 1MB limit. Please upload a smaller file.");
        e.target.value = "";
        return;
      }
      setLocalSelectedFile(file);
      // Auto-populate invoice file name from uploaded file
      onFormChange("invoiceFileName", file.name);
      // Convert file to base64 and update form
      setLocalUploadingFile(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1]; // Remove data:mime;base64, prefix
        onFormChange("invoiceContent", base64Data);
        setLocalUploadingFile(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear selected file
  const clearSelectedFile = () => {
    setLocalSelectedFile(null);
    onFormChange("invoiceContent", "");
    onFormChange("invoiceFileName", "");
    // Reset file input
    const fileInput = document.getElementById(
      FILE_INPUT_ID,
    ) as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  };

  const handleClose = () => {
    clearSelectedFile();
    onClose();
  };

  const today = new Date().toISOString().slice(0, 10);
  const dueDateValue = invoiceForm.dueDate ? invoiceForm.dueDate.slice(0, 10) : "";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Generate Invoice"
      subtitle="Create a new invoice for this case"
      icon={Receipt}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" icon={Receipt} loading={loading} onClick={onSubmit}>
            Generate Invoice
          </Button>
        </>
      }
    >
      {invoiceApiErrors && invoiceApiErrors.length > 0 && (
        <div className="form-alert" role="alert">
          <TriangleAlert aria-hidden />
          <span style={{ flex: 1 }}>{invoiceApiErrors.join(" ")}</span>
          <button
            type="button"
            onClick={() => onSetApiErrors(null)}
            aria-label="Dismiss"
            style={{
              background: "none",
              border: 0,
              padding: 0,
              cursor: "pointer",
              color: "inherit",
              display: "inline-flex",
            }}
          >
            <X width={15} height={15} aria-hidden />
          </button>
        </div>
      )}

      {/* Upload Invoice File */}
      <Field label="Upload Invoice File" required>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <input
            type="file"
            id={FILE_INPUT_ID}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            style={{ display: "none" }}
          />
          <Button
            variant="secondary"
            icon={UploadCloud}
            loading={localUploadingFile}
            disabled={localUploadingFile || loading}
            onClick={() => document.getElementById(FILE_INPUT_ID)?.click()}
          >
            {localUploadingFile ? "Processing…" : "Choose File"}
          </Button>
          {localSelectedFile && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Paperclip width={15} height={15} style={{ color: "var(--ok)" }} aria-hidden />
              <span style={{ fontSize: 13, color: "var(--ok)", fontWeight: 500 }}>
                {localSelectedFile.name}
              </span>
              <Button
                variant="ghost"
                icon={X}
                onClick={clearSelectedFile}
                title="Remove file"
                aria-label="Remove file"
              />
            </span>
          )}
        </div>
        {invoiceErrors.invoiceFileName && (
          <div className="hint" style={{ color: "var(--danger)" }}>
            {invoiceErrors.invoiceFileName}
          </div>
        )}
        <div className="hint">
          Supported formats: PDF, DOC, DOCX, PNG, JPG, JPEG. Max size: 1MB
        </div>
      </Field>

      <div className="form-2col">
        {/* Amount */}
        <Field
          label="Amount (₹)"
          required
          error={!!invoiceErrors.amount}
          hint={invoiceErrors.amount || undefined}
        >
          <CurrencyInput
            className="input"
            name="amount"
            placeholder="0.00"
            value={invoiceForm.amount === 0 ? undefined : invoiceForm.amount}
            onValueChange={(value, name, values) => {
              const numericValue = values?.float || 0;
              onFormChange("amount", numericValue);
            }}
            prefix="₹"
            decimalScale={2}
            allowDecimals={true}
            allowNegativeValue={false}
            disableGroupSeparators={false}
            required
          />
        </Field>

        {/* Due Date */}
        <Field
          label="Due Date"
          required
          error={!!invoiceErrors.dueDate}
          hint={invoiceErrors.dueDate || undefined}
        >
          <input
            className="input"
            type="date"
            min={today}
            required
            value={dueDateValue}
            onChange={(e) =>
              onFormChange(
                "dueDate",
                e.target.value ? e.target.value + "T00:00:00Z" : "",
              )
            }
          />
        </Field>
      </div>

      {/* Payment Status */}
      <Field
        label="Payment Status"
        required
        error={!!invoiceErrors.paymentStatus}
        hint={invoiceErrors.paymentStatus || undefined}
      >
        <Select
          value={invoiceForm.paymentStatus}
          onChange={(e) =>
            onFormChange("paymentStatus", e.target.value as PaymentStatus)
          }
        >
          {Object.values(PaymentStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </Field>

      {/* Remarks */}
      <Field
        label="Remarks"
        full
        error={!!invoiceErrors.remarks}
        hint={invoiceErrors.remarks || undefined}
      >
        <Textarea
          rows={3}
          placeholder="Enter invoice remarks"
          value={invoiceForm.remarks}
          onChange={(e) => onFormChange("remarks", e.target.value)}
        />
      </Field>
    </Dialog>
  );
};

export default GenerateInvoiceModal;
