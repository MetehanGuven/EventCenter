import React from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    navigate("/giris");
  };

  const profilePicture = localStorage.getItem("profile_picture_url");

  return (
    <nav style={{ padding: "10px", backgroundColor: "#f0f0f0" }}>
      <div>
        <button onClick={() => navigate("/kullanici-sayfasi")}>
          Ana Sayfa
        </button>
        <button onClick={() => navigate("/admin-sayfasi")}>
          Admin Sayfası
        </button>
      </div>
      <div style={{ float: "right", display: "flex", alignItems: "center" }}>
        <img
          src={profilePicture || "default-avatar.png"}
          alt="Profile"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            cursor: "pointer",
          }}
          onClick={() => navigate("/kullanici-sayfasi")}
        />
        <button onClick={handleLogout}>Çıkış Yap</button>
      </div>
    </nav>
  );
};

export default Navbar;
