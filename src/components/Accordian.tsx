"use client";

import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

const accordionStyle = {
  margin: 0,
  paddingY: { xs: 1, md: 2 },
  backgroundColor: "#F5FBF7",
  "&.Mui-expanded": {
    backgroundColor: "#E0F5E7",
    margin: 0,
  },
  width: "100%",
  textAlign: "left",
  boxShadow: "none",
  "&::before": {
    display: "none",
  },
  borderBottom: "1px solid #E5E7EB",
};

const accordionSummaryStyle = {
  ".MuiAccordionSummary-content": {
    margin: 0,
    padding: 0,
    alignItems: "center",
  },
  "& .MuiTypography-root": {
    lineHeight: { xs: "1.4", md: "1.6" },
    textAlign: "left",
  },
};

const accordionDetailsStyle = {
  "& .MuiTypography-root": {
    textAlign: "left",
    padding: 0,
  },
};

const FAQAccordion = () => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };

  const renderExpandIcon = (isExpanded: boolean) =>
    isExpanded ? <RemoveIcon /> : <AddIcon />;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: { xs: "95%", sm: "90%", md:900 },
        margin: "0 auto",
        px: { xs: 1, sm: 2, md: 3 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingBottom: "20px"
      }}
    >
      <Accordion
        sx={accordionStyle}
        expanded={expanded === "panel1"}
        onChange={handleChange("panel1")}
      >
        <AccordionSummary
          expandIcon={renderExpandIcon(expanded === "panel1")}
          aria-controls="panel1-content"
          id="panel1-header"
          sx={accordionSummaryStyle}
        >
          <p className="text-[12px] sm:text[14px] md:text-[16px] font-medium">
            1. What is Lawsome and how can it help my law firm?
          </p>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsStyle}>
          <p className="pl-2 md:pl-4 text-[10px] sm:text[12px]  md:text-[14px] text-gray-800 font-normal">
            Lawsome is a comprehensive legal practice management platform designed to streamline your law firm&apos;s daily operations. It helps you manage cases, track hearings, store documents, and collaborate with team members and clients all in one centralized system.
          </p>
        </AccordionDetails>
      </Accordion>

      <Accordion
        sx={accordionStyle}
        expanded={expanded === "panel2"}
        onChange={handleChange("panel2")}
      >
        <AccordionSummary
          expandIcon={renderExpandIcon(expanded === "panel2")}
          aria-controls="panel2-content"
          id="panel2-header"
          sx={accordionSummaryStyle}
        >
          <p className="text-[12px] sm:text[14px] md:text-[16px] font-medium">
            2. Can I manage multiple sites or offices within one organization?
          </p>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsStyle}>
          <p className="pl-2 md:pl-4 text-[10px] sm:text[12px] md:text-[14px] text-gray-800 font-normal">
            Yes, Lawsome supports multi-site management. You can create and manage multiple office locations under one organization, with each site having its own cases, users, and documents.
          </p>
        </AccordionDetails>
      </Accordion>

      {[
        "3. How does the case management system work?",
        "4. Can multiple team members collaborate on the same case?",
        "5. How secure is my client data and documents?",
        "6. Is training provided to get started with the platform?",
      ].map((question, index) => {
        const panelId = `panel${index + 3}`;
        return (
          <Accordion
            key={panelId}
            sx={accordionStyle}
            expanded={expanded === panelId}
            onChange={handleChange(panelId)}
          >
            <AccordionSummary
              expandIcon={renderExpandIcon(expanded === panelId)}
              aria-controls={`${panelId}-content`}
              id={`${panelId}-header`}
              sx={accordionSummaryStyle}
            >
              <p className="text-[12px] sm:text[14px] md:text-[16px] font-medium">
                {question}
              </p>
            </AccordionSummary>
            <AccordionDetails sx={accordionDetailsStyle}>
              <p className="pl-2 md:pl-4 text-[10px] sm:text[12px] md:text-[14px] text-gray-800 font-normal">
                {index === 0 && "Create cases with detailed information including case type, filing number, and client details. Track tasks, schedule hearings, attach documents, and monitor progress through every stage of the case lifecycle."}
                {index === 1 && "Absolutely. You can assign multiple team members to a case, share documents, add comments, and track who made what changes. Real-time updates keep everyone informed."}
                {index === 2 && "We take security seriously. All data is encrypted, and access is controlled through role-based permissions. Only authorized users in your organization can access sensitive information."}
                {index === 3 && "Yes, we provide comprehensive onboarding support and training materials to help your team get up to speed quickly with the platform."}
              </p>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default FAQAccordion;
