import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
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

const Mesajlar = () => {
  const [notifications, setNotifications] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/notifications",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setNotifications(response.data);
      } catch (error) {
        console.error("Bildirimler alınırken hata oluştu:", error);
      }
    };

    fetchNotifications();
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  return (
    <Box>
      {/* Header */}
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
        <Typography variant="h5">Mesajlar</Typography>
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

      {/* Content */}
      {notifications.length > 0 ? (
        notifications.map((notification, index) => (
          <Box
            key={index}
            padding="10px"
            border="1px solid #ccc"
            margin="10px"
            bgcolor="#f9f9f9"
          >
            <Typography>
              {notification.title} etkinliğinde fiyat{" "}
              <del>{notification.old_price}₺</del> {notification.new_price}₺
              olarak değiştirildi.
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {new Date(notification.created_at).toLocaleString()}
            </Typography>
          </Box>
        ))
      ) : (
        <Typography>Henüz bildiriminiz yok.</Typography>
      )}
    </Box>
  );
};

export default Mesajlar;
