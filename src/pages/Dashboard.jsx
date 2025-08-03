import React from "react";
import { Grid, Paper, Typography, Box } from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import BarChartIcon from "@mui/icons-material/BarChart";
import ReceiptIcon from "@mui/icons-material/Receipt";

const stats = [
  {
    title: "Ingresos Totales",
    value: "$125,300",
    icon: <AccountBalanceIcon fontSize="large" color="primary" />,
  },
  {
    title: "Facturas Emitidas",
    value: "147",
    icon: <ReceiptIcon fontSize="large" color="secondary" />,
  },
  {
    title: "Balance Mensual",
    value: "+$4,850",
    icon: <BarChartIcon fontSize="large" color="action" />,
  },
];

const Dashboard = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Panel de Control
      </Typography>
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper
              elevation={3}
              sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}
            >
              {stat.icon}
              <Box>
                <Typography variant="subtitle1">{stat.title}</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {stat.value}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
