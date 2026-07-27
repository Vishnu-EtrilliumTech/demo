'use client'
import Image from "next/image";
import styles from "./page.module.css";
import { Box } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isEdit = searchParams.get("from") === "profile"; 
    const step = searchParams.get("step");

    const stepToMessageMap: { [key: string]: string } = {
      "professional-details": "Professional details updated successfully!",
      "personal-details": "Personal details updated successfully!",
      "address-location": "Address location details updated successfully!",
      "meeting-details": "Meeting details updated successfully!",
    };

    const successMessage = isEdit
    ? stepToMessageMap[step || ""] || "Profile updated successfully!"
    : "Profile created successfully!";


    useEffect(() => {
      const timer = setTimeout(() => {
        if (!isEdit) {
          router.push("/home");
        } else if (!step) {
          router.push("/profile");
        } else {
 
          // router.push(`/complete-profile?step=${step}&isEditable=true&from=profile`); // Removed broken link
        }
      }, 2000);
    
      return () => clearTimeout(timer);
    }, [router, isEdit, step]);
  return (
    <Box
      className={`h-[100vh] ${styles.successBg} flex justify-center items-center text-center`}
    >
      <Box className="bg-white p-10 shadow-md rounded-[40px] w-[774px]">
        <Box className="flex justify-center">
          <Image src={"/success.svg"} width={180} height={180} alt="success" />
        </Box>
        <h1 className="text-[32px] text-[#26203b] font-medium pt-9">
           {successMessage}
        </h1>
        <p className="text-[24px] text-[#9c9aa5] font-normal  ">
        We will notify you after we review your profile!
        </p>
      </Box>
      <Box>
          <Image  src={"/questionIcon.svg"}  width={32}  height={32} alt="question icon" className="fixed bottom-[55px] right-[67px]" />
      </Box>
    </Box>
  );
}
