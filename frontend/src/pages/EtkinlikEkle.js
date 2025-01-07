import React, { useState } from "react";
import axios from "axios";

const EtkinlikEkle = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://localhost:3000/api/events",
        {
          title,
          description,
          location,
          event_date: eventDate,
          max_capacity: maxCapacity,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Etkinlik başarıyla eklendi!");
    } catch (error) {
      console.error("Etkinlik eklenirken hata oluştu:", error);
      alert("Etkinlik eklenirken bir hata oluştu.");
    }
  };

  return (
    <div>
      <h2>Etkinlik Ekle</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Başlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Açıklama"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Yer"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        <input
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Maksimum Kapasite"
          value={maxCapacity}
          onChange={(e) => setMaxCapacity(e.target.value)}
          required
        />
        <button type="submit">Etkinlik Ekle</button>
      </form>
    </div>
  );
};

export default EtkinlikEkle;
