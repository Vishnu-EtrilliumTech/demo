/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Box,
  CircularProgress,
  Typography,
  TextField,
  Select,
  FormControl,
  MenuItem,
  Alert,
  Button,
  Grid,
  Tooltip,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import React, { Suspense, useEffect, useState } from "react";
import styles from "./page.module.css";
import apiClient from "@/services/httpServices";
import { checkOrgKeyAvailability } from "@/app/organization/services/api";
import { storeToken } from "@/services/authServices";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { useRouter, useSearchParams } from "next/navigation";
import { useFeatureFlag } from "@/design-system";
import { NewOrgRegister } from "./NewOrgRegister";
import { useRef } from "react";
import { ValidationPatterns, ValidationMessages } from "@/utils/validation";

interface RegisterPayload {
  fullName: string;
  emailId: string;
  countryCode?: number | null;
  phoneNumber?: number | null;
  expertTypeId?: number | null;
  gender?: string;
  organizationName?: string;
  organizationDescription?: string;
  organizationEmail?: string;
  organizationPhone?: string;
  segments?: string[];
}

interface ExpertType {
  id: number;
  expertType: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  gender?: string;
  phoneNumber?: string;
  legalExpertId?: string;
  expertType?: string;
  organizationName?: string;
  organizationEmail?: string;
  organizationPhone?: string;
  organizationDescription?: string;
  segments?: string;
  organizationKey?: string;
}

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

const disabledInputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontSize: "0.875rem",
    bgcolor: "#f1f5f9",
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

