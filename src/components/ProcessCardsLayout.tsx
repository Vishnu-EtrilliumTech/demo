"use client";
import { Box } from "@mui/material";
import ProcessCards from "./ProcessCards";
import { useEffect, useState } from "react";

export default function ProcessCardsLayout() {
  const [width, setWidth] = useState(0); 
  useEffect(() => {
    const updateDimensions = () => {
      setWidth(window.innerWidth);
    };

    
    updateDimensions();

    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        },
        gap: { xs: 3 },
        justifyContent: "center",
        px: { xs: 4, md: 6 },
        maxWidth: "1440px",
        margin: "auto",
      }}
    >
      <Box>
        <ProcessCards
          image={width > 600 ? "/search line.svg" : "/search.svg"}
          title="Search the type of expert you need"
          description="Filter based on City, Experience, Ratings etc"
          style={{}}
        />
      </Box>
      <Box>
        <ProcessCards
          image={width > 1199 ? "/calendar line.svg" : "/calendar.svg"}
          title="Check the expert's availability"
          description="View the expert's calendar to view the available slot"
          style={{}}
        />
      </Box>
      <Box>
        <ProcessCards
          image={width > 600 ? "/payments line.svg" : "/payments.svg"}
          title="Book the appointment"
          description="Make necessary fees payment."
          style={{}}
        />
      </Box>
      <Box>
        <ProcessCards
          image="/login.svg"
          title="Login to your account"
          description="If you don't have an account, create one"
          style={{ 
            position: 'relative', 
            left: width >= 1200 ? '-72px' : '0'
          }}
        />
      </Box>
    </Box>
  );
}
