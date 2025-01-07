import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Grid,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import EventIcon from "@mui/icons-material/Event";
import MailIcon from "@mui/icons-material/Mail";
import PersonIcon from "@mui/icons-material/Person";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import HelpIcon from "@mui/icons-material/Help";
import HomeIcon from "@mui/icons-material/Home";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

const KullaniciSayfasi = () => {
  const [events, setEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState({});
  const [filter, setFilter] = useState({
    categories: [],
    minPrice: "",
    maxPrice: "",
    minCapacity: "",
    maxCapacity: "",
    date: "",
  });

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

  const role = localStorage.getItem("role");
  const isOrganizer = role === "organizer";

  useEffect(() => {
    const fetchEventsAndFavorites = async () => {
      try {
        const token = localStorage.getItem("token");

        const eventsResponse = await axios.get(
          "http://localhost:3000/api/events",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setEvents(eventsResponse.data);
        setFilteredEvents(eventsResponse.data); // İlk yüklemede tüm etkinlikleri göster

        const favoritesResponse = await axios.get(
          "http://localhost:3000/api/favorites",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFavorites(favoritesResponse.data.map((fav) => fav.event_id));
      } catch (error) {
        console.error("Veriler alınırken hata oluştu:", error);
      }
    };

    fetchEventsAndFavorites();
  }, []);

  const toggleFavorite = async (eventId) => {
    const token = localStorage.getItem("token");
    if (favorites.includes(eventId)) {
      try {
        await axios.delete(`http://localhost:3000/api/favorites/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites((prev) => prev.filter((id) => id !== eventId));
      } catch (error) {
        console.error("Favorilerden çıkarılırken hata oluştu:", error);
      }
    } else {
      try {
        await axios.post(
          "http://localhost:3000/api/favorites",
          { event_id: eventId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFavorites((prev) => [...prev, eventId]);
      } catch (error) {
        console.error("Favorilere eklenirken hata oluştu:", error);
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
      alert("Rezervasyon başarısız. Lütfen tekrar deneyin.");
    }
  };

  const handleQuantityChange = (eventId, value) => {
    setQuantity((prev) => ({
      ...prev,
      [eventId]: value,
    }));
  };

  const handleBuyTicket = async (eventId) => {
    const selectedQuantity = quantity[eventId] || 1; // Adet bilgisi

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3000/api/tickets",
        {
          event_id: eventId,
          quantity: selectedQuantity, // Backend'e gönderiyoruz
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 201) {
        alert(`Bilet(ler) başarıyla satın alındı: ${selectedQuantity} adet`);
      } else {
        alert(`Hata: ${response.data.message}`);
      }
    } catch (error) {
      console.error("Bilet satın alınırken hata:", error);
      alert("Bilet satın alma başarısız. Lütfen tekrar deneyin.");
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

  if (isOrganizer) {
    menuItems.push({
      label: "Etkinlik Yönetimi",
      icon: <EventIcon />,
      path: "/etkinlik-yonetimi",
    });
  }

  const applyFilters = () => {
    const filtered = events.filter((event) => {
      const categoryMatch =
        filter.categories.includes("Hepsi") ||
        filter.categories.length === 0 ||
        filter.categories.includes(event.category);

      const priceMatch =
        (!filter.minPrice || event.ticket_price >= filter.minPrice) &&
        (!filter.maxPrice || event.ticket_price <= filter.maxPrice);

      const capacityMatch =
        (!filter.minCapacity || event.max_capacity >= filter.minCapacity) &&
        (!filter.maxCapacity || event.max_capacity <= filter.maxCapacity);

      const dateMatch = !filter.date || event.event_date === filter.date;

      return categoryMatch && priceMatch && capacityMatch && dateMatch;
    });
    setFilteredEvents(filtered);
    setFilterDialogOpen(false); // Dialogu kapat
  };

  const resetFilters = () => {
    setFilter({
      categories: [],
      minPrice: "",
      maxPrice: "",
      minCapacity: "",
      maxCapacity: "",
      date: "",
    });
    setFilteredEvents(events); // Tüm etkinlikleri geri getir
  };

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
    <Box sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      {/* Header */}
      <AppBar position="sticky" sx={{ backgroundColor: "#1976d2" }}>
        {/* Drawer Menu */}
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)} // Drawer'ı kapatmak için
        >
          <Box sx={{ width: 250 }}>
            <List>
              {menuItems.map((item, index) => (
                <ListItem
                  button
                  key={index}
                  onClick={() => {
                    setDrawerOpen(false); // Drawer'ı kapat
                    navigateTo(item.path); // Sayfaya yönlendir
                  }}
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
          </Box>
        </Drawer>

        <Toolbar>
          <IconButton
            onClick={() => setDrawerOpen(true)}
            edge="start"
            sx={{ color: "white" }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, color: "white" }}
          >
            Etkinlikler
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => setFilterDialogOpen(true)}
            sx={{ color: "white" }}
          >
            <FilterAltIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
      >
        <DialogTitle>Filtreleme</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="category-label">Kategori</InputLabel>
                <Select
                  labelId="category-label"
                  multiple
                  value={filter.categories}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      categories: e.target.value.includes("Hepsi")
                        ? ["Hepsi"]
                        : e.target.value.filter(
                            (category) => category !== "Hepsi"
                          ),
                    }))
                  }
                  renderValue={(selected) => selected.join(", ")}
                >
                  {categories.map((category, index) => (
                    <MenuItem key={index} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Min Fiyat"
                type="number"
                fullWidth
                value={filter.minPrice}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, minPrice: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Max Fiyat"
                type="number"
                fullWidth
                value={filter.maxPrice}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, maxPrice: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Min Kapasite"
                type="number"
                fullWidth
                value={filter.minCapacity}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    minCapacity: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Max Kapasite"
                type="number"
                fullWidth
                value={filter.maxCapacity}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    maxCapacity: e.target.value,
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetFilters} color="secondary">
            Sıfırla
          </Button>
          <Button onClick={applyFilters} color="primary" variant="contained">
            Filtrele
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Cards */}
      <Box sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
        {/* Event Cards */}
        <Grid container spacing={3} padding={3}>
          {filteredEvents.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event.event_id}>
              <Card
                sx={{
                  borderRadius: "12px",
                  boxShadow: 3,
                  backgroundColor: "white",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      marginBottom: 1,
                      cursor: "pointer",
                    }}
                    onClick={() => navigateTo(`/etkinlik/${event.event_id}`)} // Detay sayfasına yönlendirme
                  >
                    {event.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ marginBottom: 1 }}
                  >
                    {event.description}
                  </Typography>
                  <Typography variant="body2" sx={{ marginBottom: 1 }}>
                    Tarih:{" "}
                    {new Date(event.event_date).toLocaleDateString("tr-TR")}
                  </Typography>
                  <Typography variant="body2" sx={{ marginBottom: 1 }}>
                    Lokasyon: {event.location}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", marginBottom: 1 }}
                  >
                    Bilet Fiyatı: {event.ticket_price}₺
                  </Typography>
                  <Box display="flex" alignItems="center" mt={2}>
                    <TextField
                      type="number"
                      label="Adet"
                      value={quantity[event.event_id] || 1}
                      onChange={(e) =>
                        handleQuantityChange(
                          event.event_id,
                          parseInt(e.target.value) || 1
                        )
                      }
                      sx={{ width: "70px", marginRight: "16px" }}
                      inputProps={{ min: 1 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleBuyTicket(event.event_id)}
                    >
                      Bilet Al
                    </Button>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <IconButton
                      onClick={() => toggleFavorite(event.event_id)}
                      color={
                        favorites.includes(event.event_id)
                          ? "primary"
                          : "default"
                      }
                    >
                      {favorites.includes(event.event_id) ? (
                        <StarIcon />
                      ) : (
                        <StarBorderIcon />
                      )}
                    </IconButton>
                    <Button
                      variant="outlined"
                      onClick={() => handleReservation(event.event_id)}
                    >
                      Rezervasyon Yap
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default KullaniciSayfasi;
