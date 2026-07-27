import React from "react";
import { Pencil, UploadCloud, Paperclip, X, Trash2 } from "lucide-react";
import CurrencyInput from "react-currency-input-field";
import { Dialog, Field, Textarea, Select, Button } from "@/design-system";
import { PaymentStatus, CaseInvoice } from "@/app/organization/types/caseindex";
import { useToast } from "@/contexts/ToastContext";

interface EditInvoiceModalProps {
  open: boolean;
  loading: boolean;
  invoice: CaseInvoice | null;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    dueDate: string;
    paymentStatus: PaymentStatus;
    remarks: string;
    invoiceContent: string;
    invoiceFileName: string;
  }) => void;
  /** When true, shows a Delete Invoice action. */
  canDelete?: boolean;
  /** Called when the Delete Invoice action is clicked. */
  onDelete?: () => void;
}

const FILE_INPUT_ID = "edit-modal-file-upload";
const MAX_FILE_BYTES = 1048576; // 1MB

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({
  open,
  loading,
  invoice,
  onClose,
  onSubmit,
  canDelete = false,
  onDelete,
}) => {
  const { showError } = useToast();
  const [formData, setFormData] = React.useState({
    amount: 0,
    dueDate: "",
    paymentStatus: PaymentStatus.Pending,
    remarks: "",
  });
  const [localSelectedFile, setLocalSelectedFile] = React.useState<File | null>(null);
  const [localUploadingFile, setLocalUploadingFile] = React.useState(false);
  const [newFileContent, setNewFileContent] = React.useState<string | null>(null);
  const [newFileName, setNewFileName] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Initialize form when invoice changes
  React.useEffect(() => {
    if (invoice) {
      setFormData({
        amount: invoice.amount,
        dueDate: invoice.dueDate,
        paymentStatus: invoice.paymentStatus,
        remarks: invoice.remarks || "",
      });
      // Reset file state
      setLocalSelectedFile(null);
      setNewFileContent(null);
      setNewFileName(null);
      setErrors({});
    }
  }, [invoice]);

  const handleFieldChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_BYTES) {
        showError("File size exceeds 1MB limit. Please upload a smaller file.");
        e.target.value = "";
        return;
      }
      setLocalSelectedFile(file);
      setNewFileName(file.name);
      setLocalUploadingFile(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1];
        setNewFileContent(base64Data);
        setLocalUploadingFile(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedFile = () => {
    setLocalSelectedFile(null);
    setNewFileContent(null);
    setNewFileName(null);
    const fileInput = document.getElementById(FILE_INPUT_ID) as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Amount is required and must be greater than 0";
    }
    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }
    if (!formData.paymentStatus) {
      newErrors.paymentStatus = "Payment status is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !invoice) return;

    // Determine file content and name to send
    let finalContent: string;
    let finalFileName: string;

    if (newFileContent && newFileName) {
      finalContent = newFileContent;
      finalFileName = newFileName;
    } else {
      // Use existing file data from the invoice
      finalContent = invoice.invoiceContent || "";
      finalFileName = invoice.invoiceFileName || `invoice_${invoice.id}`;
    }

    onSubmit({
      amount: formData.amount,
      dueDate: formData.dueDate,
      paymentStatus: formData.paymentStatus,
      remarks: formData.remarks,
      invoiceContent: finalContent,
      invoiceFileName: finalFileName,
    });
  };

  const hasExistingFile = invoice?.invoiceContent && invoice.invoiceContent.trim() !== "";
  const dueDateValue = formData.dueDate ? formData.dueDate.slice(0, 10) : "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit Invoice"
      subtitle="Update invoice details for this case"
      icon={Pencil}
      footer={
        <>
          {canDelete && (
            <Button
              variant="ghost"
              icon={Trash2}
              onClick={onDelete}
              disabled={loading}
              style={{ marginRight: "auto", color: "var(--danger)" }}
            >
              Delete Invoice
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="form-2col">
        {/* Amount */}
        <Field
          label="Amount (₹)"
          required
          error={!!errors.amount}
          hint={errors.amount || undefined}
        >
          <CurrencyInput
            className="input"
            name="amount"
            placeholder="0.00"
            value={formData.amount === 0 ? undefined : formData.amount}
            onValueChange={(value, name, values) => {
              const numericValue = values?.float || 0;
              handleFieldChange("amount", numericValue);
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
          error={!!errors.dueDate}
          hint={errors.dueDate || undefined}
        >
          <input
            className="input"
            type="date"
            required
            value={dueDateValue}
            onChange={(e) =>
              handleFieldChange(
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
        error={!!errors.paymentStatus}
        hint={errors.paymentStatus || undefined}
      >
        <Select
          value={formData.paymentStatus}
          onChange={(e) => handleFieldChange("paymentStatus", e.target.value as PaymentStatus)}
        >
          {Object.values(PaymentStatus).map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </Field>

      {/* Remarks */}
      <Field label="Remarks" full>
        <Textarea
          rows={3}
          placeholder="Enter invoice remarks"
          value={formData.remarks}
          onChange={(e) => handleFieldChange("remarks", e.target.value)}
        />
      </Field>

      {/* Invoice File Upload */}
      <Field label="Invoice File" full>
        {hasExistingFile && !newFileContent && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 14px",
              border: "1px solid var(--border)",
              borderRadius: 10,
              marginBottom: 12,
              background: "var(--ok-soft)",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Paperclip width={16} height={16} style={{ color: "var(--ok)" }} aria-hidden />
              <span style={{ fontSize: 13, color: "var(--ok)", fontWeight: 500 }}>
                Current invoice file attached
              </span>
            </span>
            <Button
              variant="ghost"
              onClick={clearSelectedFile}
              style={{ color: "var(--danger)" }}
            >
              Remove &amp; Replace
            </Button>
          </div>
        )}

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
            {localUploadingFile ? "Processing…" : newFileContent ? "Change File" : "Choose File"}
          </Button>

          {localSelectedFile && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Paperclip width={15} height={15} style={{ color: "var(--brand)" }} aria-hidden />
              <span style={{ fontSize: 13, color: "var(--brand)", fontWeight: 500 }}>
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
        <div className="hint">
          Supported formats: PDF, DOC, DOCX, PNG, JPG, JPEG. Max size: 1MB
        </div>
      </Field>
    </Dialog>
  );
};

export default EditInvoiceModal;
