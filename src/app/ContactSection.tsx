"use client";

import React, { useState } from "react";
import { Box } from "@mui/material";
import { Mail, Phone, Send, MessagesSquare, CalendarClock, TriangleAlert } from "lucide-react";
import { Button, Field, Input, Textarea } from "@/design-system";
import { useToast } from "@/contexts/ToastContext";
import { useFormValidation } from "@/hooks/useFormValidation";
import { maxLength, minLength, pattern, required } from "@/utils/validation";
import { extractApiErrors, extractFieldErrors } from "@/utils/errorHandler";
import { submitContactInquiry } from "@/services/contactServices";

const SUPPORT_EMAIL = "lawsomesupport@etrilliumtech.com";
const SUPPORT_PHONE = "+91 7356754343";
const linkSx = { color: "var(--brand)", fontWeight: 600 };

// The shared email() rule is Gmail-only, which would reject work addresses.
// A contact form must accept any valid email, so we use a standard pattern here.
const anyEmail = pattern(
  "Email",
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  "Invalid email address format."
);

/**
 * Landing "Contact" section (#contact). Posts { fullName, emailId, inquiry } to
 * /api/v1/contact, which emails the Lawsome support inbox.
 */
export default function ContactSection() {
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({ fullName: "", emailId: "", inquiry: "" });
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
    <section className="lp-blk" id="contact" style={{ position: "relative", overflow: "hidden" }}>
      <div className="lp-hero-bg">
        <div className="grid" />
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
      </div>
      <div className="lp-wrap" style={{ position: "relative", zIndex: 1 }}>
        <div className="lp-blk-head">
          <div className="eyebrow"><MessagesSquare aria-hidden /> Let&apos;s connect</div>
          <h2>Get in touch with Lawsome</h2>
          <p>
            Have a question about managing your legal practice with Lawsome? Email us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} style={linkSx}>{SUPPORT_EMAIL}</a> or fill out the
            form below for a free 30-minute consultation with no commitment required.
          </p>
        </div>

        <div className="lp-split" style={{ alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="lp-feat">
              <div className="fi"><Mail aria-hidden /></div>
              <h3>Email Us</h3>
              <p><a href={`mailto:${SUPPORT_EMAIL}`} style={linkSx}>{SUPPORT_EMAIL}</a></p>
              <p>We reply within 24 hours</p>
            </div>

            <div className="lp-feat">
              <div className="fi"><Phone aria-hidden /></div>
              <h3>Call Us</h3>
              <p><a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} style={linkSx}>{SUPPORT_PHONE}</a></p>
              <p>Mon–Fri, 10am – 7pm IST</p>
            </div>

            <div className="lp-feat">
              <div className="fi"><CalendarClock aria-hidden /></div>
              <h3>Free Consultation</h3>
              <p>
                Book a 30-minute session with our team to walk through how Lawsome fits your
                firm&apos;s day-to-day operations — no commitment required.
              </p>
            </div>
          </div>

          <Box component="form" className="card card-pad" onSubmit={handleSubmit} noValidate>
            <div className="sec-head">
              <h3><span className="ic"><Send aria-hidden /></span> Send a Message</h3>
              <Button type="submit" variant="primary" iconRight={Send} loading={isSubmitting}>
                {isSubmitting ? "Sending" : "Send"}
              </Button>
            </div>

            {apiErrors?.length ? (
              <div className="alert danger" role="alert">
                <span className="ic"><TriangleAlert aria-hidden /></span>
                <div className="m">
                  {apiErrors.map((msg) => (
                    <div key={msg}>{msg}</div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="form-2col">
              <Field
                label="Full Name"
                required
                htmlFor="fullName"
                error={!!errors.fullName}
                hint={errors.fullName || undefined}
              >
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  aria-invalid={!!errors.fullName}
                />
              </Field>

              <Field
                label="Email Address"
                required
                htmlFor="emailId"
                error={!!errors.emailId}
                hint={errors.emailId || undefined}
              >
                <Input
                  id="emailId"
                  name="emailId"
                  type="email"
                  placeholder="john@company.com"
                  value={formData.emailId}
                  onChange={handleChange}
                  aria-invalid={!!errors.emailId}
                />
              </Field>

              <Field
                label="Your Inquiry"
                required
                full
                htmlFor="inquiry"
                error={!!errors.inquiry}
                hint={errors.inquiry || undefined}
              >
                <Textarea
                  id="inquiry"
                  name="inquiry"
                  rows={8}
                  placeholder="Tell us about your practice, challenges, or how we can help you..."
                  value={formData.inquiry}
                  onChange={handleChange}
                  aria-invalid={!!errors.inquiry}
                />
              </Field>
            </div>
          </Box>
        </div>
      </div>
    </section>
  );
}
