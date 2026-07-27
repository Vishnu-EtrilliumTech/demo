import { Box } from "@mui/material";
import VersionDisplay from "./VersionDisplay";

const CustomFooter = () => {
  return (
    <Box className="text-center bg-white flex flex-col items-center justify-center border fixed bottom-0 w-full py-2">
      <p className="text-[11px] text-[#646464] font-normal">
        All rights reserved. 2025
      </p>
      <VersionDisplay className="text-[#646464] mt-1" />
    </Box>
  );
};

export default CustomFooter;
