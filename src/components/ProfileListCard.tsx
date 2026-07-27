import React, { useEffect /*, useState */ } from "react";
import { Typography, /* Button, */ Box, Rating, Avatar } from "@mui/material";
import { getAuthClient, initAuth } from "@/services/authServices";
// import { useRouter } from "next/navigation"; // TODO: restore if list card navigation is reintroduced
// import { setProfileData } from "@/app/redux/searchProfile/profileSlice"; // TODO: use profile data dispatch when list navigation is enabled
// import { useAppDispatch } from "@/app/redux/store/hook"; // TODO: preserve redux hook for future list navigation

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
  // onProfileNavigate?: () => void; // TODO: preserve callback for future list item navigation
}

const LawyerCard: React.FC<CardProps> = ({
  id,
  name,
  role,
  rating,
  reviews,
  experience,
  // location,
  fees,
  image,
  portfolios,
  // onProfileNavigate,
}) => {
  // const router = useRouter(); // TODO: restore navigation when list card click behavior is needed
  // const dispatch = useAppDispatch(); // TODO: preserve redux dispatch for future profile navigation
  // const [authenticated, setAutenticated] = useState(false); // TODO: preserve auth state for future auth-aware list rendering
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
  // TODO: preserve the following click handler for future profile list navigation
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
  return (
    <Box
      sx={{
        overflowX: "auto",
        whiteSpace: "nowrap",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          padding: 2,
          borderBottom: 1,
          borderBottomColor: "#E0E0E0",
          minWidth: "870px",
        }}
      >
        <Box sx={{ display: "flex", gap: 3 }}>
          <Avatar src={image} sx={{ width: 80, height: 80 }} />

          <Box>
            <h1 className="text-[18px] text-[#333333] font-medium pb-4">
              {name}
            </h1>
            <h3 className="text-[16px] text-[#333333] font-normal pb-2">
              {role}
            </h3>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <Rating value={rating} readOnly precision={0.5} size="small" />
              <Typography variant="body2" sx={{ ml: 1 }}>
                {rating} Star || {reviews}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box>
          <h3 className="text-[14px] text-[#626262] font-normal pb-2">
            Total experience: {experience} Years
          </h3>
          {portfolios.map((portfolio, index) => (
            <h3
              key={index}
              className="text-[14px] text-[#626262] font-normal pb-2 capitalize"
            >
              {portfolio},
            </h3>
          ))}
          <h3 className="text-[14px] text-[#626262] font-normal py-4">
            Consultation Fees: {fees}
          </h3>
        </Box>
      </Box>
    </Box>
  );
};

export default LawyerCard;
