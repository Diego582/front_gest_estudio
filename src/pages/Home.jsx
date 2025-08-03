import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardActionArea,
  CardContent,
} from "@mui/material";
import { BarChart3, FileText, UserCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Dashboard",
      description:
        "Accedé al panel principal con métricas, accesos rápidos y resumen financiero del sistema.",
      icon: <BarChart3 size={32} />,
      path: "/dashboard",
    },
    {
      title: "Facturaciones",
      description: "Accedé a tus facturas y creá nuevas",
      icon: <FileText size={32} />,
      path: "/facturaciones",
    },
    {
      title: "Clientes",
      description: "Administrá la información de tus clientes",
      icon: <UserCircle2 size={32} />,
      path: "/clientes",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={500} gutterBottom>
        Bienvenido al sistema contable
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Seleccioná una de las opciones para comenzar:
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {menuItems.map((item) => (
          <Grid key={item.title} item xs={12} sm={6} md={4}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardActionArea
                onClick={() => navigate(item.path)}
                sx={{
                  p: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <Box sx={{ mb: 2, color: "primary.main" }}>{item.icon}</Box>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Home;
