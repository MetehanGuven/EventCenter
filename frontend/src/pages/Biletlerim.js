import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
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

const Biletlerim = () => {
  const [tickets, setTickets] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:3000/api/tickets", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTickets(response.data);
      } catch (error) {
        console.error("Biletler alınırken hata oluştu:", error);
        alert("Biletleriniz alınırken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const handleCancelTicket = async (ticketId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/api/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTickets((prevTickets) =>
        prevTickets.filter((ticket) => ticket.ticket_id !== ticketId)
      );
      alert("Bilet başarıyla iptal edildi.");
    } catch (error) {
      console.error("Bilet iptal edilirken hata oluştu:", error);
      alert(
        error.response?.data?.message ||
          "Bilet iptal edilemedi. Lütfen tekrar deneyin."
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

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
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
        <Typography variant="h5">Biletlerim</Typography>
      </Box>

      {/* Yan Menü */}
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

      {/* Bilet Listesi */}
      {loading ? (
        <Typography variant="h6" color="textSecondary" sx={{ marginTop: 3 }}>
          Yükleniyor...
        </Typography>
      ) : tickets.length > 0 ? (
        <Grid container spacing={3} marginTop={2}>
          {tickets.map((ticket) => (
            <Grid item xs={12} sm={6} md={4} key={ticket.ticket_id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{ticket.title}</Typography>
                  <Typography>
                    Tarih: {formatDate(ticket.event_date)}
                  </Typography>
                  <Typography>Konum: {ticket.location}</Typography>
                  <Typography>Fiyat: {ticket.price}₺</Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => handleCancelTicket(ticket.ticket_id)}
                  >
                    İptal Et
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="h6" color="textSecondary" sx={{ marginTop: 3 }}>
          Henüz bir biletiniz yok.
        </Typography>
      )}
    </Box>
  );
};

export default Biletlerim;
