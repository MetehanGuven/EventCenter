import React, { useState, useEffect } from "react";
import axios from "axios";

const EtkinlikListesi = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await axios.get("http://localhost:3000/api/events");
      setEvents(response.data);
    };

    fetchEvents();
  }, []);

  return (
    <div>
      <h2>Yaklaşan Etkinlikler</h2>
      <ul>
        {events.map((event) => (
          <li key={event.event_id}>{event.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default EtkinlikListesi;
