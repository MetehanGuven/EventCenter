import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    navigate("/");
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Etkinlik Yönetim Sistemi
        </Typography>
        <Button color="inherit" onClick={handleLogout}>
          Çıkış Yap
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
