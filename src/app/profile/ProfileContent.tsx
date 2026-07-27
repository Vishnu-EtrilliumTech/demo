/* eslint-disable */

"use client";
import { Box, Button } from "@mui/material";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getAuthClient, initAuth } from "@/services/authServices";
import apiClient from "@/services/httpServices";



interface ProfileContentProps {
  userData: UserData | null;
}

interface LegalExpertAddress {
  id: string;
  addressName: string;
  fullAddress: string;
}

interface UserData {
  id: string;
  fullName: string;
  expertTypeId?: any;
  phoneNumber?: string;
  legalExpertPersonalDetails?: {
    aboutMe?: string;
    photoBinary?: string;
  };
  legalExpertProfessionalDetails?: {
    registrationNumber?: string;
    yearsOfExperience?: string;
    portfolios?: string[];
  };
  legalExpertSchedule?: {
    feesPerSession?: string;
    scheduleJson?: string;
    availableOnline?: boolean;
    rawScheduleResponse?: {
      scheduleJson?: string;
    };
  };
  emailId?: string;
  legalExpertAddresses?: LegalExpertAddress[];
}

interface ExpertType {
  id: string;
  expertType: string;
}
const ProfileImage = ({ photoBinary }: { photoBinary?: string }) => {
  if (photoBinary?.startsWith("data:image/jpeg;base64")) {
    return (
      <Image
        src={`${photoBinary}`}
        alt="Profile Image"
        width={393}
        height={489}
        className="rounded-lg lg:w-[476px] h-[354px]"
        priority
      />
    );
  } else {
    return (
      <Image
        src={`data:image/jpeg;base64,${photoBinary}`}
        alt="Profile Image"
        width={393}
        height={489}
        className="rounded-lg lg:w-[476px] h-[354px]"
        priority
      />
    );
  }
};

