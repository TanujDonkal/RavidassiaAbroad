// src/App.js
import React, { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

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
const MatrimonyListings = lazy(() => import("./pages/MatrimonyListings"));
const MatrimonyProfileDetail = lazy(() => import("./pages/MatrimonyProfileDetail"));
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
const StudentsHub = lazy(() => import("./pages/StudentsHub"));
const StudentsTests = lazy(() => import("./pages/StudentsTests"));
const StudentExamDashboard = lazy(() => import("./pages/StudentExamDashboard"));
const StudentVariantDashboard = lazy(() => import("./pages/StudentVariantDashboard"));
const StudentTestList = lazy(() => import("./pages/StudentTestList"));
const StudentTestOverview = lazy(() => import("./pages/StudentTestOverview"));
const StudentTestRunner = lazy(() => import("./pages/StudentTestRunner"));
const StudentAttemptHistory = lazy(() => import("./pages/StudentAttemptHistory"));
const StudentAttemptResult = lazy(() => import("./pages/StudentAttemptResult"));

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
            <Route path="/matrimony" element={<MatrimonyListings />} />
            <Route
              path="/matrimony/post"
              element={
                <ProtectedRoute>
                  <MatrimonialForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/matrimony/my-profile"
              element={
                <ProtectedRoute>
                  <MatrimonialForm />
                </ProtectedRoute>
              }
            />
            <Route path="/matrimony/:id" element={<MatrimonyProfileDetail />} />
            <Route path="/matrimonial" element={<Navigate to="/matrimony" replace />} />
            <Route path="/matrimonial/post" element={<Navigate to="/matrimony/post" replace />} />
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
            <Route path="/students" element={<StudentsHub />} />
            <Route path="/students/tests" element={<StudentsTests />} />
            <Route
              path="/students/tests/:examSlug"
              element={
                <ProtectedRoute>
                  <StudentExamDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/tests/:examSlug/:variantSlug"
              element={
                <ProtectedRoute>
                  <StudentVariantDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/tests/:examSlug/tests"
              element={
                <ProtectedRoute>
                  <StudentTestList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/tests/:examSlug/tests/:testId"
              element={
                <ProtectedRoute>
                  <StudentTestOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/tests/:examSlug/tests/:testId/start"
              element={
                <ProtectedRoute>
                  <StudentTestRunner />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/tests/:examSlug/attempts"
              element={
                <ProtectedRoute>
                  <StudentAttemptHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/tests/:examSlug/attempts/:attemptId/result"
              element={
                <ProtectedRoute>
                  <StudentAttemptResult />
                </ProtectedRoute>
              }
            />
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
