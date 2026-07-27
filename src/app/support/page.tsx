"use client";

import { Box } from "@mui/material";
import Link from "next/link";

export default function SupportPage() {
  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: { xs: 4, md: 8 },
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          maxWidth: "600px",
          width: "100%",
        }}
      >
        <h1 className="text-[32px] md:text-[48px] font-bold mb-4">
          Support
        </h1>

        <p className="text-[16px] md:text-[18px] text-[#626262] leading-[1.6] mb-6">
          We&apos;re here to help you get the most out of Lawsome. Our support team is ready to assist you with any questions or issues you may have.
        </p>

        <Box
          sx={{
            backgroundColor: "#F5F5F5",
            padding: { xs: 3, md: 4 },
            borderRadius: "12px",
            mt: 4,
          }}
        >
          <p className="text-[16px] md:text-[18px] text-[#333333] font-medium mb-2">
            Need Help?
          </p>
          <p className="text-[14px] md:text-[16px] text-[#626262] mb-3">
            Contact our support team for assistance with any questions, technical issues, or feature requests.
          </p>
          <Link
            href="mailto:lawsomesupport@etrilliumtech.com"
            className="text-[16px] md:text-[18px] text-[#1D4ED8] font-semibold hover:underline"
          >
            lawsomesupport@etrilliumtech.com
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
