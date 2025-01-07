import React, { useState } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Typography,
  Link,
  Container,
  Box,
  MenuItem,
} from "@mui/material";

const HomePage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState({
    countryCode: "+90", // Varsayılan değer
    number: "",
  });
  const [status, setStatus] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:3000/api/login", {
        email,
        password,
      });
      const { token, user_id, role } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("role", role);

      window.location.href =
        role === "admin" ? "/admin-sayfasi" : "/kullanici-sayfasi";
    } catch (error) {
      setStatus("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
    }
  };

  const handleRegister = async () => {
    try {
      const fullPhoneNumber = `${phoneNumber.countryCode} ${phoneNumber.number}`;
      await axios.post("http://localhost:3000/api/users", {
        name,
        surname,
        email,
        password,
        birthdate,
        phone_number: fullPhoneNumber,
      });
      alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
      setIsLogin(true);
    } catch (error) {
      alert("Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.");
    }
  };

  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        background: "linear-gradient(to bottom, #1976d2, #f0f0f0)",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "400px",
          background: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Typography variant="h5" textAlign="center" mb={2}>
          {isLogin ? "Giriş Yap" : "Kayıt Ol"}
        </Typography>
        {isLogin ? (
          <>
            <TextField
              label="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleLogin}
              sx={{ mt: 2 }}
            >
              Giriş Yap
            </Button>
            <Typography mt={2} textAlign="center">
              Hesabınız yok mu?{" "}
              <Link
                onClick={() => setIsLogin(false)}
                sx={{ cursor: "pointer", color: "#1976d2" }}
              >
                Kayıt Ol
              </Link>
            </Typography>
          </>
        ) : (
          <>
            <TextField
              label="Ad"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Soyad"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <TextField
                select
                label="Alan Kodu"
                value={phoneNumber.countryCode}
                onChange={(e) =>
                  setPhoneNumber((prev) => ({
                    ...prev,
                    countryCode: e.target.value,
                  }))
                }
                fullWidth
                sx={{ maxWidth: "120px" }}
              >
                {[
                  { code: "+90", name: "Türkiye" },
                  { code: "+1", name: "ABD" },
                  { code: "+44", name: "Birleşik Krallık" },
                  { code: "+49", name: "Almanya" },
                  { code: "+33", name: "Fransa" },
                  { code: "+91", name: "Hindistan" },
                ].map((country) => (
                  <MenuItem key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Telefon"
                value={phoneNumber.number}
                onChange={(e) =>
                  setPhoneNumber((prev) => ({
                    ...prev,
                    number: e.target.value,
                  }))
                }
                fullWidth
              />
            </Box>

            <TextField
              label="Doğum Tarihi"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleRegister}
              sx={{ mt: 2 }}
            >
              Kayıt Ol
            </Button>
            <Typography mt={2} textAlign="center">
              Zaten bir hesabınız var mı?{" "}
              <Link
                onClick={() => setIsLogin(true)}
                sx={{ cursor: "pointer", color: "#1976d2" }}
              >
                Giriş Yap
              </Link>
            </Typography>
          </>
        )}
        {status && <Typography color="error">{status}</Typography>}
      </Box>
    </Container>
  );
};

export default HomePage;
