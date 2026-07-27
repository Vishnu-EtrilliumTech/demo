"use client";

import React from "react";
import { Box, Button } from "@mui/material";
import { CredentialResponse } from "@react-oauth/google";

interface GoogleAuthButtonProps {
  onSuccess: (credentialResponse: CredentialResponse) => void;
  onError?: () => void;
  disabled?: boolean;
  text?: string;
  loginHint?: string;
  onDirectClick?: () => void;
  width?: number;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.71-1.57 2.69-3.88 2.69-6.64z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.47-.81 5.96-2.16l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A8.997 8.997 0 0 0 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A8.997 8.997 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A8.997 8.997 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
    />
  </svg>
);

/**
 * PROTOTYPE: offline Google button. No real OAuth iframe — clicking fires
 * `onDirectClick` if provided, otherwise resolves `onSuccess` with the mock JWT
 * so the sign-in flow proceeds without any Google servers.
 */
const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  disabled,
  text = "Login / Sign up with Google",
  onDirectClick,
  width = 220,
}) => {
  const handleClick = () => {
    if (onDirectClick) { onDirectClick(); return; }
    const credential = (globalThis as { __MOCK_JWT__?: string }).__MOCK_JWT__ ?? "mock-google-credential";
    onSuccess({ credential } as CredentialResponse);
  };
  return (
    <Box sx={{ position: "relative", display: "inline-block", width, height: 40 }}>
      <Button
        variant="outlined"
        disabled={disabled}
        onClick={handleClick}
        startIcon={text === "Login / Sign up with Google" ? <GoogleIcon /> : undefined}
        sx={{
          width: "100%",
          height: "100%",
          textTransform: "none",
          fontWeight: "regular",
          fontSize: "0.8rem",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          borderRadius: "24px",
          borderColor: "#1D4ED8",
          backgroundColor: text === "Submit" ? "#1D4ED8" : "white",
          color: text === "Submit" ? "white" : "black",
          "&.Mui-disabled": {
            backgroundColor: text === "Submit" ? "#93C5FD" : "#F3F4F6",
            borderColor: text === "Submit" ? "#93C5FD" : "#D1D5DB",
            color: text === "Submit" ? "white" : "#9CA3AF",
          },
          "&:hover": { borderColor: "#1D4ED8" },
        }}
      >
        {text}
      </Button>
    </Box>
  );
};

export default GoogleAuthButton;
