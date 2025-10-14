// src/App.js
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Service from "./pages/Service";
import Feature from "./pages/Feature";
import Countries from "./pages/Countries";
import Training from "./pages/Training";
import Testimonial from "./pages/Testimonial";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ConnectSCST from "./pages/connect-scst";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import GlobalLoader from "./components/GlobalLoader";
import { PopupProvider } from "./components/PopupProvider";
import MatrimonialForm from "./pages/MatrimonialForm";
import Profile from "./pages/Profile";
import FormSubmitOverlay from "./components/FormSubmitOverlay"; // ✅ new overlay

function ScrollAndInit() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    if (window.__initLegacy) window.__initLegacy();
  }, [pathname]);

  return null;
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // ✅ Show loader on route change
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 600); // show for 0.6s minimum
    return () => clearTimeout(timeout);
  }, [location]);

  // ✅ Intercept all API calls globally (for navigation/data fetch)
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        setLoading(true);
        const res = await originalFetch(...args);
        return res;
      } finally {
        setLoading(false);
      }
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <PopupProvider>
      {/* ✅ Global form submit overlay (only when any form submits) */}
      <FormSubmitOverlay />

      {/* 🌐 Global loader for route/API changes */}
      <GlobalLoader visible={loading} />

      {/* Scroll restoration */}
      <ScrollAndInit />

      {/* App routes */}
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="service" element={<Service />} />
          <Route path="feature" element={<Feature />} />
          <Route path="countries" element={<Countries />} />
          <Route path="training" element={<Training />} />
          <Route path="testimonial" element={<Testimonial />} />
          <Route path="contact" element={<Contact />} />
          <Route path="connect-scst" element={<ConnectSCST />} />
          <Route path="auth" element={<Auth />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/matrimonial" element={<MatrimonialForm />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </PopupProvider>
  );
}
