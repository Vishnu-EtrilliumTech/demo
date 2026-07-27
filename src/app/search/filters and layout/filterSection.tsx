/* eslint-disable */
"use client";
import ListIcon from "@mui/icons-material/List";
import LawyerCard from "@/components/ProfileListCard";
import ProfileCard from "@/components/ProfileCard";
import { Box, IconButton, MenuItem, Select, Skeleton } from "@mui/material";
import { useEffect, useState } from "react";
import WidgetsIcon from "@mui/icons-material/Widgets";
import { useRouter } from "next/navigation";

import { clearProfileData } from "@/app/redux/searchProfile/profileSlice";
import { useAppDispatch } from "@/app/redux/store/hook";

interface SearchResult {
  id: number;
  fullName: string;
  address: string;
  expertType: string;
  portfolios: string[];
  gender: string;
  photoBinary: string;
  customerRating: number;
  yearsOfExperience: number;
  consultationFeesRs: number;
  availableOnline: boolean;
  availableInPerson: boolean;
  meetingDurationMins: number;
}

interface FilterSectionProps {
  searchResult: SearchResult[];
  isLoading: boolean;
  onProfileNavigate: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  searchResult,
  isLoading,
  onProfileNavigate,
}) => {
  const [view, setView] = useState<"card" | "list">("card");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [experienceFilter, setExperienceFilter] = useState<string>("select");
  const [selectedConsultationType, setSelectedConsultationType] = useState("select");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    dispatch(clearProfileData());
  }, [dispatch]);

  const getFilteredResults = () => {
    return searchResult.filter((profile) => {

      const experience = profile.yearsOfExperience;
      let matchesExperience = true;
  
      if (experienceFilter !== "select") {
        const [min, max] = experienceFilter === "below-5"
          ? [0, 4]
          : experienceFilter === "above-25"
          ? [26, Infinity]
          : experienceFilter.split("-").map(Number);
  
        matchesExperience = experience >= min && experience <= max;
      }
  

      let matchesConsultation = true;
    if (selectedConsultationType === "in-person") {
      matchesConsultation = profile.availableInPerson === true;
    } else if (selectedConsultationType === "video-consultation") {
      matchesConsultation = profile.availableOnline === true;
    }
  
      return matchesExperience && matchesConsultation;
    }).sort((a, b) => a.yearsOfExperience - b.yearsOfExperience); 
  };
  const filteredResults = getFilteredResults();
  return (
    <section>
      <Box className="px-4 sm:px-4 py-5">
        {searchResult.length > 1 && (
          <Box className="flex flex-col lg:flex-row sm:items-center gap-4 pb-4 justify-around">
            <Box className="flex flex-wrap lg:flex-nowrap gap-4">
              <h4 className="text-[16px] sm:text-[18px] lg:text-[24px] text-[#626262] font-normal whitespace-nowrap">
                Filter your experts:
              </h4>
              <Select
                defaultValue="select"
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: "10px",
                      borderRadius: "16px",
                      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                      backgroundColor: "#ffff",
                      color: "#626262",
                    },
                  },
                }}
                sx={{
                  borderRadius: "50px",
                  color: "#626262",
                  minWidth: "200px",
                }}
              >
                <MenuItem sx={{ display: "none" }} value="select">
                  Experience
                </MenuItem>
                <MenuItem value="below-5">Below 5 yrs</MenuItem>
                <MenuItem value="5-10">5 - 10 yrs</MenuItem>
                <MenuItem value="10-15">10 - 15 yrs</MenuItem>
                <MenuItem value="15-20">15 - 20 yrs</MenuItem>
                <MenuItem value="20-25">20 - 25 yrs</MenuItem>
                <MenuItem value="above-25">Above 25 yrs</MenuItem>
              </Select>
              <Select
                defaultValue="select"
                variant="outlined"
                size="small"
                fullWidth
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: "10px",
                      borderRadius: "16px",
                      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                      backgroundColor: "#ffff",
                      color: "#626262",
                    },
                  },
                }}
                sx={{
                  borderRadius: "50px",
                  color: "#626262",
                  minWidth: "200px",
                }}
              >
                <MenuItem sx={{ display: "none" }} value="select">
                  Ratings
                </MenuItem>
                <MenuItem value="5-star">5 Star</MenuItem>
                <MenuItem value="4-star">4 Star</MenuItem>
                <MenuItem value="3-star">3 Star</MenuItem>
                <MenuItem value="2-star">2 Star</MenuItem>
                <MenuItem value="1-star">1 Star</MenuItem>
              </Select>
              <Select
                defaultValue="select"
                value={selectedConsultationType}
                onChange={(e) => setSelectedConsultationType(e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: "10px",
                      borderRadius: "16px",
                      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
                      backgroundColor: "#ffff",
                      color: "#626262",
                    },
                  },
                }}
                sx={{
                  borderRadius: "50px",
                  color: "#626262",
                  minWidth: "200px",
                }}
              >
                <MenuItem sx={{ display: "none" }} value="select">
                  Consultation Type
                </MenuItem>
                <MenuItem value="in-person">In Person</MenuItem>
                <MenuItem value="video-consultation">
                  Video Consultation
                </MenuItem>
              </Select>
            </Box>
            <Box className="flex gap-4 justify-end">
              <IconButton onClick={() => setView("card")}>
                <WidgetsIcon
                  sx={{
                    width: 40,
                    height: 40,
                    color: view === "card" ? "#003995" : "inherit",
                  }}
                />
              </IconButton>
              <IconButton onClick={() => setView("list")}>
                <ListIcon
                  sx={{
                    width: 40,
                    height: 40,
                    color: view === "list" ? "#003995" : "inherit",
                  }}
                />
              </IconButton>
            </Box>
          </Box>
        )}
