import { Card, CardContent, Avatar, Box } from "@mui/material";

interface TestimonialCardProps {
  testimonial: string;
  name: string;
  designation: string;
  location: string;
  avatarUrl: string;
  backgroundImage?: string;
}

export default function TestimonialCard({
  testimonial,
  name,
  designation,
  location,
  avatarUrl,
  backgroundImage,
}: TestimonialCardProps) {
  return (
    <Card
      sx={{
        maxWidth: 400,
        minHeight: 325,
        background: backgroundImage
          ? `url(${backgroundImage})`
          : " ",
        backgroundSize: "625px",
        backgroundPosition: "center",
        borderRadius: "12px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        padding: 2,
        mx: { xs: "auto" },
      }}
    >
      <CardContent>
        <p className="text-[15px] text-[#626262] font-normal">
          {`"${testimonial}"`}
        </p>
        <Box display="flex" alignItems="center" mt={2}>
          <Avatar src={avatarUrl} alt={name} sx={{ width: 48, height: 48 }} />
          <Box ml={2}>
            <p className="text-[14px] font-medium">
              {name}
            </p>
            <p className="text-[11px] font-normal">
              {designation}
            </p>
            <p className="text-[11px] font-normal">
              {location}
            </p>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
