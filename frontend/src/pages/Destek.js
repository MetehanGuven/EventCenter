import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Container,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import EventIcon from "@mui/icons-material/Event";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import StarIcon from "@mui/icons-material/Star";
import HelpIcon from "@mui/icons-material/Help";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import HomeIcon from "@mui/icons-material/Home";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import MailIcon from "@mui/icons-material/Mail";

const Destek = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [messageType, setMessageType] = useState("");
  const [message, setMessage] = useState("");

  const handleSendMessage = async () => {
    try {
      if (!messageType) {
        alert("Lütfen bir konu seçin!");
        return;
      }

      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:3000/api/support",
        { subject: messageType, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Mesajınız başarıyla gönderildi!");
      setMessage("");
      setMessageType("");
    } catch (error) {
      console.error("Mesaj gönderilirken hata oluştu:", error);
      alert("Mesaj gönderilemedi. Lütfen tekrar deneyin.");
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
    <Box
      sx={{
        background: "linear-gradient(to bottom, #1976d2, #ffffff)",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      {/* Üst Menü */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        padding="10px"
        sx={{
          backgroundColor: "#1976d2",
          color: "white",
          borderRadius: "8px",
          boxShadow: 3,
        }}
      >
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: "white" }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h5">Destek</Typography>
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

      {/* İçerik */}
      <Container maxWidth="md">
        {/* İletişim Bilgileri */}
        {/* İletişim Bilgileri */}
        <Card
          sx={{
            marginTop: 4,
            padding: 3,
            backgroundColor: "#ffffff",
            boxShadow: 3,
            borderRadius: "12px",
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#1976d2", marginBottom: 2 }}
            >
              İletişim Bilgileri
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center">
                  <EmailIcon sx={{ color: "#1976d2", marginRight: 1 }} />
                  <Typography>E-posta: destek@eventcenter.com</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center">
                  <PhoneIcon sx={{ color: "#1976d2", marginRight: 1 }} />
                  <Typography>Telefon: +90 555 555 5555</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Organizatörlük Uyarısı */}
        <Card
          sx={{
            marginTop: 2,
            padding: 0.2,
            backgroundColor: "#ffffff",
            boxShadow: 3,
            borderRadius: "12px",
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#d32f2f", marginBottom: 2 }}
            >
              Önemli Uyarı
            </Typography>
            <Typography variant="body1" sx={{ color: "#555" }}>
              Organizatör olmak isteyen kullanıcılarımızın, gerekli belgeleri
              mail hesabımıza iletmesi mecburidir!
            </Typography>
          </CardContent>
        </Card>

        {/* Mesaj Gönderme Alanı */}
        <Card
          sx={{
            marginTop: 4,
            padding: 3,
            backgroundColor: "#ffffff",
            boxShadow: 3,
            borderRadius: "12px",
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#1976d2", marginBottom: 2 }}
            >
              Mesaj Gönder
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Mesaj Türü"
                  fullWidth
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  variant="outlined"
                  sx={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                  }}
                >
                  <MenuItem value="Genel Destek">Genel Destek</MenuItem>
                  <MenuItem value="Teknik Destek">Teknik Destek</MenuItem>
                  <MenuItem value="Ödeme Sorunları">Ödeme Sorunları</MenuItem>
                  <MenuItem value="Organizatörlük İşlemleri">
                    Organizatörlük İşlemleri
                  </MenuItem>
                  <MenuItem value="Diğer">Diğer</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mesajınızı Yazın"
                  multiline
                  rows={4}
                  fullWidth
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  variant="outlined"
                  sx={{
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                  }}
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              fullWidth
              onClick={handleSendMessage}
              sx={{
                marginTop: 3,
                padding: "10px",
                fontSize: "16px",
                backgroundColor: "#1976d2",
                ":hover": { backgroundColor: "#145ca8" },
                color: "white",
                fontWeight: "bold",
                borderRadius: "8px",
              }}
            >
              Gönder
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Destek;
