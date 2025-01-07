import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import EventIcon from "@mui/icons-material/Event";
import StarIcon from "@mui/icons-material/Star";
import HelpIcon from "@mui/icons-material/Help";
import MailIcon from "@mui/icons-material/Mail";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#ff9800",
    },
    error: {
      main: "#f44336",
    },
  },
});

const EtkinlikYonetimi = () => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    max_capacity: "",
    ticket_price: "",
    category: "",
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const categories = [
    "Konser",
    "Teknoloji",
    "Spor",
    "Sanat",
    "Eğitim",
    "Sosyal Sorumluluk",
    "Yemek",
    "Eğlence",
  ];

  const fetchOrganizerEvents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:3000/api/organizer/events",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEvents(response.data);
    } catch (error) {
      console.error("Etkinlikler alınırken hata oluştu:", error);
    }
  };

  const handleUpdatePrice = async (eventId) => {
    const newPrice = prompt("Yeni fiyatı girin:");

    if (!newPrice || isNaN(newPrice) || newPrice <= 0) {
      alert("Geçerli bir fiyat girin!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:3000/api/events/${eventId}/price`,
        { new_price: newPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Fiyat başarıyla güncellendi!");
      fetchOrganizerEvents();
    } catch (error) {
      console.error("Fiyat güncellenirken hata oluştu:", error);
      alert("Fiyat güncellenirken bir hata oluştu.");
    }
  };

  const handleUpdateDate = async (eventId) => {
    const newDate = prompt("Yeni tarihi girin (YYYY-MM-DD):");

    const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(newDate);
    if (!newDate || !isValidDate(newDate)) {
      alert("Geçerli bir tarih girin! Format: YYYY-MM-DD");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:3000/api/events/${eventId}/date`,
        { new_date: newDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Tarih başarıyla güncellendi!");
      fetchOrganizerEvents();
    } catch (error) {
      console.error("Tarih güncellenirken hata oluştu:", error);
      alert("Tarih güncellenirken bir hata oluştu.");
    }
  };

  const handleAddEvent = async () => {
    if (
      !newEvent.title ||
      !newEvent.event_date ||
      newEvent.ticket_price === ""
    ) {
      alert("Lütfen tüm gerekli alanları doldurun!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:3000/api/events", newEvent, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Etkinlik başarıyla eklendi!");
      fetchOrganizerEvents();
      setNewEvent({
        title: "",
        description: "",
        location: "",
        event_date: "",
        max_capacity: "",
        ticket_price: "",
      });
    } catch (error) {
      console.error("Etkinlik eklenirken hata oluştu:", error);
      alert("Etkinlik eklenirken hata oluştu.");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Etkinlik başarıyla silindi!");
      fetchOrganizerEvents();
    } catch (error) {
      console.error("Etkinlik silinirken hata oluştu:", error);
    }
  };

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

  const navigateTo = (path) => {
    window.location.href = path;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  useEffect(() => {
    fetchOrganizerEvents();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Box>
        {/* Header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          padding="10px"
          sx={{ backgroundColor: "#1976d2", color: "white" }}
        >
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{ color: "white" }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h5">Etkinlik Yönetimi</Typography>
        </Box>

        {/* Drawer Menu */}
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

        {/* Content */}
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            Yeni Etkinlik Ekle
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Etkinlik Adı"
                fullWidth
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Açıklama"
                fullWidth
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </Grid>
            {/* Kategori Seçimi */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="category-label">Kategori</InputLabel>
                <Select
                  labelId="category-label"
                  value={newEvent.category}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  {categories.map((category, index) => (
                    <MenuItem key={index} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Lokasyon"
                fullWidth
                value={newEvent.location}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, location: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Tarih"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={newEvent.event_date}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    event_date: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Kapasite"
                type="number"
                fullWidth
                value={newEvent.max_capacity}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    max_capacity: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Bilet Fiyatı"
                type="number"
                fullWidth
                value={newEvent.ticket_price}
                onChange={(e) =>
                  setNewEvent((prev) => ({
                    ...prev,
                    ticket_price: e.target.value,
                  }))
                }
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            onClick={handleAddEvent}
            sx={{ mt: 2, backgroundColor: "#1976d2" }}
          >
            Etkinlik Ekle
          </Button>
        </Box>

        <Typography variant="h6" gutterBottom>
          Mevcut Etkinlikler
        </Typography>
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event.event_id}>
              <Card
                sx={{
                  borderRadius: "16px",
                  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
                  transition: "transform 0.3s",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                  backgroundColor: "#ffffff",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ color: "#1976d2" }}
                  >
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {event.description}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Tarih:</strong>{" "}
                    {new Date(event.event_date).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Kapasite:</strong> {event.max_capacity}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Bilet Fiyatı:</strong> {event.ticket_price}₺
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Kategori:</strong>{" "}
                    {event.category || "Belirtilmedi"}
                  </Typography>

                  <Box
                    display="flex"
                    flexDirection="column"
                    gap={1}
                    mt={2}
                    sx={{ width: "100%" }}
                  >
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      startIcon={<DeleteForeverIcon />}
                      onClick={() => handleDeleteEvent(event.event_id)}
                    >
                      Sil
                    </Button>
                    <Button
                      variant="contained"
                      color="info"
                      fullWidth
                      startIcon={<ConfirmationNumberIcon />}
                      onClick={() => handleUpdatePrice(event.event_id)}
                    >
                      Fiyat Değiştir
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      startIcon={<EventIcon />}
                      onClick={() => handleUpdateDate(event.event_id)}
                    >
                      Tarih Güncelle
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </ThemeProvider>
  );
};

export default EtkinlikYonetimi;
