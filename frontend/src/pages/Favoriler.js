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
import EventIcon from "@mui/icons-material/Event";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import HelpIcon from "@mui/icons-material/Help";
import PersonIcon from "@mui/icons-material/Person";
import HomeIcon from "@mui/icons-material/Home";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import MailIcon from "@mui/icons-material/Mail";

const Favoriler = () => {
  const [favorites, setFavorites] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:3000/api/favorites",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setFavorites(response.data);
      } catch (error) {
        console.error("Favoriler alınırken hata oluştu:", error);
        alert("Favoriler alınırken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const toggleFavorite = async (eventId) => {
    const token = localStorage.getItem("token");
    if (favorites.some((fav) => fav.event_id === eventId)) {
      try {
        await axios.delete(`http://localhost:3000/api/favorites/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites((prev) => prev.filter((fav) => fav.event_id !== eventId));
        alert("Etkinlik favorilerden çıkarıldı.");
      } catch (error) {
        console.error("Favorilerden çıkarılırken hata oluştu:", error);
        alert("Favorilerden çıkarılamadı. Lütfen tekrar deneyin.");
      }
    } else {
      try {
        const response = await axios.post(
          "http://localhost:3000/api/favorites",
          { event_id: eventId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFavorites((prev) => [...prev, response.data]);
        alert("Etkinlik favorilere eklendi.");
      } catch (error) {
        console.error("Favorilere eklenirken hata oluştu:", error);
        alert("Favorilere eklenemedi. Lütfen tekrar deneyin.");
      }
    }
  };

  const handleReservation = async (eventId) => {
    const token = localStorage.getItem("token");

    try {
      await axios.post(
        "http://localhost:3000/api/reservations",
        { event_id: eventId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Rezervasyon başarıyla yapıldı!");
    } catch (error) {
      console.error("Rezervasyon sırasında hata oluştu:", error);
      alert(
        error.response?.data?.message ||
          "Rezervasyon başarısız. Lütfen tekrar deneyin."
      );
    }
  };

  const handleBuyTicket = async (eventId) => {
    const token = localStorage.getItem("token");

    try {
      await axios.post(
        "http://localhost:3000/api/tickets",
        { event_id: eventId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Bilet başarıyla satın alındı!");
    } catch (error) {
      console.error("Bilet satın alınırken hata oluştu:", error);
      alert(
        error.response?.data?.message ||
          "Bilet satın alınamadı. Lütfen tekrar deneyin."
      );
    }
  };

  const role = localStorage.getItem("role");
  const isOrganizer = role === "organizer";

  const menuItems = [
    { label: "Anasayfa", icon: <HomeIcon />, path: "/kullanici-sayfasi" },
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
    { label: "Favorilerim", icon: <StarIcon />, path: "/favoriler" },
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
    <Box sx={{ padding: "20px", textAlign: "center" }}>
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
        <Typography variant="h5">Favorilerim</Typography>
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

      {/* Favoriler Listesi */}
      {loading ? (
        <Typography variant="h6" sx={{ marginTop: 3 }}>
          Yükleniyor...
        </Typography>
      ) : favorites.length > 0 ? (
        <Grid container spacing={3} marginTop={2}>
          {favorites.map((favorite) => (
            <Grid item xs={12} sm={6} md={4} key={favorite.event_id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{favorite.title}</Typography>
                  <Typography>
                    Tarih: {new Date(favorite.event_date).toLocaleDateString()}
                  </Typography>
                  <Typography>Konum: {favorite.location}</Typography>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ marginTop: 2 }}
                  >
                    <IconButton
                      onClick={() => toggleFavorite(favorite.event_id)}
                      color="primary"
                    >
                      {favorites.some(
                        (fav) => fav.event_id === favorite.event_id
                      ) ? (
                        <StarIcon />
                      ) : (
                        <StarBorderIcon />
                      )}
                    </IconButton>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleReservation(favorite.event_id)}
                    >
                      Rezervasyon Yap
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => handleBuyTicket(favorite.event_id)}
                    >
                      Bilet Al
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="h6" sx={{ marginTop: 3 }}>
          Henüz favorilerinize eklediğiniz bir etkinlik yok.
        </Typography>
      )}
    </Box>
  );
};

export default Favoriler;
