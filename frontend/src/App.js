import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import HomePage from "./pages/HomePage";
import KullaniciSayfasi from "./pages/KullaniciSayfasi";
import Profil from "./pages/Profil";
import Biletlerim from "./pages/Biletlerim";
import Rezervasyonlarim from "./pages/Rezervasyonlarim";
import Destek from "./pages/Destek";
import Favoriler from "./pages/Favoriler";
import AdminSayfasi from "./pages/AdminSayfasi";
import EtkinlikEkle from "./pages/EtkinlikEkle";
import PaymentForm from "./pages/PaymentForm";
import EtkinlikYonetimi from "./pages/EtkinlikYonetimi";
import Mesajlar from "./pages/Mesajlar";

const stripePromise = loadStripe("YOUR_STRIPE_PUBLIC_KEY");

function PrivateRoute({ children, role }) {
  const userRole = localStorage.getItem("role");
  if (userRole === role) {
    return children;
  }
  return <Navigate to="/kullanici-sayfasi" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/kullanici-sayfasi" element={<KullaniciSayfasi />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/biletlerim" element={<Biletlerim />} />
        <Route path="/rezervasyonlarim" element={<Rezervasyonlarim />} />
        <Route path="/destek" element={<Destek />} />
        <Route path="/favoriler" element={<Favoriler />} />
        <Route path="/mesajlar" element={<Mesajlar />} />
        <Route path="/admin-sayfasi" element={<AdminSayfasi />} />
        <Route
          path="/etkinlik-yonetimi"
          element={
            <PrivateRoute role="organizer">
              <EtkinlikYonetimi />
            </PrivateRoute>
          }
        />
        <Route
          path="/odeme"
          element={
            <Elements stripe={stripePromise}>
              <PaymentForm />
            </Elements>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