const MultiSelectDropdown = ({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  error,
}: {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  error?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleOption = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  const handleKeyDown = (e: React.KeyboardEvent, option?: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (option) {
        toggleOption(option);
      } else {
        setIsOpen(!isOpen);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Tab" && isOpen) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="multiselect-options"
        tabIndex={0}
        className={`flex items-center justify-between w-full px-3 py-[7px] border cursor-pointer outline-none transition-all focus:ring-2 focus:border-transparent ${
          error
            ? "border-red-500 bg-red-50 focus:ring-red-500"
            : "border-gray-300 hover:border-blue-400"
        }`}
        style={{
          borderRadius: "8px",
          fontSize: "0.875rem",
          backgroundColor: error ? undefined : "#fff",
        }}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <div className="flex-1 flex flex-wrap items-center gap-1 overflow-hidden min-h-[24px]">
          {selected.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            selected.map((item) => (
              <span
                key={item}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap"
              >
                {item}
              </span>
            ))
          )}
        </div>
        <div
          className={`transition-all duration-200 ${
            isOpen ? "rotate-180 text-blue-600" : "text-gray-400"
          }`}
        >
          <ExpandMoreIcon fontSize="small" />
        </div>
      </div>

      {isOpen && (
        <div
          id="multiselect-options"
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto text-sm outline-none"
          tabIndex={-1}
        >
          {options.map((option) => (
            <div
              key={option}
              role="option"
              aria-selected={selected.includes(option)}
              tabIndex={0}
              className={`p-1 hover:bg-gray-100 cursor-pointer focus:bg-blue-100 outline-none ${
                selected.includes(option) ? "bg-blue-50" : ""
              }`}
              onClick={() => toggleOption(option)}
              onKeyDown={(e) => handleKeyDown(e, option)}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  readOnly
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="ml-2">{option}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const initialFormData = {
  phoneNumber: "",
  legalExpertId: "",
  fullName: "",
  email: "",
  gender: "",
  organizationName: "",
  organizationDescription: "",
  organizationEmail: "",
  organizationPhone: "",
  segments: [] as string[],
  organizationKey: "",
};

const RegisterPage = () => {
  const [] = useState(false);

  const [formData, setFormData] =
    useState<typeof initialFormData>(initialFormData);
  const [selectedExpert, setSelectedExpert] = useState<number | null>(null);
  const [expertTypes, setExpertTypes] = useState<ExpertType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [orgKeyStatus, setOrgKeyStatus] = useState<
    "idle" | "checking" | "available" | "unavailable"
  >("idle");
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState("");
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState<
    string | null
  >(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("pending_google_credential");
  });
  const searchParams = useSearchParams();

  useEffect(() => {
    const key = formData.organizationKey?.trim();
    if (!key) {
      setOrgKeyStatus("idle");
      return;
    }
    setOrgKeyStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const isAvailable = await checkOrgKeyAvailability(key);
        setOrgKeyStatus(isAvailable ? "available" : "unavailable");
      } catch {
        setOrgKeyStatus("idle");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.organizationKey]);

  const validateOrgStep = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!formData.organizationName?.trim()) {
      newErrors.organizationName = "Organization name is required";
      isValid = false;
    }

    if (!formData.organizationEmail?.trim()) {
      newErrors.organizationEmail = "Organization email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.organizationEmail)) {
      newErrors.organizationEmail = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.organizationPhone) {
      newErrors.organizationPhone = "Organization phone is required";
      isValid = false;
    } else if (
      formData.organizationPhone.replace(/[\s\-\+\(\)]/g, "").length < 10
    ) {
      newErrors.organizationPhone = "Please enter a valid phone number";
      isValid = false;
    }

    if (!formData.segments?.length) {
      newErrors.segments = "At least one segment must be selected";
      isValid = false;
    }

    if (!formData.organizationDescription?.trim()) {
      newErrors.organizationDescription =
        "Organization description is required";
      isValid = false;
    }

    if (!formData.organizationKey?.trim()) {
      newErrors.organizationKey = "Organization key is required";
      isValid = false;
    } else if (formData.organizationKey.trim().length > 5) {
      newErrors.organizationKey =
        "Organization key cannot exceed 5 characters.";
      isValid = false;
    } else if (orgKeyStatus === "unavailable") {
      newErrors.organizationKey = "This organization key is already taken";
      isValid = false;
    } else if (orgKeyStatus === "checking") {
      newErrors.organizationKey = "Please wait while we check key availability";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
      isValid = false;
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
      isValid = false;
    } else if (!/^[a-zA-Z\s-']+$/.test(formData.fullName)) {
      newErrors.fullName =
        "Full name can only contain letters, spaces, hyphens, and apostrophes";
      isValid = false;
    }

    if (role !== "organizationuser") {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
        isValid = false;
      } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(formData.email)) {
        newErrors.email = "Only Gmail addresses (@gmail.com) are accepted.";
        isValid = false;
      }
    }

    if (role === "client") {
      if (!formData.gender) {
        newErrors.gender = "Gender is required";
        isValid = false;
      }

      if (!formData.phoneNumber) {
        newErrors.phoneNumber = "Phone number is required";
        isValid = false;
      } else if (
        !ValidationPatterns.phone.test(
          formData.phoneNumber.replace(/[\s\-\+\(\)]/g, ""),
        )
      ) {
        newErrors.phoneNumber = ValidationMessages.phone;
        isValid = false;
      }
    }

    if (role === "legalexpert") {
      if (!formData.phoneNumber) {
        newErrors.phoneNumber = "Phone number is required";
        isValid = false;
      } else if (
        !ValidationPatterns.phone.test(
          formData.phoneNumber.replace(/[\s\-\+\(\)]/g, ""),
        )
      ) {
        newErrors.phoneNumber = ValidationMessages.phone;
        isValid = false;
      }

      if (!selectedExpert) {
        newErrors.expertType = "Expert type is required";
        isValid = false;
      }
    }

    if (role === "organizationuser") {
      if (!formData.organizationName?.trim()) {
        newErrors.organizationName = "Organization name is required";
        isValid = false;
      }

      if (!formData.organizationEmail?.trim()) {
        newErrors.organizationEmail = "Organization email is required";
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.organizationEmail)) {
        newErrors.organizationEmail = "Please enter a valid email address";
        isValid = false;
      }

      if (!formData.organizationPhone) {
        newErrors.organizationPhone = "Organization phone is required";
        isValid = false;
      } else if (
        !ValidationPatterns.phone.test(
          formData.organizationPhone.replace(/[\s\-\+\(\)]/g, ""),
        )
      ) {
        newErrors.organizationPhone = ValidationMessages.phone;
        isValid = false;
      }

      if (!formData.segments?.length) {
        newErrors.segments = "At least one segment must be selected";
        isValid = false;
      }

      if (!formData.organizationDescription?.trim()) {
        newErrors.organizationDescription =
          "Organization description is required";
        isValid = false;
      }

      if (!formData.gender) {
        newErrors.gender = "Gender is required";
        isValid = false;
      }

      if (!formData.phoneNumber) {
        newErrors.phoneNumber = "Phone number is required";
        isValid = false;
      } else if (
        !ValidationPatterns.phone.test(
          formData.phoneNumber.replace(/[\s\-\+\(\)]/g, ""),
        )
      ) {
        newErrors.phoneNumber = ValidationMessages.phone;
        isValid = false;
      }

      if (!formData.organizationKey?.trim()) {
        newErrors.organizationKey = "Organization key is required";
        isValid = false;
      } else if (formData.organizationKey.trim().length > 5) {
        newErrors.organizationKey =
          "Organization key cannot exceed 5 characters.";
        isValid = false;
      } else if (orgKeyStatus === "unavailable") {
        newErrors.organizationKey = "This organization key is already taken";
        isValid = false;
      } else if (orgKeyStatus === "checking") {
        newErrors.organizationKey =
          "Please wait while we check key availability";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const fetchExpertTypes = async () => {
    try {
      const response = await apiClient.get("/api/v1/legalexperts/types");
      setExpertTypes(response.data.data);
    } catch (error) {
      console.error("Error fetching expert types:", error);
    }
  };

  useEffect(() => {
    setRole(searchParams.get("role"));
    setGoogleEmail(searchParams.get("email") || "");
    setStep(1);
  }, [searchParams]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (
      inputRef.current &&
      (role === "client" ||
        role === "legalexpert" ||
        role === "organizationuser")
    ) {
      inputRef.current.focus();
    }
  }, [role]);

  useEffect(() => {
    fetchExpertTypes();
  }, [role]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, type } = e.target;

    if (
      (name === "phoneNumber" || name === "organizationPhone") &&
      type !== "select-multiple"
    ) {
      const value = (e.target as HTMLInputElement).value;
      // Allow digits, spaces, hyphens, plus, and parentheses for international formats
      if (!/^[\d\s\-\+\(\)]*$/.test(value)) return;
      if (value.length > 20) return;
    }

    const value = (e.target as HTMLInputElement).value;
    setFormData((prev) => ({
      ...prev,
      [name]: value || "",
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleContinue = () => {
    if (validateOrgStep()) {
      setErrors({});
      setStep(2);
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep(1);
  };

  const handleRegistration = async (googleIdToken: string) => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const genderForApi =
        formData.gender === "non-binary"
          ? "Transgender"
          : formData.gender.charAt(0).toUpperCase() + formData.gender.slice(1);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register-organization`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.organizationName.trim(),
            description: formData.organizationDescription?.trim(),
            segments: formData.segments,
            phoneNumber: parseInt(
              formData.organizationPhone.replace(/[\s\-\+\(\)]/g, ""),
              10,
            ),
            emailId: formData.organizationEmail.trim(),
            organizationKey: formData.organizationKey.trim(),
            administratorName: formData.fullName.trim(),
            administratorPhoneNumber: parseInt(
              formData.phoneNumber.replace(/[\s\-\+\(\)]/g, ""),
              10,
            ),
            administratorGender: genderForApi,
            googleIdToken: googleIdToken,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log("[register] response data keys:", Object.keys(data));
        console.log("[register] data.data:", data.data);
        const token = data?.data?.token || data?.token;
        if (!token) {
          setError(
            "Registration succeeded but no token returned. Contact support.",
          );
          return;
        }
        sessionStorage.removeItem("pending_google_credential");
        setPendingGoogleCredential(null);
        storeToken(token);
        window.location.href = "/auth?role=organizationuser";
      } else {
        const err = await response.json();
        setError(err.errors?.[0] || "Organization registration failed");
      }
    } catch (error: any) {
      console.error("Error submitting org registration:", error);
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (role === "organizationuser") return; // handled via GoogleLogin button

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (role === "client") {
        // Transform "non-binary" to "Transgender" for API
        const genderForApi =
          formData.gender === "non-binary"
            ? "Transgender"
            : formData.gender.charAt(0).toUpperCase() +
              formData.gender.slice(1);

        const payload: RegisterPayload = {
          fullName: formData.fullName.trim(),
          emailId: formData.email.trim(),
          phoneNumber: formData.phoneNumber
            ? parseInt(formData.phoneNumber)
            : null,
          gender: genderForApi,
        };

        const response = await apiClient.post(
          "/api/v1/clients/register",
          payload,
          {
            validateStatus: (status) => status === 201 || status === 404,
          },
        );

        if (response.status === 201) {
          handleRegistrationSuccess(response);
        } else {
          setError(response.data.errors?.[0] || "Registration failed");
        }
      } else if (role === "legalexpert") {
        await apiClient.post(
          `/api/v1/verifications/phonenumber/${formData.phoneNumber}`,
          {},
          {
            headers: {
              AAT: "true",
            },
          },
        );
        router.push(
          `/register/otp?phoneNumber=${formData.phoneNumber}&expertTypeId=${selectedExpert}&fullName=${formData.fullName}&email=${formData.email}`,
        );
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setError(
        error.response?.data?.errors?.[0] ||
          "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSuccess = (response: any) => {
    localStorage.setItem("userName", formData.fullName);
    localStorage.setItem("userRole", role || "");
    const info = {
      data: {
        fullName: formData.fullName,
        id: response.data.data.id,
      },
    };
    localStorage.setItem("userData", JSON.stringify(info));
    router.push("/success");
  };

  const isAdminFormFilled = Boolean(
    formData.fullName?.trim() &&
    formData.phoneNumber?.trim() &&
    formData.gender,
  );

  return (
    <Box
      className={`${styles.formBg} flex-1 py-4 px-4`}
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div className="flex justify-center items-center">
        <Box
          component="form"
          onSubmit={handleSubmit}
          className="bg-white p-8 w-full max-w-[900px] mx-auto my-4"
          style={{
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
            position: "relative",
          }}
        >
          {role === "client" && (
            <>
              <Typography
                sx={{ fontWeight: 700, fontSize: "1.125rem", color: "#1e293b" }}
              >
                Register Yourself
              </Typography>
              <Typography
                sx={{ fontSize: "0.8rem", color: "#64748b", mt: 0.25, mb: 3 }}
              >
                Enter Your Details
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    {fieldLabel("Full Name", true)}
                    <TextField
                      fullWidth
                      size="small"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      error={!!errors.fullName}
                      helperText={errors.fullName}
                      placeholder="Enter full name"
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {fieldLabel("Email (Gmail)", true)}
                    <TextField
                      fullWidth
                      size="small"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      placeholder="Enter email address"
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {fieldLabel("Gender", true)}
                    <FormControl fullWidth size="small" error={!!errors.gender}>
                      <Select
                        name="gender"
                        value={formData.gender}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            gender: e.target.value as string,
                          }));
                          if (errors.gender)
                            setErrors((prev) => ({
                              ...prev,
                              gender: undefined,
                            }));
                        }}
                        displayEmpty
                        sx={{
                          borderRadius: "8px",
                          fontSize: "0.875rem",
                          bgcolor: "#fff",
                        }}
                      >
                        <MenuItem value="" disabled>
                          Select Gender
                        </MenuItem>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="non-binary">Non-Binary</MenuItem>
                      </Select>
                      {errors.gender && (
                        <Typography
                          sx={{
                            color: "#ef4444",
                            fontSize: "0.75rem",
                            mt: 0.5,
                            ml: 1.75,
                          }}
                        >
                          {errors.gender}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {fieldLabel("Phone Number", true)}
                    <TextField
                      fullWidth
                      size="small"
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      error={!!errors.phoneNumber}
                      helperText={errors.phoneNumber}
                      placeholder="Enter phone number"
                      sx={inputSx}
                    />
                  </Grid>
                </Grid>
              </Box>
            </>
          )}

          {role === "legalexpert" && (
            <>
              <Typography
                sx={{ fontWeight: 700, fontSize: "1.125rem", color: "#1e293b" }}
              >
                Register Yourself
              </Typography>
              <Typography
                sx={{ fontSize: "0.8rem", color: "#64748b", mt: 0.25, mb: 3 }}
              >
                Enter Your Details
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    {fieldLabel("Full Name", true)}
                    <TextField
                      fullWidth
                      size="small"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      error={!!errors.fullName}
                      helperText={errors.fullName}
                      placeholder="Enter full name"
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {fieldLabel("Email (Gmail)", true)}
                    <TextField
                      fullWidth
                      size="small"
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      sx={disabledInputSx}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {fieldLabel("Phone Number", true)}
                    <TextField
                      fullWidth
                      size="small"
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      error={!!errors.phoneNumber}
                      helperText={errors.phoneNumber}
                      placeholder="Enter phone number"
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {fieldLabel("Expert Type", true)}
                    <FormControl
                      fullWidth
                      size="small"
                      error={!!errors.expertType}
                    >
                      <Select
                        value={selectedExpert ? String(selectedExpert) : ""}
                        onChange={(e) => {
                          setSelectedExpert(Number(e.target.value));
                          if (errors.expertType)
                            setErrors((prev) => ({
                              ...prev,
                              expertType: undefined,
                            }));
                        }}
                        displayEmpty
                        sx={{
                          borderRadius: "8px",
                          fontSize: "0.875rem",
                          bgcolor: "#fff",
                        }}
                      >
                        <MenuItem value="" disabled>
                          Select expert type
                        </MenuItem>
                        {expertTypes.map((expert) => (
                          <MenuItem key={expert.id} value={String(expert.id)}>
                            {expert.expertType}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.expertType && (
                        <Typography
                          sx={{
                            color: "#ef4444",
                            fontSize: "0.75rem",
                            mt: 0.5,
                            ml: 1.75,
                          }}
                        >
                          {errors.expertType}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}

          {role === "organizationuser" && (
            <div className="organizationForm">
              {/* Header */}
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "1.125rem",
                  color: "#1e293b",
                  textAlign: "center",
                }}
              >
                Register Your Organization
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  color: "#64748b",
                  mt: 0.25,
                  mb: 3,
                  textAlign: "center",
                }}
              >
                {step === 1
                  ? "Enter your organization details"
                  : "Enter administrator details"}
              </Typography>

              {/* Step Indicator */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "center",
                  mb: 4,
                }}
              >
                {/* Step 1 */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      bgcolor: step >= 1 ? "#3b82f6" : "#e2e8f0",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      transition: "background-color 0.2s",
                    }}
                  >
                    {step > 1 ? (
                      <CheckCircleOutlinedIcon sx={{ fontSize: "1.1rem" }} />
                    ) : (
                      "1"
                    )}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      color: step >= 1 ? "#3b82f6" : "#94a3b8",
                      mt: 0.75,
                      fontWeight: step === 1 ? 600 : 500,
                    }}
                  >
                    Organization
                  </Typography>
                </Box>

                {/* Connector */}
                <Box
                  sx={{
                    width: 80,
                    height: 2,
                    bgcolor: step > 1 ? "#3b82f6" : "#e2e8f0",
                    mx: 2,
                    mt: "18px",
                    transition: "background-color 0.2s",
                  }}
                />

                {/* Step 2 */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      bgcolor: step >= 2 ? "#3b82f6" : "#e2e8f0",
                      color: step >= 2 ? "white" : "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      transition: "background-color 0.2s",
                    }}
                  >
                    2
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      color: step >= 2 ? "#3b82f6" : "#94a3b8",
                      mt: 0.75,
                      fontWeight: step === 2 ? 600 : 500,
                    }}
                  >
                    Administrator
                  </Typography>
                </Box>
              </Box>

              {/* Step 1: Organization Details */}
              {step === 1 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      {fieldLabel("Organization Name", true)}
                      <TextField
                        fullWidth
                        size="small"
                        name="organizationName"
                        value={formData.organizationName}
                        onChange={handleChange}
                        error={!!errors.organizationName}
                        helperText={errors.organizationName}
                        placeholder="Enter organization name"
                        sx={inputSx}
                        inputRef={inputRef}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      {fieldLabel("Email", true)}
                      {fieldLabel("Email", true)}
                      <TextField
                        fullWidth
                        size="small"
                        type="email"
                        name="organizationEmail"
                        value={formData.organizationEmail}
                        onChange={handleChange}
                        error={!!errors.organizationEmail}
                        helperText={errors.organizationEmail}
                        placeholder="Enter email address"
                        sx={inputSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      {fieldLabel("Organization Phone", true)}
                      <TextField
                        fullWidth
                        size="small"
                        type="tel"
                        name="organizationPhone"
                        value={formData.organizationPhone}
                        onChange={handleChange}
                        error={!!errors.organizationPhone}
                        helperText={errors.organizationPhone}
                        placeholder="Enter phone number"
                        sx={inputSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mb: 0.5,
                        }}
                      >
                        <Typography
                          component="label"
                          sx={{
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: "#374151",
                          }}
                        >
                          Organization Key
                          <span style={{ color: "#ef4444", marginLeft: 2 }}>
                            *
                          </span>
                        </Typography>
                        <Tooltip
                          title="This key is used to number cases within this organization (e.g., ORG-SITE-001). It cannot be changed after the organization is created."
                          placement="right"
                          arrow
                        >
                          <IconButton
                            size="small"
                            sx={{ p: 0.25, color: "#64748b" }}
                          >
                            <InfoOutlinedIcon sx={{ fontSize: "1rem" }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        name="organizationKey"
                        value={formData.organizationKey}
                        onChange={handleChange}
                        error={
                          !!errors.organizationKey ||
                          orgKeyStatus === "unavailable"
                        }
                        helperText={
                          errors.organizationKey ||
                          (orgKeyStatus === "unavailable"
                            ? "This organization key is already taken"
                            : undefined) ||
                          (orgKeyStatus === "available"
                            ? "Organization key cannot be changed once set."
                            : undefined)
                        }
                        placeholder="Enter organization key (Max 5 characters)"
                        sx={inputSx}
                        inputProps={{ maxLength: 5 }}
                        slotProps={{
                          input: {
                            endAdornment:
                              orgKeyStatus === "checking" ? (
                                <CircularProgress
                                  size={16}
                                  sx={{ color: "#94a3b8", mr: 0.5 }}
                                />
                              ) : orgKeyStatus === "available" ? (
                                <CheckCircleOutlinedIcon
                                  sx={{
                                    fontSize: "1.1rem",
                                    color: "#16a34a",
                                    mr: 0.5,
                                  }}
                                />
                              ) : null,
                          },
                          formHelperText: {
                            sx:
                              orgKeyStatus === "available" &&
                              !errors.organizationKey
                                ? { color: "#b45309" }
                                : undefined,
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      {fieldLabel("Segments", true)}
                      <MultiSelectDropdown
                        options={["Legal", "Insurance"]}
                        selected={formData.segments || []}
                        onChange={(selected) => {
                          setFormData((prev) => ({
                            ...prev,
                            segments: selected,
                          }));
                          if (errors.segments) {
                            setErrors((prev) => ({
                              ...prev,
                              segments: undefined,
                            }));
                          }
                        }}
                        placeholder="Select segments..."
                        error={errors.segments}
                      />
                      {errors.segments && (
                        <Typography
                          sx={{
                            color: "#ef4444",
                            fontSize: "0.75rem",
                            mt: 0.5,
                            ml: 0.5,
                          }}
                        >
                          {errors.segments}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      {fieldLabel("Organization Description", true)}
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={3}
                        name="organizationDescription"
                        value={formData.organizationDescription}
                        onChange={handleChange}
                        error={!!errors.organizationDescription}
                        helperText={errors.organizationDescription}
                        placeholder="Describe your organization, services, and goals..."
                        sx={inputSx}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Step 2: Administrator Details */}
              {step === 2 && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      {fieldLabel("Full Name", true)}
                      <TextField
                        fullWidth
                        size="small"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        error={!!errors.fullName}
                        helperText={errors.fullName}
                        placeholder="Enter full name"
                        sx={inputSx}
                        autoFocus
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      {fieldLabel("Phone Number", true)}
                      <TextField
                        fullWidth
                        size="small"
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        error={!!errors.phoneNumber}
                        helperText={errors.phoneNumber}
                        placeholder="Enter phone number"
                        sx={inputSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      {fieldLabel("Gender", true)}
                      <FormControl
                        fullWidth
                        size="small"
                        error={!!errors.gender}
                      >
                        <Select
                          name="gender"
                          value={formData.gender}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              gender: e.target.value as string,
                            }));
                            if (errors.gender)
                              setErrors((prev) => ({
                                ...prev,
                                gender: undefined,
                              }));
                          }}
                          displayEmpty
                          sx={{
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                            bgcolor: "#fff",
                          }}
                        >
                          <MenuItem value="" disabled>
                            Select Gender
                          </MenuItem>
                          <MenuItem value="male">Male</MenuItem>
                          <MenuItem value="female">Female</MenuItem>
                          <MenuItem value="non-binary">Non-Binary</MenuItem>
                        </Select>
                        {errors.gender && (
                          <Typography
                            sx={{
                              color: "#ef4444",
                              fontSize: "0.75rem",
                              mt: 0.5,
                              ml: 1.75,
                            }}
                          >
                            {errors.gender}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    {googleEmail && (
                      <Grid item xs={12} sm={6}>
                        {fieldLabel("Email (Gmail)", false)}
                        <TextField
                          fullWidth
                          size="small"
                          value={googleEmail}
                          InputProps={{ readOnly: true }}
                          sx={{
                            ...inputSx,
                            "& .MuiInputBase-input": {
                              bgcolor: "#f5f5f5",
                              cursor: "default",
                            },
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </div>
          )}

          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ mb: 2, borderRadius: "8px" }}
            >
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
              mt: 3,
            }}
          >
            {role === "organizationuser" ? (
              step === 1 ? (
                <Button
                  variant="contained"
                  onClick={handleContinue}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    borderRadius: "12px",
                    px: 4,
                    py: 1.25,
                    minWidth: "160px",
                    background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                    boxShadow: "none",
                    "&:hover": {
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      boxShadow: "0 4px 12px rgba(59,130,246,0.35)",
                    },
                  }}
                >
                  Continue
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    startIcon={<ArrowBackIcon />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: "12px",
                      px: 3,
                      py: 1.25,
                      borderColor: "#cbd5e1",
                      color: "#475569",
                      "&:hover": {
                        borderColor: "#94a3b8",
                        bgcolor: "#f8fafc",
                      },
                    }}
                  >
                    Back
                  </Button>
                  <Box sx={{ position: "relative" }}>
                    <Box sx={{ opacity: isAdminFormFilled ? 1 : 0.5 }}>
                      <GoogleAuthButton
                        onSuccess={(credentialResponse) => {
                          handleRegistration(credentialResponse.credential!);
                        }}
                        onError={() =>
                          alert("Google Sign-In failed. Please try again.")
                        }
                        disabled={!isAdminFormFilled}
                        text="Submit"
                        width={120}
                        loginHint={googleEmail}
                        onDirectClick={
                          pendingGoogleCredential
                            ? () => {
                                sessionStorage.removeItem(
                                  "pending_google_credential",
                                );
                                setPendingGoogleCredential(null);
                                handleRegistration(pendingGoogleCredential);
                              }
                            : undefined
                        }
                      />
                    </Box>
                    {!isAdminFormFilled && (
                      <Box
                        onClick={validateForm}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          cursor: "not-allowed",
                        }}
                      />
                    )}
                  </Box>
                </>
              )
            ) : (
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "12px",
                  px: 4,
                  py: 1.25,
                  minWidth: "160px",
                  background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                  boxShadow: "none",
                  "&:hover": {
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    boxShadow: "0 4px 12px rgba(59,130,246,0.35)",
                  },
                  "&.Mui-disabled": { background: "#cbd5e1", color: "white" },
                }}
              >
                {loading ? (
                  <CircularProgress size={18} sx={{ color: "white" }} />
                ) : (
                  "Register"
                )}
              </Button>
            )}
          </Box>
        </Box>
      </div>
    </Box>
  );
};

// Gate: the reframed Google-only org registration (flag on + org role) vs the
// legacy multi-role register page. Flag off → legacy unchanged.
const RegisterGate = () => {
  const enabled = useFeatureFlag("register");
  const params = useSearchParams();
  const role = params.get("role");
  if (enabled && (role === "organizationuser" || !role)) {
    return <NewOrgRegister />;
  }
  return <RegisterPage />;
};

const RegisterPageWrapper = () => (
  <Suspense
    fallback={
      <Box className="h-[100vh] flex justify-center items-center">
        <CircularProgress />
      </Box>
    }
  >
    <RegisterGate />
  </Suspense>
);

export default RegisterPageWrapper;
