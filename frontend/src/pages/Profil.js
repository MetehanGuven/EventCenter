import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Avatar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import EventIcon from "@mui/icons-material/Event";
import StarIcon from "@mui/icons-material/Star";
import HelpIcon from "@mui/icons-material/Help";
import HomeIcon from "@mui/icons-material/Home";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import MailIcon from "@mui/icons-material/Mail";

const Profil = () => {
  const [profile, setProfile] = useState({
    name: "",
    surname: "",
    email: "",
    phone_number: "",
    birthdate: "",
    profile_picture: "",
  });
  const [password, setPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("user_id");

        const response = await axios.get(
          `http://localhost:3000/api/users/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProfile({
          name: response.data.name,
          surname: response.data.surname,
          email: response.data.email,
          phone_number: response.data.phone_number || "",
          birthdate: response.data.birthdate || "",
          profile_picture: response.data.profile_picture_url || "",
        });
      } catch (error) {
        console.error("Profil bilgileri alınırken hata oluştu:", error);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_picture", file);

    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("user_id");

      const response = await axios.post(
        `http://localhost:3000/api/users/${userId}/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfile((prev) => ({
        ...prev,
        profile_picture: response.data.profile_picture_url,
      }));
      alert("Profil resmi başarıyla güncellendi!");
    } catch (error) {
      console.error("Profil resmi yüklenirken hata oluştu:", error);
      alert("Profil resmi yüklenemedi.");
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:3000/api/users/profile`,
        { ...profile, password },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStatusMessage("Profil başarıyla güncellendi.");
    } catch (error) {
      console.error("Profil güncellenirken hata oluştu:", error);
      setStatusMessage("Profil güncellenemedi. Lütfen tekrar deneyin.");
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
    window.location.href = path; // Sayfa yönlendirme
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
        className="top-bar"
        sx={{ backgroundColor: "#1976d2", color: "white" }}
      >
        <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: "white" }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h5">Profilim</Typography>
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

      <Paper
        elevation={5}
        sx={{
          padding: "30px",
          margin: "auto",
          maxWidth: "800px",
          textAlign: "left",
          borderRadius: "16px",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 3,
          }}
        >
          <Avatar
            src={`http://localhost:3000${profile.profile_picture}`}
            alt="Profil Resmi"
            sx={{
              width: 150,
              height: 150,
              border: "4px solid #1976d2",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
            }}
          />
          <IconButton
            component="label"
            sx={{
              position: "relative",
              top: "110px",
              left: "-30px",
              width: "40px",
              height: "40px",
              backgroundColor: "#1976d2",
              color: "white",
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              "&:hover": {
                backgroundColor: "#1565c0",
              },
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
            }}
          >
            <EditIcon fontSize="small" />
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleProfileImageUpload}
            />
          </IconButton>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Ad"
              value={profile.name}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, name: e.target.value }))
              }
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Soyad"
              value={profile.surname}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, surname: e.target.value }))
              }
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="E-posta"
              value={profile.email}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, email: e.target.value }))
              }
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Telefon"
              value={profile.phone_number}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  phone_number: e.target.value,
                }))
              }
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Doğum Tarihi"
              type="date"
              value={profile.birthdate}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, birthdate: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Yeni Şifre (isteğe bağlı)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              variant="outlined"
            />
          </Grid>
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
          {statusMessage && (
            <Grid item xs={12}>
              <Typography color="green" variant="subtitle1" align="center">
                {statusMessage}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default Profil;
