import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  // Button, // TODO: preserve for future action button usage
  Box,
  Rating,
} from "@mui/material";

import { getAuthClient, initAuth } from "@/services/authServices";
// import { useRouter } from "next/navigation"; // TODO: re-enable when card navigation is restored
// import { setProfileData } from "@/app/redux/searchProfile/profileSlice"; // TODO: preserve profile data dispatcher for future navigation
// import { useAppDispatch } from "@/app/redux/store/hook"; // TODO: preserve redux hook for future session-driven navigation

interface CardProps {
  id: number;
  name: string;
  role: string;
  experience: string;
  location: string;
  rating: number;
  reviews: string;
  fees: string;
  image: string;
  portfolios: Array<string>;
  // onProfileNavigate?: () => void; // TODO: preserve navigation callback prop for future profile click handling
}

const ProfileCard: React.FC<CardProps> = ({
  id,
  name,
  role,
  experience,
  location,
  rating,
  reviews,
  fees,
  image,
  portfolios,
  // onProfileNavigate,
}) => {
  // const router = useRouter(); // TODO: re-enable if card-level navigation needs restoration
  // const dispatch = useAppDispatch(); // TODO: preserve redux dispatch for future profile navigation
  // const [authenticated, setAutenticated] = useState(false); // TODO: keep auth state if card rendering becomes auth-aware
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // TODO: preserve login helper for future profile navigation/auth flow
  // const handleLogin = async (role: string) => {
  //   try {
  //     if (!id) {
  //       console.error("No user ID available");
  //       return;
  //     }
  //     const redirectUri = `${window.location.origin}/auth?role=${encodeURIComponent(role)}&redirect=${encodeURIComponent(`/appointments?id=${id}`)}`;
  //     const authClient = getAuthClient();
  //     await authClient.login({
  //       redirectUri,
  //       prompt: "login",
  //     });
  //   } catch (error) {
  //     console.error("Login failed:", error);
  //   }
  // };

  useEffect(() => {
    const performAuth = async (role: string) => {
      try {
        if (!id) {
          console.error("No user ID available");
          return;
        }

        const redirectUri = `${window.location.origin}/auth?role=${encodeURIComponent(role)}&redirect=${encodeURIComponent(
          `/appointments?id=${id}`
        )}`;
        const authClient = getAuthClient();
        await authClient.login({
          redirectUri,
          prompt: "login",
        });
      } catch (error) {
        console.error("Login failed:", error);
      }
    };

    initAuth().then((authenticated) => {
      if (authenticated) {
        console.log("Auth initialized and user is authenticated");
        // setAutenticated(true);
      } else {
        performAuth("client");
        console.log("User is not authenticated");
      }
    });
  }, [id]);

  // TODO: preserve the following click handler for future profile click behavior
  // const handleClick = () => {
  //   dispatch(
  //     setProfileData({
  //       id,
  //       name,
  //       role,
  //       experience,
  //       location,
  //       rating,
  //       reviews,
  //       fees,
  //       image,
  //       portfolios,
  //     })
  //   );
  //
  //   if (onProfileNavigate) {
  //     onProfileNavigate();
  //   }
  //   // router.push(`/view-profile?id=${id}`); // Removed broken link
  // };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    handleResize(); // initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        maxWidth: { sm: "300px" },
        maxHeight: isHovered ? "100%" : "400px",
        borderRadius: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        transition: "max-height 0.5s ease",
        "&:hover": {
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <Box display="flex" alignItems="center" paddingY={2}>
        <CardMedia
          component="img"
          image={image}
          alt={name}
          sx={{ marginLeft: 2, width: 64, height: 64, borderRadius: "50%" }}
        />
        <Box ml={2}>
          <h1 className="text-[20px] text-[#333333] font-medium pb-4">
            {name}
          </h1>
          <h3 className="text-[16px] text-[#333333] font-bold pb-2">{role}</h3>
        </Box>
      </Box>
      <Box className="px-4">
        <hr />
      </Box>
      <Box
        className="px-4 py-2 flex gap-2 items-center justify-center flex-wrap"
        sx={{
          maxHeight: isHovered || isMobile ? "none" : "40px",
          overflow: "hidden",
        }}
      >
        {isHovered || isMobile || portfolios.length <= 2 ? (
          portfolios.map((portfolio, index) => (
            <h3
              key={index}
              className="text-[14px] text-[#626262] font-normal pb-2 capitalize"
            >
              {portfolio}
              {index < portfolios.length - 1 && ","}
            </h3>
          ))
        ) : (
          <>
            {portfolios.slice(0, 2).map((portfolio, index) => (
              <h3
                key={index}
                className="text-[14px] text-[#626262] font-normal pb-2 capitalize"
              >
                {portfolio}
                {index === 0 && ","}
              </h3>
            ))}
            <h3 className="text-[14px] text-[#626262] font-normal pb-2">...</h3>
          </>
        )}
      </Box>
      <CardContent className="text-center" sx={{ padding: "0" }}>
        <h4 className="text-[14px] text-[#626262] font-normal pb-2">
          Total Experience: {experience} Years
        </h4>
        <h4 className="text-[14px] text-[#626262] font-normal pb-2">
          {location}
        </h4>

        <Box className="flex justify-center">
          <Rating
            sx={{ paddingRight: "12px" }}
            defaultValue={rating}
            readOnly
          />
          <h4 className="text-[14px] text-[#626262] font-normal pb-4">
            {rating} Star || {reviews}
          </h4>
        </Box>
        <hr />
        <h4 className="text-[14px] text-[#626262] font-normal py-4">
          Consultation Fees: {fees}
        </h4>
      </CardContent>
    </Card>
  );
};

export default ProfileCard;
