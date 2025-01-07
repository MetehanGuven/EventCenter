import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "./Header";
import TablePagination from "@mui/material/TablePagination";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Button,
  Grid,
  Container,
  Tabs,
  Tab,
  Card,
  CardContent,
  AppBar,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { styled } from "@mui/system";
import { Modal } from "@mui/material";

const countryCodes = [
  { code: "+90", name: "Türkiye" },
  { code: "+1", name: "ABD" },
  { code: "+44", name: "Birleşik Krallık" },
  { code: "+49", name: "Almanya" },
  { code: "+33", name: "Fransa" },
  { code: "+91", name: "Hindistan" },
];

const AdminSayfasi = () => {
  const [selectedMessages, setSelectedMessages] = useState(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [editEvent, setEditEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [newPrice, setNewPrice] = useState("");
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    max_capacity: "",
    ticket_price: "",
    category: "Konser",
  });
  const [newUser, setNewUser] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    birthdate: "",
    phone_number: "",
    country_code: "+90", // Varsayılan değer
  });

  const fetchMessages = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/messages", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Mesajlar alınırken hata oluştu:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/events", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setEvents(response.data);
    } catch (error) {
      console.error("Etkinlikler alınırken hata oluştu:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Kullanıcılar alınırken hata oluştu:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchUsers();
    fetchMessages();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 5));
    setPage(0);
  };

  const handleAddEvent = async () => {
    const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

    if (!isValidDate(newEvent.date)) {
      alert("Lütfen geçerli bir tarih girin (YYYY-MM-DD).");
      return;
    }

    // newEvent.date'i event_date olarak backend'e gönderiyoruz
    const formattedEvent = { ...newEvent, event_date: newEvent.date };

    try {
      await axios.post("http://localhost:3000/api/events", formattedEvent, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      alert("Etkinlik başarıyla eklendi!");
      fetchEvents();
      setNewEvent({
        title: "",
        description: "",
        location: "",
        date: "",
        max_capacity: "",
        ticket_price: "",
        category: "Konser",
      });
    } catch (error) {
      console.error("Etkinlik eklenirken hata oluştu:", error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await axios.delete(`http://localhost:3000/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Etkinlik başarıyla silindi!");
      fetchEvents();
    } catch (error) {
      console.error("Etkinlik silinirken hata oluştu:", error);
    }
  };

  const handleUpdateEvent = async () => {
    try {
      // Etkinliğin mevcut fiyatını bul
      const existingEvent = events.find(
        (event) => event.event_id === editEvent.event_id
      );
      const oldPrice = existingEvent.ticket_price;

      // Güncellenmiş etkinlik verisi
      const updatedEvent = {
        ...editEvent,
        event_date: editEvent.event_date, // Tarihi olduğu gibi gönder
      };

      // Fiyat değişikliği varsa API çağrısını gönder
      if (updatedEvent.ticket_price !== oldPrice) {
        await axios.put(
          `http://localhost:3000/api/events/${editEvent.event_id}/price`,
          { new_price: updatedEvent.ticket_price },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      // Etkinliği güncelleme
      await axios.put(
        `http://localhost:3000/api/events/${editEvent.event_id}`,
        updatedEvent,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      alert("Etkinlik başarıyla güncellendi!");
      fetchEvents();
      setEditEvent(null);
    } catch (error) {
      console.error("Etkinlik güncellenirken hata oluştu:", error);
      alert("Etkinlik güncellenirken bir hata oluştu.");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // Zaman dilimi farkını sıfırla
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("tr-TR", options);
  };

  const handleAddUser = async () => {
    try {
      await axios.post("http://localhost:3000/api/users", newUser, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Kullanıcı başarıyla eklendi!");
      fetchUsers();
      setNewUser({
        name: "",
        surname: "",
        email: "",
        password: "",
        birthdate: "",
        phone_number: "",
        country_code: "+90",
      });
    } catch (error) {
      console.error("Kullanıcı eklenirken hata oluştu:", error);
    }
  };

  const handleApproveOrganizer = async (userId) => {
    try {
      setLoading(true);
      await axios.put(
        `http://localhost:3000/api/users/${userId}`,
        { role: "organizer" },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert("Kullanıcı organizatör olarak yetkilendirildi!");
      fetchUsers();
    } catch (error) {
      console.error("Yetkilendirme işlemi sırasında hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`http://localhost:3000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Kullanıcı başarıyla silindi!");
      fetchUsers();
    } catch (error) {
      console.error("Kullanıcı silinirken hata oluştu:", error);
    }
  };

  const handleChangeTab = (event, newValue) => {
    setTabIndex(newValue);
  };

  const groupedMessages = messages.reduce((acc, message) => {
    const userId = message.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        name: message.name,
        email: message.email,
        messages: [],
      };
    }
    acc[userId].messages.push({
      id: message.message_id,
      subject: message.subject,
      content: message.message,
      sentAt: message.sent_at,
    });
    return acc;
  }, {});

  return (
    <>
      <Header title="Admin Sayfası" />
      <Container>
        <AppBar position="static" color="default" elevation={1}>
          <Tabs value={tabIndex} onChange={handleChangeTab} variant="fullWidth">
            <Tab label="Kullanıcılar" />
            <Tab label="Etkinlikler" />
            <Tab label="Mesajlar" />
          </Tabs>
        </AppBar>

        {/* Kullanıcılar Bölümü */}
        {tabIndex === 0 && (
          <Box mt={3}>
            <Typography variant="h5" mb={2}>
              Kullanıcı Yönetimi
            </Typography>

            {/* Arama Çubuğu */}
            <TextField
              label="Kullanıcı Ara"
              variant="outlined"
              fullWidth
              sx={{ mb: 2 }}
              onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
            />

            {/* Kullanıcı Tablosu */}
            <TableContainer
              component={Paper}
              sx={{
                maxHeight: 400, // Tablo yüksekliği
                overflowY: "auto", // Dikey kaydırma
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Ad</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Soyad</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Email</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Telefon</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Rol</strong>
                    </TableCell>
                    <TableCell>
                      <strong>İşlemler</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.surname}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.country_code} {user.phone_number}
                        </TableCell>
                        <TableCell>{user.role || "Kullanıcı"}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleApproveOrganizer(user.user_id)}
                            sx={{ mr: 1 }}
                          >
                            Yetkilendir
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleDeleteUser(user.user_id)}
                          >
                            Sil
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Sayfalama */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />

            {/* Kullanıcı Ekleme Formu */}
            <Box
              mt={5}
              p={4}
              sx={{
                backgroundColor: "#f9f9f9",
                borderRadius: 3,
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                border: "1px solid #ddd",
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Yeni Kullanıcı Ekle
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Ad"
                    fullWidth
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Soyad"
                    fullWidth
                    value={newUser.surname}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        surname: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="E-posta"
                    type="email"
                    fullWidth
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Şifre"
                    type="password"
                    fullWidth
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Doğum Tarihi"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    value={newUser.birthdate}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        birthdate: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    label="Ülke Kodu"
                    fullWidth
                    value={newUser.country_code}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        country_code: e.target.value,
                      }))
                    }
                  >
                    {countryCodes.map((country) => (
                      <MenuItem key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Telefon"
                    fullWidth
                    value={newUser.phone_number}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        phone_number: e.target.value,
                      }))
                    }
                  />
                </Grid>
              </Grid>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{
                  mt: 4,
                  padding: "12px",
                  fontSize: "16px",
                  textTransform: "none",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                onClick={handleAddUser}
              >
                Kullanıcı Ekle
              </Button>
            </Box>
          </Box>
        )}

        {/* Etkinlikler Bölümü */}
        {tabIndex === 1 && (
          <Box mt={3}>
            <Typography variant="h5" mb={2}>
              Etkinlik Yönetimi
            </Typography>

            {/* Etkinlik Listesi */}
            <Box mt={3}>
              {events.map((event) => (
                <Accordion key={event.event_id} sx={{ mb: 2 }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`event-${event.event_id}-content`}
                    id={`event-${event.event_id}-header`}
                  >
                    <Typography variant="h6">{event.title}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color="textSecondary" mb={1}>
                      <strong>Açıklama:</strong> {event.description}
                    </Typography>
                    <Typography color="textSecondary" mb={1}>
                      <strong>Lokasyon:</strong> {event.location}
                    </Typography>
                    <Typography color="textSecondary" mb={1}>
                      <strong>Kategori:</strong>{" "}
                      {event.category || "Belirtilmemiş"}
                    </Typography>
                    <Typography color="textSecondary" mb={1}>
                      <strong>Tarih:</strong>{" "}
                      {new Date(event.event_date).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </Typography>
                    <Typography color="textSecondary" mb={1}>
                      <strong>Kapasite:</strong> {event.max_capacity}
                    </Typography>
                    <Box mt={2}>
                      <Button
                        variant="outlined"
                        color="primary"
                        sx={{ mr: 1 }}
                        onClick={() => setEditEvent(event)}
                      >
                        Güncelle
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteEvent(event.event_id)}
                      >
                        Sil
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>

            {/* Etkinlik Ekleme Formu */}
            <Box
              mt={5}
              p={3}
              sx={{
                backgroundColor: "#f9f9f9",
                borderRadius: 3,
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                border: "1px solid #ddd",
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Yeni Etkinlik Ekle
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Etkinlik Adı"
                    fullWidth
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Kategori"
                    select
                    fullWidth
                    value={newEvent.category || ""}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  >
                    {[
                      "Konser",
                      "Teknoloji",
                      "Spor",
                      "Sanat",
                      "Eğitim",
                      "Sosyal Sorumluluk",
                      "Yemek",
                      "Eğlence",
                    ].map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Lokasyon"
                    fullWidth
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Tarih"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent((prev) => ({ ...prev, date: e.target.value }))
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
                    value={newEvent.ticket_price || ""}
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
                color="primary"
                fullWidth
                sx={{
                  mt: 4,
                  padding: "12px",
                  fontSize: "16px",
                  textTransform: "none",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                onClick={handleAddEvent}
              >
                Etkinlik Ekle
              </Button>
            </Box>

            {/* Etkinlik Güncelleme Modal */}
            {editEvent && (
              <Modal
                open={Boolean(editEvent)}
                onClose={() => setEditEvent(null)}
                aria-labelledby="edit-event-modal"
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "90%",
                    maxWidth: "600px",
                    backgroundColor: "#fff",
                    p: 4,
                    borderRadius: 2,
                    boxShadow: 24,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    Etkinlik Güncelle
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Etkinlik Adı"
                        fullWidth
                        value={editEvent.title || ""}
                        onChange={(e) =>
                          setEditEvent((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Kategori"
                        select
                        fullWidth
                        value={editEvent.category || ""}
                        onChange={(e) =>
                          setEditEvent((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                      >
                        {[
                          "Konser",
                          "Teknoloji",
                          "Spor",
                          "Sanat",
                          "Eğitim",
                          "Sosyal Sorumluluk",
                          "Yemek",
                          "Eğlence",
                        ].map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Açıklama"
                        fullWidth
                        value={editEvent.description || ""}
                        onChange={(e) =>
                          setEditEvent((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Lokasyon"
                        fullWidth
                        value={editEvent.location || ""}
                        onChange={(e) =>
                          setEditEvent((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Tarih"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        value={editEvent?.event_date || ""}
                        onChange={(e) =>
                          setEditEvent((prev) => ({
                            ...prev,
                            event_date: e.target.value, // Tarihi doğrudan al
                          }))
                        }
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Kapasite"
                        type="number"
                        fullWidth
                        value={editEvent.max_capacity || ""}
                        onChange={(e) =>
                          setEditEvent((prev) => ({
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
                        value={editEvent.ticket_price || ""}
                        onChange={(e) =>
                          setEditEvent((prev) => ({
                            ...prev,
                            ticket_price: e.target.value,
                          }))
                        }
                      />
                    </Grid>
                  </Grid>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 4 }}
                    onClick={handleUpdateEvent}
                  >
                    Güncelle
                  </Button>
                </Box>
              </Modal>
            )}
          </Box>
        )}
        {/* Mesajlar Bölümü */}
        {tabIndex === 2 && (
          <Box mt={3}>
            <Typography variant="h5" mb={2}>
              Gelen Mesajlar
            </Typography>
            <List>
              {Object.entries(groupedMessages).map(([userId, user]) => (
                <ListItem
                  button
                  key={userId}
                  onClick={() => setSelectedMessages(user.messages)} // Mesajları kaydet
                  sx={{
                    borderBottom: "1px solid #ddd",
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {user.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {user.email}
                    </Typography>
                  </Box>
                  <Typography color="textSecondary">
                    {user.messages.length} Mesaj
                  </Typography>
                </ListItem>
              ))}
            </List>

            {/* Modal Bileşeni */}
            <Modal
              open={Boolean(selectedMessages)}
              onClose={() => setSelectedMessages(null)}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "80%",
                  maxHeight: "90%",
                  overflowY: "auto",
                  backgroundColor: "#fff",
                  borderRadius: 4,
                  p: 4,
                  boxShadow: 24,
                }}
              >
                {selectedMessages?.map((msg) => (
                  <Box key={msg.id} sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">
                      {msg.subject || "Konu Belirtilmemiş"}
                    </Typography>
                    <Typography>{msg.content}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(msg.sentAt).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
                <Button
                  variant="contained"
                  onClick={() => setSelectedMessages(null)}
                  sx={{ mt: 2 }}
                >
                  Kapat
                </Button>
              </Box>
            </Modal>
          </Box>
        )}
      </Container>
    </>
  );
};

export default AdminSayfasi;
