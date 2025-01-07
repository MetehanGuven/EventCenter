import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import EventIcon from "@mui/icons-material/Event";
import StarIcon from "@mui/icons-material/Star";
import HelpIcon from "@mui/icons-material/Help";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import MailIcon from "@mui/icons-material/Mail";

const Rezervasyonlarim = () => {
  const [reservations, setReservations] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:3000/api/reservations",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setReservations(response.data);
      } catch (error) {
        console.error("Rezervasyonlar alınırken hata oluştu:", error);
      }
    };

    fetchReservations();
  }, []);

  const handleBuyTicket = async (reservation) => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      // 1. Bilet satın alma işlemi
      await axios.post(
        "http://localhost:3000/api/tickets",
        { event_id: reservation.event_id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Rezervasyonu iptal etme işlemi
      await axios
        .delete(
          `http://localhost:3000/api/reservations/${reservation.reservation_id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .then(() => {
          // UI'dan kaldır
          setReservations((prev) =>
            prev.filter(
              (res) => res.reservation_id !== reservation.reservation_id
            )
          );
          alert("Bilet başarıyla satın alındı ve rezervasyon iptal edildi!");
        })
        .catch((deleteError) => {
          if (deleteError.response?.status === 404) {
            // Rezervasyon zaten silinmişse UI'den kaldır
            setReservations((prev) =>
              prev.filter(
                (res) => res.reservation_id !== reservation.reservation_id
              )
            );
            alert("Bilet başarıyla satın alındı.");
          } else {
            throw deleteError;
          }
        });
    } catch (error) {
      console.error("Bilet satın alma sırasında hata oluştu:", error);
      alert(
        error.response?.data?.message ||
          "Bilet satın alınamadı. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId) => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      await axios.delete(
        `http://localhost:3000/api/reservations/${reservationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // UI'dan kaldır
      setReservations((prev) =>
        prev.filter((res) => res.reservation_id !== reservationId)
      );

      alert("Rezervasyon başarıyla iptal edildi!");
    } catch (error) {
      console.error("Rezervasyon iptali sırasında hata oluştu:", error);
      alert(
        error.response?.data?.message ||
          "Rezervasyon iptal edilemedi. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  };

  const role = localStorage.getItem("role");
  const isOrganizer = role === "organizer";

  const menuItems = [
    { label: "Anasayfa", icon: <EventIcon />, path: "/kullanici-sayfasi" },
    { label: "Profilim", icon: <PersonIcon />, path: "/profil" },
    {
      label: "Biletlerim",
      icon: <ConfirmationNumberIcon />,
      path: "/biletlerim",
    },
    {
      label: "Rezervasyonlarım",
      icon: <EventIcon />,
      path: "/rezervasyonlarim",
    },
    { label: "Favoriler", icon: <StarIcon />, path: "/favoriler" },
    { label: "Destek", icon: <HelpIcon />, path: "/destek" },
    { label: "Mesajlar", icon: <MailIcon />, path: "/mesajlar" },
  ];

  if (isOrganizer) {
    menuItems.push({
      label: "Etkinlik Yönetimi",
      icon: <EventIcon />,
      path: "/etkinlik-yonetimi",
    });
  }

  const navigateTo = (path) => {
    window.location.href = path;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  return (
    <Box sx={{ padding: "20px" }}>
      {/* Üst Menü */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        padding="10px"
        sx={{ backgroundColor: "#1976d2", color: "white" }}
      >
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: "white" }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h5">Rezervasyonlarım</Typography>
      </Box>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <List>
          {menuItems.map((item, index) => (
            <ListItem
              button
              key={index}
              onClick={() => navigateTo(item.path)}
              sx={{ cursor: "pointer" }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
          {/* Çıkış Yap Butonu */}
          <ListItem
            button
            onClick={handleLogout}
            sx={{ cursor: "pointer", color: "red" }}
          >
            <ListItemIcon>
              <ExitToAppIcon />
            </ListItemIcon>
            <ListItemText primary="Çıkış Yap" />
          </ListItem>
        </List>
      </Drawer>

      {/* Rezervasyon Listesi */}
      <Grid container spacing={3} marginTop={2}>
        {reservations.length > 0 ? (
          reservations.map((reservation) => (
            <Grid item xs={12} sm={6} md={4} key={reservation.reservation_id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {reservation.event_title}
                  </Typography>
                  <Typography>
                    Tarih:{" "}
                    {new Date(reservation.event_date).toLocaleDateString()}
                  </Typography>
                  <Typography>Konum: {reservation.event_location}</Typography>
                </CardContent>
                <Box
                  display="flex"
                  justifyContent="space-around"
                  alignItems="center"
                  sx={{ padding: "10px" }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleBuyTicket(reservation)}
                    disabled={loading}
                  >
                    {loading ? "İşlemde..." : "Bilet Al"}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() =>
                      handleCancelReservation(reservation.reservation_id)
                    }
                    disabled={loading}
                  >
                    {loading ? "İşlemde..." : "İptal Et"}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography
            variant="h6"
            color="textSecondary"
            sx={{ margin: "auto" }}
          >
            Henüz bir rezervasyonunuz yok.
          </Typography>
        )}
      </Grid>
    </Box>
  );
};

export default Rezervasyonlarim;
