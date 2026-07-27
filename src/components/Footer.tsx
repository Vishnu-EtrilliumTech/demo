import React from "react";
import { Box } from "@mui/material";
import Image from "next/image";
// import VersionDisplay from "./VersionDisplay";

const Footer = () => {
  return (
    <Box
      sx={{
        backgroundColor: "#003995",
        backgroundImage: "url('/footerbg.svg')",
        backgroundSize: "100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        color: "white",
        padding: { xs: "20px 10px", md: "30px 10px" },
        width: "100%",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "center", md: "flex-start" },
          paddingX: { xs: 2, sm: 4, md: 10 },
          gap: { xs: 6, md: 4 },
          textAlign: { xs: "center", md: "left" },
        }}
      >
        {/* Left Section - Logo */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
          className="2xl:pl-[100px]"
        >
          <Box
            className={
              "flex justify-center [&:nth-child(1)]:min-[900px]:justify-start mt-3"
            }
          >
            <Image
              src="/footerLogo.png"
              alt="Lawsome Logo"
              width={189}
              height={28}
              style={{ marginBottom: "16px" }}
            />
          </Box>
        </Box>

        {/* Right Section - Contact Us */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            textAlign: { xs: "center", md: "right" },
          }}
          className="2xl:pr-[100px]"
        >
          <p className="text-[16px] text-white font-normal">Contact Us</p>
          <p className="text-[16px] text-[#C0D9FF] font-normal">lawsomesupport@etrilliumtech.com</p>
        </Box>

      </Box>
      
      {/* Version Display */}
      {/* <Box sx={{ 
        textAlign: 'center', 
        paddingTop: 2, 
        paddingX: { xs: 2, sm: 4, md: 10 }
      }}>
        <VersionDisplay className="text-[#C0D9FF]" />
      </Box> */}
    </Box>
  );
};

export default Footer;
