// src/App.js
import React, { useEffect } from "react";
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

function ScrollAndInit() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top on each route change
    window.scrollTo(0, 0);

    // Re-init template JS plugins (Owl, WOW, CounterUp, etc.)
    if (window.__initLegacy) {
      window.__initLegacy();
    }
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollAndInit />
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
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