<Box
  className={`${
    view === "list" ? "mx-24" : "mx-5"
  }`}
>
  <Box 
    className={`grid justify-center ${
      view === "card" ? "grid-cols-[repeat(auto-fill,minmax(250px,1fr))] max-w-[1200px] mx-auto" : ""
    } gap-8`}
  >
          {isLoading
            ?  ( Array.from(new Array(3)).map((_, index) =>
                view === "card" ? (
                  <Skeleton
                    key={index}
                    variant="rectangular"
                    width={250}
                    height={300}
                    animation="wave"
                  />
                ) : (
                  <Box
                    key={index}
                    className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-md"
                  >
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={80}
                      animation="wave"
                    />

                    <Box className="flex-1">
                      <Skeleton
                        variant="text"
                        width="40%"
                        height={24}
                        animation="wave"
                      />
                      <Skeleton
                        variant="text"
                        width="60%"
                        height={20}
                        animation="wave"
                      />
                      <Skeleton
                        variant="text"
                        width="30%"
                        height={20}
                        animation="wave"
                      />
                    </Box>
                  </Box>
                )
              )
            ) : filteredResults.length === 0 ? (
              <Box className="text-center w-full text-gray-500 text-lg mt-10">
                No profiles available for the selected experience range.
              </Box>
            ) : view === "card" ? (
             getFilteredResults().map((profile) => {
                const transformedProfile = {
                  id: profile.id,
                  name: profile.fullName,
                  role: profile.expertType,
                  experience: `${profile.yearsOfExperience} `,
                  location: profile.address,
                  rating: profile.customerRating,
                  reviews: `${profile.customerRating} reviews`,
                  fees: `Rs ${profile.consultationFeesRs}`,
                  image: `data:image/jpeg;base64,${profile.photoBinary}`,
                  portfolios: profile.portfolios,
                };

                return (
                  
                  <ProfileCard
                    key={profile.id}
                    {...transformedProfile}
                    // onProfileNavigate={() => {
                    //   onProfileNavigate();
                    //   if(transformedProfile){
                    //     router.push(
                    //       `/view-profile?id=${transformedProfile.id}&fromSearch=true`
                    //     );
                    //   }
                    // }}
                  />

                );
              })
            ) : ( getFilteredResults().map((profile) => {
                const transformedProfile = {
                  id: profile.id,
                  name: profile.fullName,
                  role: profile.expertType,
                  rating: profile.customerRating,
                  reviews: `${profile.customerRating} reviews`,
                  experience: `${profile.yearsOfExperience} `,
                  location: profile.address,
                  fees: `Rs ${profile.consultationFeesRs}`,
                  image: `data:image/jpeg;base64,${profile.photoBinary}`,
                  portfolios: profile.portfolios,
                };

                return (
                  <Box key={profile.id} className="w-full">
                    <LawyerCard key={profile.id}
                    {...transformedProfile}
                    // onProfileNavigate={() => {
                    //   onProfileNavigate();
                    //   if(transformedProfile){
                    //     router.push(
                    //       `/view-profile?id=${transformedProfile.id}&fromSearch=true`
                    //     );
                    //   }
                    // }} 
                    />
                  </Box>
                );
              })
            )}
        </Box>
        </Box>
      </Box>
    </section>
  );
};

export default FilterSection;
