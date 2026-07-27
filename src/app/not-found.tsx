import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";

export default function NotFound() {
  return (
    <Box
      className="h-[100vh] flex flex-col items-center justify-center text-center px-4"
      sx={{ backgroundColor: "background.default" }}
    >
      <Box maxWidth="sm">
        <Typography
          variant="h1"
          component="h1"
          gutterBottom
          sx={{
            fontSize: {
              xs: "3rem",
              sm: "4rem",
              md: "6rem",
            },
          }}
        >
          Oops! 404
        </Typography>
        <Typography
          variant="h4"
          component="h2"
          gutterBottom
          sx={{
            fontSize: {
              xs: "1.5rem",
              sm: "2rem",
              md: "2.5rem",
            },
          }}
        >
          Looks like this page took an unexpected coffee break
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            mb: { xs: 3, md: 4 },
            fontSize: {
              xs: "1rem",
              sm: "1.1rem",
            },
          }}
        >
          We&apos;ve searched high and low, checked under the desk, and even
          asked the office plant, but this page seems to have wandered off.
          Maybe it&apos;s in a meeting?
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{
            "&:hover": {
              transform: "scale(1.05)",
              transition: "transform 0.2s",
            },
          }}
        >
          <Link href="/">Back to Business 💼</Link>
        </Button>
      </Box>
    </Box>
  );
}
