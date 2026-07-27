'use client'
import Image from "next/image";
import styles from "./page.module.css";
import { Box } from "@mui/material";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchOrganizationByUserEmail } from "@/app/organization/services/api";
import { getUserInfo } from "@/services/authServices";

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    const userRole = localStorage.getItem("userRole"); 

    const timer = setTimeout(async () => {
      if (userRole === "legalexpert") {
        router.push("/dashboard")
      } else if (userRole === "client") {
        router.push('/')
      } else if (userRole === "organizationuser") {
        try {
          const userDetail = await getUserInfo();
          if (userDetail?.email) {
            const orgData = await fetchOrganizationByUserEmail(userDetail.email);
            if (orgData?.id) {
              router.push(`/organization/${orgData.id}`);
              return;
            }
          }
        } catch (error) {
          console.error("Error fetching organization data:", error);
        }
        router.push('/');
      } else {
        router.push('/');
      }
    }, 2000); 

    return () => clearTimeout(timer);
  }, [router]);
  return (
    <Box
      className={`h-[100vh] ${styles.successBg} flex justify-center items-center text-center`}
    >
      <Box className="bg-white p-10 shadow-md rounded-[40px] w-[774px] h-[457px]">
        <Box className="flex justify-center">
          <Image src={"/success.svg"} width={180} height={180} alt="success" />
        </Box>
        <h1 className="text-[32px] text-[#26203b] font-medium pt-9">
          Account created successfully!
        </h1>
        <p className="text-[24px] text-[#9c9aa5] font-normal  ">
          Welcome aboard! Start your journey with Lawsome!
        </p>
      </Box>
    </Box>
  );
}
