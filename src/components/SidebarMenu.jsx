// components/SidebarMenu.jsx
import React from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Tooltip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { Link } from "react-router-dom";

const menuItems = [
  {
    text: "Dashboard",
    icon: <DashboardIcon />,
    route: "/dashboard",
    disabled: true,
  },
  { text: "Clientes", icon: <GroupIcon />, route: "/clientes" },
  { text: "Facturaciones", icon: <ReceiptLongIcon />, route: "/facturaciones" },
];

const SidebarMenu = ({ onClose }) => {
  return (
    <Box
      sx={{
        backgroundColor: "primary.main",
        height: "100%",
        width: { xs: 200, sm: 60, md: 70 },
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        pt: 2,
      }}
    >
      <List>
        {menuItems.map(({ text, icon, route, disabled }) => (
          <ListItem key={text} disablePadding onClick={onClose}>
            <Link
              to={disabled ? "#" : route}
              style={{ textDecoration: "none" }}
            >
              <Tooltip title={text} placement="right">
                <ListItemButton
                  sx={{
                    justifyContent: "center",
                    opacity: disabled ? 0.5 : 1, // visualmente deshabilitado
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  <ListItemIcon sx={{ color: "white" }}>{icon}</ListItemIcon>
                </ListItemButton>
              </Tooltip>
            </Link>
          </ListItem>
        ))}
      </List>

      <List>
        <ListItem onClick={onClose}>
          <Tooltip title="Salir" placement="right">
            <ListItemButton sx={{ justifyContent: "center" }}>
              <ListItemIcon sx={{ color: "white" }}>
                <ExitToAppIcon />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );
};

export default SidebarMenu;
