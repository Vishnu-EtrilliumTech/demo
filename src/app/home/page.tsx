"use client";
import CustomCard from "@/components/Card";
import FAQAccordion from "@/components/Accordian";
import Image from "next/image";
import { Box } from "@mui/material";
import styles from "./page.module.css";
import Carousel from "@/components/Carousel";
export default function HomePage() {
  return (
    <>
      <section className={`${styles.hero} py-[1.5rem] w-full relative`}>
        <Box className="flex flex-col text-center lg:text-start items-center lg:items-end lg:flex-row justify-between  relative overflow-hidden px-[1.25rem] md:px-[5rem]">
          <Box
            sx={{ alignSelf: "start" }}
            className="items-center lg:items-start xl:w-full flex flex-col py-10"
          >
            <h1 className="text-[32px] sm:text-[42px] lg:text-[48px] font-bold">
              Streamline Your Legal Practice Management
            </h1>
            <p className="text-[16px] text-[#626262] leading-[1.6] mt-[1.5rem] max-w-full xl:max-w-[590px] 2xl:max-w-full">
              Comprehensive legal practice management platform designed to help law firms
              manage their day-to-day operations efficiently. Track cases, manage hearings,
              handle documents, and streamline client communications all in one place.
            </p>
          </Box>
          <Box
            sx={{ display: {  lg: "block" } }}
            className="lg:w-[900px] xl:w-[1050px] h-auto"
          >
            <Image
              src="/hero Image.svg"
              alt="Hero Image"
              width={650}
              height={665}
              priority
            />
          </Box>
        </Box>
        <Box>
          <Carousel />
        </Box>
      </section>
      <section className="w-full ">
        <Box sx={{ textAlign: "center", paddingTop: "80px" }}>
          <h2 className="text-[32px] md:text-[52px] font-medium">
            Why Lawsome
          </h2>
          <p className="text-[16px] md:text-[18px] leading-[1.6] max-w-[500px] mx-auto px-4">
            Here&apos;s what makes our platform the ideal solution for
            managing your law firm&apos;s daily operations efficiently.
          </p>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: { xs: 3, md: 4 },
            justifyContent: "center",
            py: { xs: 4, md: 5 },
            px: { xs: 4, md: 6 },
            maxWidth: "1440px",
            margin: "40px auto",
          }}
        >
          <Box>
            <CustomCard
              imageUrl="/card1 img.svg"
              text="Comprehensive case management across multiple practice areas"
              backgroundImage="/card1 bg.svg"
            />
          </Box>
          <Box>
            <CustomCard
              imageUrl="/card2 img.svg"
              text="Real-time collaboration with team members and clients"
              backgroundImage="/card2 bg.svg"
            />
          </Box>
          <Box>
            <CustomCard
              imageUrl="/card3 img.svg"
              text="Centralized document storage and management for all cases"
              backgroundImage="/card3 bg.svg"
            />
          </Box>
          <Box>
            <CustomCard
              imageUrl="/card4 img.svg"
              text="Automated hearing reminders and deadline tracking"
              backgroundImage="/card2 bg.svg"
            />
          </Box>
        </Box>
      </section>
      <section
        className={`w-full px-5 md:p-10 relative overflow-hidden ${styles.question}`}
      >
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <h2 className="text-[32px] md:text-[52px] max-w-[510px] mx-auto font-medium">
            Have a Question? We&apos;re Here to Help!
          </h2>
        </Box>
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: { lg: 30, xl: 40 },
            zIndex: 10,
          }}
          className=" hidden xl:flex xl:justify-start"
        >
          <Image
            src="/Character.svg"
            alt="Character"
            width={300}
            height={300}
            className="w-auto lg:w-[220px] xl:w-[250px] 2xl:w-[340px] h-auto"
          />
        </Box>
        <Box>
          <FAQAccordion />
        </Box>
      </section>
    </>
  );
}
