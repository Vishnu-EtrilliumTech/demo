"use client";
import { Box, Card, CardContent, CardMedia } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledCard = styled(Card)`
  position: relative;
  width: 100%;
  max-width: 345px;
  height: 100%;
  margin: ${({ theme }) => theme.spacing(1)};
  display: flex;
  flex-direction: column;
  background-color: #fff9f5;
  backdrop-filter: blur(10px);
  box-shadow: none;
`;

interface ProcessCardsProps {
  image: string;
  title: string;
  description: string;
  style?: React.CSSProperties;
}

const ProcessCards = ({
  image,
  title,
  description,
  style,
}: ProcessCardsProps) => {
  return (
    <StyledCard sx={{ mx: { xs: "auto" } }}>
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
          image={image}
          alt={title}
          sx={{
            padding: { xs: 1.5, sm: 2 },
            objectFit: "contain",
            maxHeight: { xs: 120, sm: 140 },
            width: "auto",
            margin: "0 auto",
          }}
          style={style}
        />
        <CardContent>
          <p className="text-[16px] font-bold text-center xl:text-left break-words">
            {title}
          </p>
          <p className="text-[12px] font-normal text-center xl:text-left break-words">
            {description}
          </p>
        </CardContent>
      </Box>
    </StyledCard>
  );
};

export default ProcessCards;
