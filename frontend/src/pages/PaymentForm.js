import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Typography,
  Box,
  Container,
  CircularProgress,
} from "@mui/material";

const OdemeSayfasi = ({ eventId, price }) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (!cardNumber || !expiryDate || !cvv) {
      alert("Lütfen tüm alanları doldurun.");
      return;
    }

    setIsLoading(true);
    try {
      const userId = localStorage.getItem("user_id");
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:3000/api/payments",
        { event_id: eventId, price },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Ödeme başarıyla tamamlandı!");
    } catch (error) {
      console.error("Ödeme işlemi sırasında hata oluştu:", error);
      alert("Ödeme başarısız. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container style={{ marginTop: "20px" }}>
      <Typography variant="h4">Ödeme Sayfası</Typography>
      <Box style={{ marginTop: "20px" }}>
        <TextField
          label="Kart Numarası"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          fullWidth
          style={{ marginBottom: "10px" }}
        />
        <TextField
          label="Son Kullanma Tarihi (MM/YY)"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          fullWidth
          style={{ marginBottom: "10px" }}
        />
        <TextField
          label="CVV"
          value={cvv}
          onChange={(e) => setCvv(e.target.value)}
          fullWidth
          style={{ marginBottom: "10px" }}
        />
        <Typography variant="h6" style={{ marginTop: "20px" }}>
          Toplam Tutar: {price} ₺
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handlePayment}
          disabled={isLoading}
          style={{ marginTop: "20px" }}
        >
          {isLoading ? <CircularProgress size={24} /> : "Ödemeyi Tamamla"}
        </Button>
      </Box>
    </Container>
  );
};

export default OdemeSayfasi;
