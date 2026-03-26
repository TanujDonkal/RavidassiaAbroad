// src/App.js
import React, { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalLoader from "./components/GlobalLoader";
import { PopupProvider } from "./components/PopupProvider";
import FormSubmitOverlay from "./components/FormSubmitOverlay";
import ProtectedRoute from "./components/ProtectedRoute";
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Service = lazy(() => import("./pages/Service"));
const Feature = lazy(() => import("./pages/Feature"));
const Countries = lazy(() => import("./pages/Countries"));
const Training = lazy(() => import("./pages/Training"));
const Testimonial = lazy(() => import("./pages/Testimonial"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ConnectSCST = lazy(() => import("./pages/connect-scst"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const MatrimonialForm = lazy(() => import("./pages/MatrimonialForm"));
const Profile = lazy(() => import("./pages/Profile"));
const Blogs = lazy(() => import("./pages/Blogs"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const DynamicPage = lazy(() => import("./pages/DynamicPage"));
const FamousPersonalities = lazy(() => import("./pages/FamousPersonalities"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const TemplesGlobally = lazy(() => import("./pages/temples-globally"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const PrivacyDataRequest = lazy(() => import("./pages/PrivacyDataRequest"));

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
    const timeout = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timeout);
  }, [location]);

  return (
    <ErrorBoundary>
      <PopupProvider>
        <FormSubmitOverlay />
        <GlobalLoader visible={loading} />
        <ScrollAndInit />

        <Suspense fallback={<GlobalLoader visible={true} />}>
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            {/* 🔒 Admin Dashboard Protected */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/matrimonial" element={<MatrimonialForm />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:slug" element={<BlogDetail />} />
            <Route path="/personalities" element={<FamousPersonalities />} />
            <Route path="/temples-globally" element={<TemplesGlobally />} />
            <Route path="/articles/:slug" element={<PostDetail />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-use" element={<TermsOfUse />} />
            <Route path="/community-guidelines" element={<CommunityGuidelines />} />
            <Route path="/privacy-data-request" element={<PrivacyDataRequest />} />
            {/* Catch-all: dynamic menu pages, then 404 */}
            <Route path="/*" element={<DynamicPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        </Suspense>
      </PopupProvider>
    </ErrorBoundary>
  );
}
