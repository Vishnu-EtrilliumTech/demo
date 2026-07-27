"use client";

import { Card, CardContent, CardMedia, Box } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledCard = styled(Card)`
  position: relative;
  border-radius: 20px;
  width: 100%;
  max-width: 345px;
  height: 100%;
  margin: ${({ theme }) => theme.spacing(1)};
  display: flex;
  flex-direction: column;
  text-align: center;
`;

interface CustomCardProps {
  imageUrl: string;
  text: string;
  altText?: string;
  backgroundImage?: string;
}

const CustomCard = ({
  imageUrl,
  text,
  altText = "Card image",
  backgroundImage = "",
}: CustomCardProps) => {
  return (
    <StyledCard
      sx={{
        background: `url("${backgroundImage}")`,
        backgroundColor: 'white',
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        mx: { xs: "auto" },
      }}
    >
      <Box
        position="relative"
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 280,
        }}
      >
        <CardMedia
          component="img"
          image={imageUrl}
          alt={altText}
          sx={{
            padding: { xs: 1.5, sm: 2, },
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
          <p className="text-base sm:text-lg md:text-xl font-medium text-left break-words m-0">
            {text}
          </p>
        </CardContent>
      </Box>
    </StyledCard>
  );
};

export default CustomCard;
