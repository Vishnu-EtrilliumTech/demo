"use client";

import { Box } from "@mui/material";
import Link from "next/link";

export default function PricingPage() {
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
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              backgroundColor: "#EA4234",
              color: "white",
              padding: "16px 40px",
              borderRadius: "50px",
              fontSize: { xs: "20px", md: "24px" },
              fontWeight: "bold",
              letterSpacing: "2px",
              boxShadow: "0 4px 12px rgba(234, 66, 52, 0.3)",
            }}
          >
            COMING SOON
          </Box>
        </Box>

        <h1 className="text-[32px] md:text-[48px] font-bold mb-4">
          Pricing Coming Soon
        </h1>

        <p className="text-[16px] md:text-[18px] text-[#626262] leading-[1.6] mb-6">
          We&apos;re working on bringing you flexible pricing options tailored to your law firm&apos;s needs.
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
            Interested in learning more?
          </p>
          <p className="text-[14px] md:text-[16px] text-[#626262] mb-3">
            Reach out to us for more information about our pricing plans and how Lawsome can benefit your organization.
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
