const express = require("express");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cron = require("node-cron");

// Her gece 3'te çalışır
cron.schedule("0 3 * * *", async () => {
  try {
    const result = await pool.query(`
      DELETE FROM reservations
      WHERE event_id IN (
        SELECT event_id
        FROM events
        WHERE event_date <= NOW() + INTERVAL '3 days'
      )
    `);

    console.log(`Otomatik iptal edilen rezervasyon sayısı: ${result.rowCount}`);
  } catch (error) {
    console.error("Otomatik iptal işlemi sırasında hata:", error);
  }
});

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(express.json());
app.use(cors());

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(403).send("Token bulunamadı");
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send("Geçersiz token");
    }

    // Kullanıcı bilgilerini req.user'a ekle
    req.user = decoded;
    next();
  });
};

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  // Eğer giriş bilgileri admin ise admin girişini kontrol et
  if (email === "admin" && password === "admin") {
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });
    return res.status(200).json({
      message: "Admin girişi başarılı.",
      token,
      role: "admin",
    });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).send("Geçersiz kullanıcı adı veya şifre");
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).send("Geçersiz kullanıcı adı veya şifre");
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Giriş başarılı.",
      token,
      user_id: user.user_id,
      role: user.role,
    });
  } catch (error) {
    console.error("Giriş sırasında hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

// Kullanıcı bilgilerini alma
app.get("/api/users/:user_id", verifyToken, async (req, res) => {
  const { user_id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [
      user_id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).send("Kullanıcı bulunamadı");
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Kullanıcı bilgileri alınırken hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

app.get("/api/events", async (req, res) => {
  const { category } = req.query;

  try {
    let query = `
      SELECT event_id, title, description, location, event_date, max_capacity, ticket_price, category
      FROM events
    `;
    const params = [];

    if (category) {
      query += " WHERE category = $1";
      params.push(category); // Kategori filtreleme
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı." });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Etkinlikler alınırken hata oluştu:", err);
    res.status(500).send("Sunucu hatası.");
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query("SELECT DISTINCT category FROM events");
    res.status(200).json(result.rows.map((row) => row.category));
  } catch (error) {
    console.error("Kategoriler alınırken hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

app.get("/api/organizer/events", verifyToken, async (req, res) => {
  try {
    // Sadece organizer rolüne sahip kullanıcılar erişebilir
    if (req.user.role !== "organizer") {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok." });
    }

    const result = await pool.query(
      "SELECT * FROM events WHERE organizer_id = $1",
      [req.user.user_id]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Organizatör etkinlikleri alınırken hata oluştu:", err);
    res.status(500).send("Server error");
  }
});

app.post("/api/events", verifyToken, async (req, res) => {
  const {
    title,
    description,
    location,
    event_date,
    max_capacity,
    ticket_price,
    category, // Kategori alanı kontrol edilecek
  } = req.body;

  // Kullanıcı rol kontrolü (admin veya organizer olmalı)
  if (req.user.role !== "admin" && req.user.role !== "organizer") {
    return res.status(403).send("Bu işlem için yetkiniz yok.");
  }

  // Gerekli alanların kontrolü
  if (!title) {
    console.error("Etkinlik adı eksik.");
    return res.status(400).send("Etkinlik adı eksik.");
  }
  if (!event_date) {
    console.error("Etkinlik tarihi eksik. Gelen veri:", req.body);
    return res.status(400).send("Etkinlik tarihi eksik.");
  }

  // Tarih formatını kontrol edin
  const isValidDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);
  if (!isValidDate(event_date)) {
    console.error("Etkinlik tarihi geçersiz formatta:", event_date);
    return res
      .status(400)
      .send("Geçersiz tarih formatı. Lütfen YYYY-MM-DD kullanın.");
  }

  if (!category) {
    console.error("Kategori eksik.");
    return res.status(400).send("Kategori eksik.");
  }
  if (ticket_price === undefined || ticket_price === "") {
    console.error("Bilet fiyatı eksik.");
    return res.status(400).send("Bilet fiyatı eksik.");
  }

  try {
    const query = `
      INSERT INTO events 
      (title, description, location, event_date, max_capacity, ticket_price, category, organizer_id, created_at, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'pending')
      RETURNING *`;
    const values = [
      title,
      description,
      location,
      event_date,
      max_capacity,
      ticket_price,
      category, // Kategori burada ekleniyor
      req.user.user_id, // Organizator ID'si
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Etkinlik eklenirken hata oluştu:", error);
    res.status(500).send("Sunucu hatası.");
  }
});

app.post("/api/events/:id/discount", verifyToken, async (req, res) => {
  const { id } = req.params; // Etkinlik ID
  const { discount } = req.body; // İndirim yüzdesi (örneğin: 20)

  if (req.user.role !== "organizer" && req.user.role !== "admin") {
    return res.status(403).send("Bu işlem için yetkiniz yok.");
  }

  try {
    // Etkinliğin organizatörü olduğunu kontrol et
    const event = await pool.query(
      "SELECT * FROM events WHERE event_id = $1 AND organizer_id = $2",
      [id, req.user.user_id]
    );

    if (event.rows.length === 0) {
      return res.status(404).send("Bu etkinliği düzenleme yetkiniz yok.");
    }

    const old_Price = event.rows[0].ticket_price; // Eski fiyat
    const new_Price = (oldPrice * (1 - discount / 100)).toFixed(2); // Yeni fiyat

    // Fiyatı güncelle
    const updatedEvent = await pool.query(
      "UPDATE events SET ticket_price = $1 WHERE event_id = $2 RETURNING *",
      [new_Price, id]
    );

    // Tüm kullanıcılara bildirim gönder
    const users = await pool.query(
      "SELECT user_id FROM users WHERE role != 'organizer'"
    );
    const messages = users.rows.map((user) => [
      user.user_id,
      `${updatedEvent.rows[0].title} etkinliğinde yeni bilet fiyatı: ${newPrice}₺`,
    ]);

    const messageInsertQuery =
      "INSERT INTO messages (user_id, message, sent_at) VALUES ($1, $2, NOW()), FALSE";
    for (const [userId, message] of messages) {
      await pool.query(messageInsertQuery, [userId, message]);
    }

    res.status(200).json(updatedEvent.rows[0]);
  } catch (error) {
    console.error("Fiyat değişikliği sırasında hata oluştu:", error);
    res.status(500).send("Sunucu hatası.");
  }
});

// Kullanıcı listesini alma
app.get("/api/users", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Bu işlem için yetkiniz yok." });
  }

  try {
    const result = await pool.query("SELECT * FROM users");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Kullanıcılar alınırken hata oluştu:", err);
    res.status(500).send("Server error");
  }
});

// Kullanıcı silme
app.delete("/api/users/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Bu işlem için yetkiniz yok." });
  }

  try {
    // İlgili ilişkili verileri sil
    await pool.query("DELETE FROM events WHERE organizer_id = $1", [id]);
    await pool.query("DELETE FROM favorites WHERE user_id = $1", [id]);
    await pool.query("DELETE FROM tickets WHERE user_id = $1", [id]);
    await pool.query("DELETE FROM reservations WHERE user_id = $1", [id]);

    // Kullanıcıyı sil
    const result = await pool.query(
      "DELETE FROM users WHERE user_id = $1 RETURNING *",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    res.status(200).json({ message: "Kullanıcı başarıyla silindi." });
  } catch (err) {
    console.error("Kullanıcı silinirken hata oluştu:", err);
    res.status(500).send("Server error");
  }
});

app.delete("/api/events/:eventId", async (req, res) => {
  const { eventId } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM events WHERE event_id = $1 RETURNING *",
      [eventId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı" });
    }
    res.status(200).json({ message: "Etkinlik başarıyla silindi" });
  } catch (error) {
    console.error("Etkinlik silinirken hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

app.put("/api/messages/:messageId/read", verifyToken, async (req, res) => {
  const { messageId } = req.params;

  try {
    const result = await pool.query(
      "UPDATE messages SET is_read = TRUE WHERE message_id = $1 AND user_id = $2 RETURNING *",
      [messageId, req.user.user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Mesaj bulunamadı." });
    }

    res
      .status(200)
      .json({ message: "Mesaj başarıyla okundu olarak işaretlendi." });
  } catch (error) {
    console.error("Mesaj durumu güncellenirken hata oluştu:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

app.get("/api/notifications", verifyToken, async (req, res) => {
  try {
    // Eğer req.user.user_id yoksa, kullanıcıyı email ile bulabilirsiniz
    if (!req.user.user_id) {
      const userResult = await pool.query(
        "SELECT user_id FROM users WHERE email = $1",
        [req.user.email]
      );
      if (userResult.rows.length === 0) {
        return res.status(404).send("Kullanıcı bulunamadı.");
      }
      req.user.user_id = userResult.rows[0].user_id; // user_id'yi req.user'a ekle
    }

    const result = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.user_id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Bildirimler alınırken hata oluştu:", error);
    res.status(500).send("Sunucu hatası.");
  }
});

app.put("/api/events/:id/date", verifyToken, async (req, res) => {
  const { id } = req.params; // Etkinlik ID
  const { new_date } = req.body; // Yeni tarih bilgisi

  try {
    // Etkinliği kontrol et
    const eventResult = await pool.query(
      "SELECT * FROM events WHERE event_id = $1",
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı." });
    }

    const event = eventResult.rows[0];

    // Sadece etkinliğin organizatörü değiştirebilir
    if (
      req.user.role === "organizer" &&
      event.organizer_id !== req.user.user_id
    ) {
      return res
        .status(403)
        .json({ message: "Bu etkinliği düzenleme yetkiniz yok." });
    }

    // Tarihi güncelle
    await pool.query("UPDATE events SET event_date = $1 WHERE event_id = $2", [
      new_date,
      id,
    ]);

    res.status(200).json({
      message: "Etkinlik tarihi başarıyla güncellendi.",
    });
  } catch (error) {
    console.error("Tarih güncellenirken hata oluştu:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

app.put("/api/notifications/:id/read", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.user_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).send("Bildirim bulunamadı.");
    }
    res.status(200).send("Bildirim okundu olarak işaretlendi.");
  } catch (error) {
    console.error("Bildirim güncellenirken hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

app.put("/api/events/:id/price", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { new_price } = req.body;

  try {
    // Etkinliği kontrol et
    const eventResult = await pool.query(
      "SELECT * FROM events WHERE event_id = $1",
      [id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı." });
    }

    const event = eventResult.rows[0];
    const oldPrice = event.ticket_price; // Güncelleme öncesinde eski fiyatı al

    // Kullanıcı yetkisini kontrol et
    if (
      req.user.role === "organizer" &&
      event.organizer_id !== req.user.user_id
    ) {
      return res
        .status(403)
        .json({ message: "Bu etkinliği düzenleme yetkiniz yok." });
    }

    if (req.user.role !== "admin" && req.user.role !== "organizer") {
      return res.status(403).json({ message: "Bu işlem için yetkiniz yok." });
    }

    // Fiyatı güncelle
    await pool.query(
      "UPDATE events SET ticket_price = $1 WHERE event_id = $2",
      [new_price, id]
    );

    // Bildirim ekle
    const organizerId = req.user.role === "admin" ? null : req.user.user_id;

    // Yeni fiyatı kontrol et
    if (!new_price) {
      throw new Error("Yeni fiyat bilgisi eksik");
    }

    await pool.query(
      `
      INSERT INTO notifications (organizer_id, event_id, title, old_price, new_price, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      `,
      [organizerId, id, event.title, oldPrice, new_price]
    );

    // Kullanıcı bildirimleri için tüm kullanıcıları al
    const usersResult = await pool.query("SELECT user_id FROM users");

    const notificationInsertQuery = `
      INSERT INTO notifications 
      (user_id, event_id, message, organizer_id, title, old_price, new_price, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;

    for (const user of usersResult.rows) {
      const userId = user.user_id;
      const notificationMessage = `${event.title} etkinliğinin yeni fiyatı: ~${oldPrice}₺~ ${new_price}₺`;
      await pool.query(notificationInsertQuery, [
        userId, // user_id
        id, // event_id
        notificationMessage, // message
        organizerId, // organizer_id (admin ise null)
        event.title, // title
        oldPrice, // old_price
        new_price, // new_price
      ]);
    }

    res.status(200).json({
      message: "Fiyat başarıyla güncellendi ve bildirimler gönderildi.",
    });
  } catch (error) {
    console.error("Fiyat güncellenirken hata oluştu:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

app.get("/api/notifications", verifyToken, async (req, res) => {
  try {
    // Kullanıcıya ait bildirimleri çek
    const result = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Henüz bildiriminiz yok." });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Bildirimler alınırken hata oluştu:", error);
    res.status(500).send("Sunucu hatası.");
  }
});

app.put("/api/notifications/:id/read", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Bildirim bulunamadı." });
    }

    res.status(200).json({ message: "Bildirim okundu olarak işaretlendi." });
  } catch (error) {
    console.error("Bildirim güncellenirken hata oluştu:", error);
    res.status(500).send("Sunucu hatası.");
  }
});

app.get("/api/messages/unread", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) AS unread_count FROM messages WHERE user_id = $1 AND is_read = FALSE",
      [req.user.user_id]
    );
    res.status(200).json({ unread_count: result.rows[0].unread_count });
  } catch (error) {
    console.error("Okunmamış mesajlar alınırken hata oluştu:", error);
    res.status(500).send("Sunucu hatası.");
  }
});

// Etkinlik güncelleme
app.put("/api/events/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    location,
    event_date,
    max_capacity,
    ticket_price,
    category, // Kategori burada güncellenecek
  } = req.body;

  // Kullanıcı rol kontrolü
  if (req.user.role !== "admin" && req.user.role !== "organizer") {
    return res.status(403).json({ message: "Bu işlem için yetkiniz yok." });
  }

  try {
    const query = `
      UPDATE events
      SET 
        title = COALESCE($1, title), 
        description = COALESCE($2, description), 
        location = COALESCE($3, location), 
        event_date = COALESCE($4, event_date), 
        max_capacity = COALESCE($5, max_capacity), 
        ticket_price = COALESCE($6, ticket_price), 
        category = COALESCE($7, category) -- Kategori güncelleniyor
      WHERE event_id = $8
      RETURNING *`;

    const values = [
      title,
      description,
      location,
      event_date,
      max_capacity,
      ticket_price,
      category, // Kategori burada
      id,
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı." });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Etkinlik güncellenirken hata oluştu:", err);
    res.status(500).send("Sunucu hatası.");
  }
});

const multer = require("multer");
const path = require("path");

// Multer için yükleme ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Yükleme klasörü
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Profil resmi yükleme rotası
app.post(
  "/api/users/:user_id/upload",
  upload.single("profile_picture"),
  async (req, res) => {
    const { user_id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "Dosya yüklenemedi." });
    }

    const profilePictureUrl = `/uploads/${req.file.filename}`;

    try {
      await pool.query(
        "UPDATE users SET profile_picture_url = $1 WHERE user_id = $2",
        [profilePictureUrl, user_id]
      );
      res.status(200).json({ profile_picture_url: profilePictureUrl });
    } catch (error) {
      console.error("Profil resmi güncellenirken hata oluştu:", error);
      res.status(500).json({ message: "Profil resmi güncellenemedi." });
    }
  }
);

// Kullanıcının favorilerine etkinlik ekleme
app.post("/api/favorites", verifyToken, async (req, res) => {
  const user_id = req.user.user_id; // Token'dan user_id alın
  const { event_id } = req.body;

  if (!event_id) {
    return res.status(400).json({ error: "event_id is required" });
  }

  try {
    await pool.query(
      "INSERT INTO favorites (user_id, event_id) VALUES ($1, $2)",
      [user_id, event_id]
    );
    res.status(201).send("Favorilere eklendi.");
  } catch (error) {
    console.error("Favorilere eklenirken hata oluştu:", error);
    res.status(500).json({ error: "Favorilere eklenirken hata oluştu" });
  }
});

app.delete("/api/favorites/:event_id", verifyToken, async (req, res) => {
  const { event_id } = req.params;
  const user_id = req.user.user_id;

  try {
    const query =
      "DELETE FROM favorites WHERE user_id = $1 AND event_id = $2 RETURNING *";
    const values = [user_id, event_id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Favori bulunamadı." });
    }

    res.status(200).json({ message: "Favori başarıyla kaldırıldı." });
  } catch (error) {
    console.error("Favorilerden çıkarılırken hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

// Kullanıcının tüm favori etkinliklerini getirme
app.get("/api/favorites", verifyToken, async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const query =
      "SELECT events.* FROM favorites INNER JOIN events ON favorites.event_id = events.event_id WHERE favorites.user_id = $1";
    const values = [user_id];
    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Favoriler alınırken hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

// Admin'e mesaj gönderme
app.post("/api/messages", verifyToken, async (req, res) => {
  const { message } = req.body;
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      "INSERT INTO messages (user_id, message) VALUES ($1, $2) RETURNING *",
      [userId, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Mesaj gönderilirken hata oluştu:", err);
    res.status(500).send("Server error");
  }
});

app.get("/api/messages", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).send("Bu işlem için yetkiniz yok.");
  }

  try {
    const query = `
      SELECT m.message_id, m.message, m.subject, m.sent_at, u.user_id, u.name, u.email
      FROM messages m
      INNER JOIN users u ON m.user_id = u.user_id
      ORDER BY m.sent_at DESC
    `;
    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Mesaj bulunamadı." });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Mesajlar alınırken hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

app.use("/uploads", express.static("uploads"));

app.put("/api/users/profile", verifyToken, async (req, res) => {
  const { name, surname, email, birthdate, phone_number, password } = req.body;

  try {
    // Eğer şifre güncelleniyorsa, hashleyin
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const query = `
      UPDATE users 
      SET 
        name = COALESCE($1, name), 
        surname = COALESCE($2, surname), 
        email = COALESCE($3, email), 
        birthdate = COALESCE($4, birthdate),
        phone_number = COALESCE($5, phone_number), 
        password = COALESCE($6, password)
      WHERE user_id = $7 
      RETURNING *`;
    const values = [
      name,
      surname,
      email,
      birthdate,
      phone_number,
      hashedPassword,
      req.user.user_id,
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Profil güncellenirken hata oluştu:", err);
    res.status(500).send("Server error");
  }
});

app.get("/api/tickets", verifyToken, async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const query = `
      SELECT t.ticket_id, t.purchase_date, t.price, e.title, e.event_date, e.location
      FROM tickets t
      INNER JOIN events e ON t.event_id = e.event_id
      WHERE t.user_id = $1
    `;
    const values = [user_id];
    const result = await pool.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Biletler alınırken hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

app.delete("/api/tickets/:ticketId", verifyToken, async (req, res) => {
  const { ticketId } = req.params;
  const user_id = req.user.user_id;

  try {
    // Bileti bulun ve silin
    const ticketResult = await pool.query(
      "DELETE FROM tickets WHERE ticket_id = $1 AND user_id = $2 RETURNING *",
      [ticketId, user_id]
    );

    if (ticketResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Bilet bulunamadı veya yetkiniz yok." });
    }

    // Etkinliğin kapasitesini artırın
    await pool.query(
      "UPDATE events SET max_capacity = max_capacity + 1 WHERE event_id = $1",
      [ticketResult.rows[0].event_id]
    );

    res.status(200).json({ message: "Bilet başarıyla iptal edildi." });
  } catch (error) {
    console.error("Bilet iptali sırasında hata oluştu:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

app.get("/api/past-events", verifyToken, async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const query = `
      SELECT e.event_id, e.title, e.description, e.event_date, e.location
      FROM tickets t
      INNER JOIN events e ON t.event_id = e.event_id
      WHERE t.user_id = $1 AND e.event_date < CURRENT_DATE
    `;
    const values = [user_id];
    const result = await pool.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Geçmiş etkinlikler alınırken hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

// Rezervasyon oluşturma
app.post("/api/reservations", verifyToken, async (req, res) => {
  const { event_id } = req.body;
  const user_id = req.user.user_id;

  try {
    const eventQuery = await pool.query(
      "SELECT max_capacity, event_date FROM events WHERE event_id = $1",
      [event_id]
    );

    if (eventQuery.rows.length === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı." });
    }

    const { max_capacity, event_date } = eventQuery.rows[0];
    if (new Date(event_date) < new Date()) {
      return res
        .status(400)
        .json({ message: "Geçmiş bir etkinlik için rezervasyon yapılamaz." });
    }

    if (max_capacity <= 0) {
      return res.status(400).json({ message: "Etkinlikte yer kalmadı." });
    }

    const existingReservation = await pool.query(
      "SELECT * FROM reservations WHERE user_id = $1 AND event_id = $2",
      [user_id, event_id]
    );

    if (existingReservation.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Bu etkinlik için zaten rezervasyon yapmışsınız." });
    }

    const insertReservation = await pool.query(
      "INSERT INTO reservations (user_id, event_id) VALUES ($1, $2) RETURNING *",
      [user_id, event_id]
    );

    await pool.query(
      "UPDATE events SET max_capacity = max_capacity - 1 WHERE event_id = $1",
      [event_id]
    );

    res.status(201).json({
      message: "Rezervasyon başarıyla oluşturuldu.",
      reservation: insertReservation.rows[0],
    });
  } catch (error) {
    console.error("Rezervasyon oluşturulurken hata:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

app.post("/api/support", verifyToken, async (req, res) => {
  const { subject, message } = req.body;
  const user_id = req.user.user_id;

  try {
    const query = `
      INSERT INTO messages (user_id, subject, message, sent_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const values = [user_id, subject, message];
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Mesaj gönderilirken hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

app.get("/api/support", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).send("Bu işlem için yetkiniz yok.");
  }

  try {
    const query = `
      SELECT m.message_id, m.message, m.sent_at, u.name, u.email
      FROM messages m
      INNER JOIN users u ON m.user_id = u.user_id
      ORDER BY m.sent_at DESC
    `;
    const result = await pool.query(query);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Mesajlar alınırken hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

app.put("/api/users/:id", verifyToken, async (req, res) => {
  const { id } = req.params; // Kullanıcı ID'si
  const { role } = req.body; // Yeni rol bilgisi

  // Yalnızca admin yetkisine sahip kullanıcılar "role" alanını değiştirebilir
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Bu işlem için yetkiniz yok." });
  }

  try {
    // Kullanıcı rolünü güncelleme sorgusu
    const query = `
      UPDATE users 
      SET role = $1 
      WHERE user_id = $2 
      RETURNING *`;
    const values = [role, id];

    console.log("Executing query:", query, "with values:", values);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      console.log("No user found for the given ID.");
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }

    console.log("Role update successful:", result.rows[0]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Kullanıcı güncellenirken hata oluştu:", err);
    res.status(500).send("Server error");
  }
});

app.get("/api/users/reservations", verifyToken, async (req, res) => {
  const user_id = req.user.user_id;

  try {
    const query = `
      SELECT r.reservation_id, e.title, e.event_date, e.location
      FROM reservations r
      INNER JOIN events e ON r.event_id = e.event_id
      WHERE r.user_id = $1
    `;
    const values = [user_id];
    const result = await pool.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Rezervasyonlar alınırken hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

// Rezervasyon İptali
app.delete("/api/reservations/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Rezervasyonu kontrol et
    const reservationResult = await pool.query(
      "SELECT event_id FROM reservations WHERE reservation_id = $1",
      [id]
    );

    if (reservationResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Rezervasyon bulunamadı veya zaten silinmiş." });
    }

    const event_id = reservationResult.rows[0].event_id;

    // Rezervasyonu sil
    await pool.query("DELETE FROM reservations WHERE reservation_id = $1", [
      id,
    ]);

    // Kapasiteyi artır
    await pool.query(
      "UPDATE events SET max_capacity = max_capacity + 1 WHERE event_id = $1",
      [event_id]
    );

    res.status(200).json({ message: "Rezervasyon başarıyla iptal edildi!" });
  } catch (error) {
    console.error("Rezervasyon iptali sırasında hata oluştu:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

// Bilet satın alma ve rezervasyon iptali
app.post("/api/tickets", verifyToken, async (req, res) => {
  const { event_id, quantity } = req.body; // Adet bilgisini alıyoruz
  const user_id = req.user.user_id;

  if (!quantity || quantity < 1) {
    return res
      .status(400)
      .json({ message: "Geçerli bir adet belirtmelisiniz." });
  }

  try {
    // Etkinliğin kapasitesini kontrol et
    const eventResult = await pool.query(
      "SELECT max_capacity, ticket_price FROM events WHERE event_id = $1",
      [event_id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı." });
    }

    const { max_capacity, ticket_price } = eventResult.rows[0];
    if (max_capacity < quantity) {
      return res.status(400).json({
        message: `Yeterli kapasite yok. Maksimum ${max_capacity} bilet alabilirsiniz.`,
      });
    }

    // Bilet oluşturma
    const total_price = (ticket_price * quantity).toFixed(2);
    const ticketQuery = `
      INSERT INTO tickets (user_id, event_id, price, quantity)
      VALUES ($1, $2, $3, $4)
      RETURNING *`;
    const ticketValues = [user_id, event_id, total_price, quantity];

    const ticketResult = await pool.query(ticketQuery, ticketValues);

    // Kapasiteyi güncelle
    const capacityUpdateQuery = `
      UPDATE events
      SET max_capacity = max_capacity - $1
      WHERE event_id = $2
    `;
    await pool.query(capacityUpdateQuery, [quantity, event_id]);

    res.status(201).json({
      message: "Bilet(ler) başarıyla satın alındı.",
      ticket: ticketResult.rows[0],
    });
  } catch (error) {
    console.error("Bilet satın alma sırasında hata:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

// Rezervasyonları listeleme
app.get("/api/reservations", verifyToken, async (req, res) => {
  const user_id = req.user.user_id;

  try {
    if (!user_id) {
      return res.status(400).json({ message: "Kullanıcı ID eksik." });
    }

    const reservationsQuery = await pool.query(
      `SELECT r.reservation_id, r.event_id, e.title AS event_title, 
              e.location AS event_location, e.event_date 
       FROM reservations r
       INNER JOIN events e ON r.event_id = e.event_id
       WHERE r.user_id = $1`,
      [user_id]
    );

    if (reservationsQuery.rows.length === 0) {
      return res.status(404).json({ message: "Henüz rezervasyon yapılmamış." });
    }

    res.status(200).json(reservationsQuery.rows);
  } catch (error) {
    console.error("Rezervasyonlar alınırken hata oluştu:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

// Ödeme işlemi ve bilet oluşturma
app.post("/api/payments", verifyToken, async (req, res) => {
  const { event_id } = req.body;
  const user_id = req.user.user_id;

  try {
    // Etkinlikteki mevcut kapasiteyi kontrol et
    const eventResult = await pool.query(
      "SELECT max_capacity FROM events WHERE event_id = $1",
      [event_id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ message: "Etkinlik bulunamadı." });
    }

    const maxCapacity = eventResult.rows[0].max_capacity;

    if (maxCapacity <= 0) {
      return res
        .status(400)
        .json({ message: "Etkinlik kapasitesi dolmuş durumda." });
    }

    // Bileti oluştur
    const ticketPriceResult = await pool.query(
      "SELECT ticket_price FROM events WHERE event_id = $1",
      [event_id]
    );

    const ticketPrice = ticketPriceResult.rows[0].ticket_price;

    const ticketQuery = `
      INSERT INTO tickets (event_id, user_id, price)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const ticketValues = [event_id, user_id, ticketPrice];

    const ticketResult = await pool.query(ticketQuery, ticketValues);

    // Kapasiteyi azalt
    const capacityUpdateQuery = `
      UPDATE events
      SET max_capacity = max_capacity - 1
      WHERE event_id = $1
    `;
    await pool.query(capacityUpdateQuery, [event_id]);

    res.status(201).json(ticketResult.rows[0]);
  } catch (error) {
    console.error("Bilet alma sırasında hata oluştu:", error);
    res.status(500).send("Server error");
  }
});

// Kullanıcının kendi hesabını silme
app.delete("/api/delete-my-account", verifyToken, async (req, res) => {
  const userId = req.user.user_id; // Token'dan kullanıcı kimliği alınır

  try {
    // Kullanıcının verileriyle ilişkili tüm kayıtları sil
    await pool.query("DELETE FROM tickets WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM reservations WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM favorites WHERE user_id = $1", [userId]);

    // Kullanıcı hesabını sil
    const result = await pool.query(
      "DELETE FROM users WHERE user_id = $1 RETURNING *",
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    res.status(200).json({ message: "Hesabınız başarıyla silindi." });
  } catch (error) {
    console.error("Hesap silinirken hata oluştu:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

// Kullanıcı oluşturma
app.post("/api/users", async (req, res) => {
  const { name, surname, email, password, birthdate, phone_number } = req.body;

  try {
    // Kullanıcı var mı kontrol et
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: "E-posta zaten kullanılıyor." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (name, surname, email, password, birthdate, phone_number) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *`;
    const values = [
      name,
      surname,
      email,
      hashedPassword,
      birthdate,
      phone_number,
    ];
    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Kayıt başarılı.",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("Kayıt sırasında hata oluştu:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

// Sunucuyu başlat
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
