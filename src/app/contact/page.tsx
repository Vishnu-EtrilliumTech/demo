"use client";

import { useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import { Mail, Phone, Send } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useFormValidation } from "@/hooks/useFormValidation";
import { maxLength, minLength, pattern, required } from "@/utils/validation";
import { extractApiErrors, extractFieldErrors } from "@/utils/errorHandler";
import { submitContactInquiry } from "@/services/contactServices";
import { ErrorAlert } from "@/components";

const SUPPORT_EMAIL = "lawsomesupport@etrilliumtech.com";
const SUPPORT_PHONE = "+91 7356754343";

// The shared email() rule is Gmail-only, which would reject work addresses.
// A contact form must accept any valid email, so we use a standard pattern here.
const anyEmail = pattern(
  "Email",
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  "Invalid email address format."
);

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontSize: "0.875rem",
    bgcolor: "#fff",
    "&:hover fieldset": { borderColor: "#3b82f6" },
    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
    "&.Mui-error fieldset": { borderColor: "#ef4444" },
  },
};

const fieldLabel = (label: string, isRequired?: boolean) => (
  <Typography
    component="label"
    sx={{
      display: "block",
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#374151",
      mb: 0.5,
    }}
  >
    {label}
    {isRequired && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
  </Typography>
);

const infoCardSx = {
  backgroundColor: "#fff",
  borderRadius: "12px",
  padding: { xs: 3, md: 3.5 },
  boxShadow: "0 2px 12px rgba(15, 23, 42, 0.06)",
};

export default function ContactPage() {
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    emailId: "",
    inquiry: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);

  const { errors, validate, clearFieldError, setErrors, reset } = useFormValidation({
    fullName: { rules: [required("Full name"), minLength("Full name", 2), maxLength("Full name", 100)] },
    emailId: { rules: [required("Email"), anyEmail, maxLength("Email", 254)] },
    inquiry: { rules: [required("Inquiry"), minLength("Inquiry", 10), maxLength("Inquiry", 2000)] },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrors(null);
    if (!validate(formData)) return;

    setIsSubmitting(true);
    try {
      await submitContactInquiry(formData);
      showSuccess("Your message has been sent. We will get back to you shortly.");
      setFormData({ fullName: "", emailId: "", inquiry: "" });
      reset();
    } catch (error: unknown) {
      const apiErrorMessages = extractApiErrors(error);
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setApiErrors(apiErrorMessages);
        showError(apiErrorMessages[0] || "Failed to send your message.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Hero */}
      <Box
        sx={{
          textAlign: "center",
          px: { xs: 2.5, md: 10 },
          pt: { xs: 2, md: 2 },
          pb: { xs: 3, md: 2 },
        }}
      >
        <h1 className="text-[32px] md:text-[48px] font-bold mb-4">
          Get in Touch with Lawsome
        </h1>
        <p className="text-[16px] md:text-[18px] text-[#626262] leading-[1.6] max-w-[720px] mx-auto">
          Have a question about managing your legal practice with Lawsome? Email us at{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-[#1D4ED8] font-semibold hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>{" "}
          or fill out the form below for a free 30-minute consultation with no commitment
          required.
        </p>
      </Box>

      {/* Info cards + form */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
          gap: { xs: 3, md: 4 },
          px: { xs: 2.5, md: 10 },
          pb: { xs: 6, md: 10 },
          maxWidth: "1280px",
          mx: "auto",
        }}
      >
        {/* Left: contact details */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 3, md: 3.5 },
            width: { xs: "100%", md: "34%" },
          }}
        >
          <Box sx={infoCardSx}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <Mail size={22} color="#3B82F6" />
              <p className="text-[18px] font-semibold text-[#333333]">Email Us</p>
            </Box>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[15px] text-[#1D4ED8] font-medium hover:underline break-all"
            >
              {SUPPORT_EMAIL}
            </a>
            <p className="text-[14px] text-[#626262] mt-1">We reply within 24 hours</p>
          </Box>

          <Box sx={infoCardSx}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <Phone size={22} color="#3B82F6" />
              <p className="text-[18px] font-semibold text-[#333333]">Call Us</p>
            </Box>
            <a
              href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
              className="text-[15px] text-[#1D4ED8] font-medium hover:underline"
            >
              {SUPPORT_PHONE}
            </a>
          </Box>

          <Box sx={{ ...infoCardSx, backgroundColor: "#F5F5F5", boxShadow: "none" }}>
            <p className="text-[18px] font-semibold text-[#333333] mb-2">
              Free Consultation
            </p>
            <p className="text-[14px] text-[#626262] leading-[1.6]">
              Book a 30-minute session with our team to walk through how Lawsome fits your
              firm&apos;s day-to-day operations — no commitment required.
            </p>
          </Box>
        </Box>

        {/* Right: message form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            ...infoCardSx,
            padding: { xs: 3, md: 5 },
            borderRadius: "16px",
            width: { xs: "100%", md: "66%" },
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              mb: 3,
            }}
          >
            <p className="text-[22px] md:text-[26px] font-bold text-[#333333]">
              Send a Message
            </p>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              endIcon={!isSubmitting ? <Send size={16} /> : undefined}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "12px",
                px: 3,
                py: 1.25,
                minWidth: "120px",
                background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                boxShadow: "none",
                "&:hover": {
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  boxShadow: "0 4px 12px rgba(59,130,246,0.35)",
                },
                "&.Mui-disabled": { background: "#cbd5e1", color: "white" },
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={18} sx={{ color: "white" }} />
              ) : (
                "Send"
              )}
            </Button>
          </Box>

          {apiErrors && (
            <Box sx={{ mb: 2 }}>
              <ErrorAlert errors={apiErrors} onClose={() => setApiErrors(null)} />
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2.5,
              mb: 2.5,
            }}
          >
            <Box sx={{ flex: 1 }}>
              {fieldLabel("Full Name", true)}
              <TextField
                fullWidth
                size="small"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                error={!!errors.fullName}
                helperText={errors.fullName}
                sx={inputSx}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              {fieldLabel("Email Address", true)}
              <TextField
                fullWidth
                size="small"
                name="emailId"
                placeholder="john@company.com"
                value={formData.emailId}
                onChange={handleChange}
                error={!!errors.emailId}
                helperText={errors.emailId}
                sx={inputSx}
              />
            </Box>
          </Box>

          <Box>
            {fieldLabel("Your Inquiry", true)}
            <TextField
              fullWidth
              size="small"
              name="inquiry"
              multiline
              rows={7}
              placeholder="Tell us about your practice, challenges, or how we can help you..."
              value={formData.inquiry}
              onChange={handleChange}
              error={!!errors.inquiry}
              helperText={errors.inquiry}
              sx={inputSx}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
