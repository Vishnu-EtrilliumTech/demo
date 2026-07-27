/* eslint-disable */
"use client";
import { Box, Button, CircularProgress, TextField } from "@mui/material";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import apiClient from "@/services/httpServices";
import { initAuth } from "@/services/authServices";

interface OTPVerificationData {
  phoneNumber: string;
  expertTypeId: string;
  fullName: string;
  email: string;
}

export default function Page() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(4).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationData, setVerificationData] =
    useState<OTPVerificationData | null>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    initAuth().then((authenticated) => {
      if (authenticated) {
        console.log("Auth initialized and user is authenticated");
        setAuthenticated(true);
      } else {
        console.log("User is not authenticated");
      }
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data: OTPVerificationData = {
      phoneNumber: params.get("phoneNumber") || "",
      expertTypeId: params.get("expertTypeId") || "",
      fullName: params.get("fullName") || "",
      email: params.get("email") || "",
    };

    if (
      !data.phoneNumber ||
      !data.expertTypeId ||
      !data.fullName ||
      !data.email
    ) {
      setError("Missing required parameters");
      return;
    }

    setVerificationData(data);
    setMobileNumber(data.phoneNumber.slice(-3));
  }, [authenticated]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!verificationData) {
      setError("Verification data not found");
      setLoading(false);
      return;
    }

    const otpCode = otp.join("");
    if (otpCode.length !== 4) {
      setError("Please enter a 4-digit OTP");
      setLoading(false);
      return;
    }

    try {
      const verifyResponse = await apiClient.post(
        `/api/v1/verifications/phonenumber/${verificationData.phoneNumber}/code/${otpCode}`,
        {},
        {
          headers: {
            AAT: "true",
          },
        }
      );
      console.log("data", verifyResponse);

      if (verifyResponse.status === 200) {
        const payload = {
          fullName: verificationData.fullName,
          emailId: verificationData.email,
          phoneNumber: parseInt(verificationData.phoneNumber),
          expertTypeId: parseInt(verificationData.expertTypeId),
        };

        const registerResponse = await apiClient.post(
          "/api/v1/legalexperts/register",
          payload
        );

        if (registerResponse.status === 201) {
          localStorage.setItem("userName", verificationData.fullName);
          localStorage.setItem("userRole", "legalexpert");
          localStorage.setItem(
            "userData",
            JSON.stringify({
              data: {
                fullName: verificationData.fullName,
                id: registerResponse.data.data.id,
              },
            })
          );
          router.push("/success");
        }
      }
    } catch (error: any) {
      console.error("Error during verification/registration:", error);
      setError(
        error.response?.data?.errors?.[0] ||
          "Verification failed. Please check the OTP and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!verificationData) {
    return (
      <Box
        className={`${styles.formBg} h-[100vh] flex justify-center items-center text-center`}
      >
        <div className="bg-white p-6 shadow-md rounded-[40px] w-[774px]">
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <CircularProgress />
          )}
        </div>
      </Box>
    );
  }

  return (
    <Box
      className={`${styles.formBg} h-[100vh] flex justify-center items-center text-center`}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        className="bg-white p-6 shadow-md rounded-[40px] w-[774px]"
      >
        <p className="text-[16px] font-bold pt-5">
          Please enter a 4 digit OTP sent to your Mobile Number XXXXXXX
          {mobileNumber}
        </p>

        <div className={styles.inputRow}>
          {Array(4)
            .fill(null)
            .map((_, i) => (
              <TextField
                key={i}
                id={`otp-input-${i}`}
                variant="standard"
                type="text"
                inputMode="numeric"
                slotProps={{
                  input: { disableUnderline: true },
                  htmlInput: {
                    className: styles.inputText,
                    pattern: "[0-9]*",
                    maxLength: 1,
                  },
                }}
                value={otp[i]}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
        </div>

        {error && <p className="text-red-500 mt-2">{error}</p>}

        <Button
          type="submit"
          className="rounded-full"
          sx={{ mt: 2, width: "123px", backgroundColor: "#EA4234", color: "#fff", p: 1, "&:hover": { backgroundColor: "#EA4234" } }}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} style={{ color: "white" }} />
          ) : (
            "CONTINUE"
          )}
        </Button>
      </Box>
    </Box>
  );
}