export default function ProfileContent({ userData }: ProfileContentProps) {
  const path=usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expertTypes, setExpertTypes] = useState<ExpertType[]>([]);
  const [authenticated, setAuthenticated] = useState(false);

  const text =
    userData?.legalExpertPersonalDetails?.aboutMe ||
    "No description available.";

  const schedule =
    userData?.legalExpertSchedule?.scheduleJson ??
    userData?.legalExpertSchedule?.rawScheduleResponse?.scheduleJson ??
    "{}";
  const parsed = JSON.parse(schedule);
  console.log("Parsed Schedule JSON:", parsed);
  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const normalizeSchedule = (day: string) => {
    const dayData = parsed[day];
    if (!dayData || !dayData.Availability) return "";

    const allSlots = dayData.Availability.flatMap(
      (entry: any) => entry.AvailableSlots
    );
    const sorted = [...allSlots].sort((a, b) => {
      const parseTime = (timeStr: string) =>
        new Date(`1970-01-01T${convertTo24Hour(timeStr)}:00`);

      const convertTo24Hour = (time: string) => {
        const [hourMin, modifier] = time.split(" ");
        let [hours, minutes] = hourMin.split(":").map(Number);

        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;

        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}`;
      };

      return parseTime(a).getTime() - parseTime(b).getTime();
    });

    const paired = [];
    for (let i = 0; i < sorted.length; i += 2) {
      if (sorted[i + 1]) {
        paired.push(`${sorted[i]} - ${sorted[i + 1]}`);
      }
    }

    return paired.join(" | ");
  };

  const grouped: Record<string, string[]> = {};

  for (const day of dayOrder) {
    const timeKey = normalizeSchedule(day);
    if (!timeKey) continue;

    if (!grouped[timeKey]) grouped[timeKey] = [];
    grouped[timeKey].push(day);
  }
  const formatDayRange = (days: string[]) => {
    const indices = days
      .map((day) => dayOrder.indexOf(day))
      .sort((a, b) => a - b);

    const isConsecutive = indices.every((val, i, arr) =>
      i === 0 ? true : val === arr[i - 1] + 1
    );

    const orderedDays = indices.map((i) =>
      dayOrder[i].slice(0, 3).toUpperCase()
    );

    if (isConsecutive && orderedDays.length > 1) {
      return `${orderedDays[0]} - ${orderedDays[orderedDays.length - 1]}`;
    }

    return orderedDays.join(", ");
  };

  useEffect(() => {
    initAuth().then((authenticated) => {
      setAuthenticated(authenticated);
    });
  }, []);

  useEffect(() => {
    const getExpertTypes = async () => {
      try {
        const response = apiClient.get("/api/v1/legalexperts/types");
        const data = (await response).data;
        setExpertTypes(data.data);
      } catch (error) {
        console.error(error);
      }
    };
    getExpertTypes();
  }, []);

  const getExpertTypeName = (expertTypeId: any): string => {
    if (typeof expertTypeId === "string") return expertTypeId;
    const expertType = expertTypes.find((type) => type.id === expertTypeId);
    return expertType ? expertType.expertType : "Unknown";
  };

  const handleLogin = async (role: string) => {
    try {
      const redirectUri = `${
        window.location.origin
      }/auth?role=${role}&redirect=${encodeURIComponent(
        `/appointments?id=${userData?.id}`
      )}`;
      const authClient = getAuthClient();
      await authClient.login({ redirectUri, prompt: "login" });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const toggleReadMore = () => setIsExpanded(!isExpanded);
  const isFromSearch = path.includes("/view-profile");


  return (
    <>
      <section className={`${styles.profile} py-6 px-4 md:px-20`}>
        <Box className="mx-auto mb-10 flex justify-between">
          <Box>
            <Link className="text-[16px] font-normal text-[#333333]" href="/">
              Home
            </Link>{" "}
            {isFromSearch && ( <Link
                className="text-[16px] font-normal text-[#333333]"
                href={{
                  pathname: "/search",
                  query: { preserveResults: true, scrollToResults: true },
                }}
              >
               &gt;{" "}Search Results 
              </Link>)}
              {" "} 
            &gt;{" "}
            <span className="text-[#003995] text-[16px] font-normal">
              {userData?.fullName}
            </span>
          </Box>
        </Box>
        <Box className="flex flex-col lg:flex-row items-center lg:items-start justify-center mt-3 gap-20">
          <Box className=" rounded-[16px] flex justify-center items-end flex-col   h-auto p-0 mb-4 lg:mb-0">
            <ProfileImage
              photoBinary={userData?.legalExpertPersonalDetails?.photoBinary}
            />

            <Box className="bg-[#DDEAFF] rounded-[16px] p-4 mt-6 w-full  items-center lg:items-start">
              {Object.keys(grouped).length === 0 ? (
                <p className="text-black font-medium text-center">
                  No timeslot data available
                </p>
              ) : (
                Object.entries(grouped).map(([time, days]) => (
                  <Box
                    className="flex justify-between items-center mb-3"
                    key={time}
                  >
                    <p className="font-semibold text-black">
                      {" "}
                      {formatDayRange(days)}
                    </p>
                    <Box className="text-right">
                      {time.split(" | ").map((range, idx) => (
                        <p className="font-medium text-black" key={idx}>
                          {range}
                        </p>
                      ))}
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>

          <Box className="flex flex-col  lg:items-start gap-4 w-full max-w-xl">
            <Box className="flex flex-col items-center lg:items-start gap-4 w-full max-w-xl">
              <h1 className="text-[32px] lg:text-[40px] font-bold text-[#222222]">
                {userData?.fullName}
              </h1>
              <h4 className="text-[16px] lg:text-[18px] font-medium text-[#333333]">
                {getExpertTypeName(userData?.expertTypeId)}
              </h4>
            </Box>

            <Box className="flex flex-col  ">
              <p className="text-[16px] font-normal text-[#626262]">
                {userData?.legalExpertPersonalDetails?.aboutMe}
              </p>
              {/* Conditionally render the "Read More" button */}
              {text.length > 150 && (
                <Box>
                  <p className="text-[16px] font-normal text-[#626262]">
                    {isExpanded ? text : `${text.substring(0, 151)}...`}
                  </p>
                  <Button
                    onClick={toggleReadMore}
                    sx={{
                      mt: "3px",
                      color: "#003995",
                      fontWeight: "medium",
                    }}
                  >
                    {isExpanded ? "READ LESS" : "READ MORE"}
                  </Button>
                </Box>
              )}
            </Box>

            {/* <Box className="items-center lg:items-start flex flex-col ">
              <p className="text-[16px] font-normal text-[#333333]">
                Chartered Accountant (ICAI), 2010
              </p>
              <p className="text-[16px] font-normal text-[#333333]">
                Master&apos;s in Commerce, Delhi University, 2008
              </p>
            </Box> */}
            <div className="flex" style={{ width: "100%"}}>
              <div style={{ width: "60%"}}>
                <Box className="text-nowrap flex flex-col">
                  <h3 className="flex items-center text-[14px] text-[#666666] font-normal" style={{ marginBottom: "10px"}}>
                    Registration No.
                  </h3>
                </Box>
              </div>
              <div style={{ width: "40%"}}>
                <Box className="flex flex-col">
                  <h3 style={{ marginBottom: "10px"}}
                    className={`flex items-center text-gray-800 font-medium ${
                      authenticated ? "" : "filter blur-sm"
                    }`}
                  >
                    {authenticated
                      ? userData?.legalExpertProfessionalDetails
                          ?.registrationNumber
                      : "Login to View"}
                  </h3>
                </Box>
              </div>
            </div>
            <div className="flex" style={{ width: "100%"}}>
              <div style={{ width: "60%"}}>
                <Box className="text-nowrap flex flex-col">                
                  <h3 className="flex items-center text-[14px] text-[#666666] font-normal" style={{ marginBottom: "10px"}}>
                    Experience
                  </h3>
                </Box>
              </div>
              <div style={{ width: "40%"}}>
                <Box className="flex flex-col">                
                  <h3 className="flex items-center text-gray-800 font-medium" style={{ marginBottom: "10px"}}>
                    {authenticated
                      ? `${userData?.legalExpertProfessionalDetails?.yearsOfExperience} year of experience`
                      : userData?.legalExpertProfessionalDetails
                          ?.yearsOfExperience}
                  </h3>
                </Box>
              </div>
            </div>
            <div className="flex" style={{ width: "100%"}}>
              <div style={{ width: "60%"}}>
                <Box className="text-nowrap flex flex-col">
                  <h3 className="flex items-center text-[14px] text-[#666666] font-normal" style={{ marginBottom: "10px"}}>
                    Available for Online Consulting
                  </h3>
                </Box>
              </div>
              <div style={{ width: "40%"}}>
                <Box className="flex flex-col">
                  <h3 className="flex items-center text-gray-800 font-medium" style={{ marginBottom: "10px"}}>
                    {userData?.legalExpertSchedule?.availableOnline
                      ? "Yes"
                      : "No"}
                  </h3>
                </Box>
              </div>
            </div>
            <div className="flex" style={{ width: "100%"}}>
              <div style={{ width: "60%"}}>
                <Box className="text-nowrap flex flex-col">
                  <h3 className="flex items-center text-[14px] text-[#666666] font-normal" style={{ marginBottom: "10px"}}>
                    Speciality
                  </h3>
                </Box>
              </div>
              <div style={{ width: "40%"}}>
                <Box className="flex flex-col">               
                  <Box className="flex items-center" style={{ marginBottom: "10px"}}>
                    <Box className="max-w-[400px] gap-2 flex flex-wrap">
                      {userData?.legalExpertProfessionalDetails?.portfolios?.map(
                        (portfolio: string, index: number) => (
                          <p
                            key={index}
                            className="bg-[#E9F0F2] text-[#333333] font-medium text-[14px] px-3 py-1 rounded-full"
                          >
                            {portfolio}
                          </p>
                        )
                      )}
                    </Box>
                  </Box>
                </Box>
              </div>
            </div>
          </Box>
        </Box>
        <Box className="flex flex-col items-center justify-center text-center  relative pt-5">
          <Box className="w-full max-w-[1278px] mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-8 relative overflow-hidden">
            <Box className="absolute top-[-30px] left-[-30px] w-[85px] h-[90px] rounded-full bg-[#2FBD59] blur-[80px] opacity-[0.8] z-0"></Box>

            <Box className="absolute top-[-20px] right-[-20px] w-[80px] h-[120px] bg-[#003995] blur-[80px] opacity-[0.8] z-0"></Box>

            <Box className="relative z-10 flex flex-col lg:flex-row justify-between lg:space-x-8 space-y-8 lg:space-y-0">
              <Box className="text-left flex-1 pl-5">
                <Box className="flex items-start">
                  <Image
                    src="/money 1.svg"
                    alt="money"
                    width={24}
                    height={24}
                    priority
                  />
                  <Box className="ml-2">
                    <p className="text-[#666666] text-base font-normal">
                      Fee Range
                    </p>
                    <p className="text-[18px] font-bold text-[#333333]">
                      {`₹ ${userData?.legalExpertSchedule?.feesPerSession}`}
                    </p>
                    <p className="text-[16px] font-normal text-[#747474]">
                      *Depending On Service Type And Duration
                    </p>
                  </Box>
                </Box>
              </Box>

              <Box className="text-left flex-1 border-none lg:border-l pl-5">
                <Box className="flex items-start">
                  <Image
                    src="/phone.svg"
                    alt="phone"
                    width={24}
                    height={24}
                    priority
                  />
                  <Box className="ml-2">
                    <p className="text-[#666666] font-normal text-base">
                      Phone Number
                    </p>
                    <p
                      className={`text-[18px] font-bold text-[#333333] ${
                        authenticated ? "" : "filter blur-sm"
                      }`}
                    >
                      {authenticated ? userData?.phoneNumber : "Login to view"}
                    </p>
                  </Box>
                </Box>
              </Box>

              <Box className="text-left flex-1 border-none lg:border-l pl-5">
                <Box className="flex items-start">
                  <Image
                    src="/email.svg"
                    alt="email"
                    width={24}
                    height={24}
                    priority
                  />
                  <Box className="ml-2">
                    <p className="text-[#666666] font-normal text-base">
                      Email Address
                    </p>
                    <p
                      className={`text-[18px] font-bold text-[#333333] ${
                        authenticated ? "" : "filter blur-sm"
                      }`}
                    >
                      {authenticated ? userData?.emailId : "Login to view"}
                    </p>
                  </Box>
                </Box>
              </Box>

              <Box className="text-left flex-1 border-none lg:border-l pl-5">
                {authenticated ? (
                  userData?.legalExpertAddresses?.map(
                    (address: LegalExpertAddress) => (
                      <Box key={address.id} className="flex items-start mb-4">
                        <Image
                          src="/location.svg"
                          alt="location"
                          width={24}
                          height={24}
                          priority
                          className="mr-2"
                        />
                        <Box className="ml-2">
                          <p className="text-[#666666] font-normal text-base">
                            {address.addressName}
                          </p>
                          <p className="text-[18px] font-bold text-[#333333]">
                            {address.fullAddress}
                          </p>
                        </Box>
                      </Box>
                    )
                  ) ?? []
                ) : (
                  <Box className="flex items-start">
                    <Image
                      src="/location.svg"
                      alt="location"
                      width={24}
                      height={24}
                      priority
                      className="mr-2"
                    />
                    <Box className="ml-2">
                      <p className="text-[#666666] font-normal text-base">
                        Address
                      </p>
                      <p
                        className={`text-[18px] font-bold text-[#333333] ${
                          authenticated ? "" : "filter blur-sm"
                        }`}
                      >
                        Lorem ipsum dolor, sit amet consectetur adipisicing
                        elit.
                      </p>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </section>
      {/* <section className="py-20 px-4 md:px-20 items-center flex flex-col">
        <Box className="flex flex-col items-center mb-[20px]">
          <Box className="text-center">
            <h2 className="text-[24px] lg:text-[32px] font-medium max-w-[920px] text-[#000000]"></h2>
          </Box>
         
        </Box>

        
      </section> */}
      {/* <section className="bg-[#F5FBF7] py-20">
        <Box className="text-center">
          <h2 className="text-[32px] lg:text-[52px] font-medium text-[#333333]">
            Services offered
          </h2>
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
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                height: 293,
                minHeight: 297,
                borderRadius: "20px",
              }}
            >
              <CardMedia
                component="img"
                image="/card1 img.svg"
                alt="card image"
                sx={{
                  padding: { xs: 1.5, sm: 2 },
                  objectFit: "contain",
                  maxHeight: { xs: 120, sm: 140 },
                  width: "auto",
                  margin: "0 auto",
                }}
              />
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p className="text-base sm:text-lg md:text-xl font-medium text-center break-words m-0">
                  Income Tax Filing for Individuals and Corporates
                </p>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                height: 293,
                minHeight: 297,
                borderRadius: "20px",
              }}
            >
              <CardMedia
                component="img"
                image="/card2 img.svg"
                alt="card image"
                sx={{
                  padding: { xs: 1.5, sm: 2 },
                  objectFit: "contain",
                  maxHeight: { xs: 120, sm: 140 },
                  width: "auto",
                  margin: "0 auto",
                }}
              />
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p className="text-base sm:text-lg md:text-xl font-medium text-center break-words m-0">
                  GST Registration and Filing
                </p>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                height: 293,
                minHeight: 297,
                borderRadius: "20px",
              }}
            >
              <CardMedia
                component="img"
                image="/card3 img.svg"
                alt="card image"
                sx={{
                  padding: { xs: 1.5, sm: 2 },
                  objectFit: "contain",
                  maxHeight: { xs: 120, sm: 140 },
                  width: "auto",
                  margin: "0 auto",
                }}
              />
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p className="text-base sm:text-lg md:text-xl font-medium text-center break-words m-0">
                  Auditing Services
                </p>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card
              sx={{
                display: "flex",
                flexDirection: "column",
                height: 293,
                minHeight: 297,
                borderRadius: "20px",
              }}
            >
              <CardMedia
                component="img"
                image="/card4 img.svg"
                alt="card image"
                sx={{
                  padding: { xs: 1.5, sm: 2 },
                  objectFit: "contain",
                  maxHeight: { xs: 120, sm: 140 },
                  width: "auto",
                  margin: "0 auto",
                }}
              />
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p className="text-base sm:text-lg md:text-xl font-medium text-center break-words m-0">
                  Financial Planning and Advisory
                </p>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </section> */}
    </>
  );
}
