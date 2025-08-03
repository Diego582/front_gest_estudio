// layouts/MainLayout.jsx
import { Box, useMediaQuery, Drawer } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import HeaderBar  from "../components/HeaderBar";
import SidebarMenu  from "../components/SidebarMenu";

export default function MainLayout() {
  const [openDrawer, setOpenDrawer] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ height: "100vh", overflow: "hidden" }}>
      <HeaderBar  onToggleMenu={() => setOpenDrawer(true)} />
      <Box sx={{ display: "flex", height: "90vh" }}>
        {/* Desktop */}
        {!isMobile && <SidebarMenu  />}

        {/* Mobile Drawer */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={openDrawer}
            onClose={() => setOpenDrawer(false)}
          >
            <SidebarMenu  onClose={() => setOpenDrawer(false)} />
          </Drawer>
        )}

        <Box sx={{ flexGrow: 1, height: "100%" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
