// src/App.js
import React, { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalLoader from "./components/GlobalLoader";
import { PopupProvider } from "./components/PopupProvider";
import FormSubmitOverlay from "./components/FormSubmitOverlay";
import ProtectedRoute from "./components/ProtectedRoute";
import Seo from "./components/Seo";
import { getMe } from "./utils/api";
import { clearStoredAuth, getStoredUser, setStoredUser } from "./utils/auth";
import {
  buildBreadcrumbSchema,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "./utils/seo";
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

function getStaticSeo(pathname) {
  const withBreadcrumb = (config, label) => ({
    ...config,
    structuredData: [
      ...(Array.isArray(config.structuredData)
        ? config.structuredData
        : config.structuredData
        ? [config.structuredData]
        : []),
      buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        ...(pathname === "/" ? [] : [{ name: label, path: pathname }]),
      ]),
    ],
  });

  const publicRoutes = {
    "/": {
      title: `${SITE_NAME} | Global Ravidassia Community Platform`,
      description:
        "Explore Ravidassia history, teachings, temples, blogs, community updates, student resources, and global Sangat connections.",
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          logo: DEFAULT_OG_IMAGE,
          sameAs: [
            "https://www.facebook.com/RavidassiaAbroad",
            "https://x.com/ravidassiabroad",
            "https://www.instagram.com/ravidassiaabroad/",
            "https://www.youtube.com/c/TheAmbedkarBrand",
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
          description:
            "Global Ravidassia community platform for culture, teachings, history, and community support.",
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is Ravidassia Abroad?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Ravidassia Abroad is a global community platform that shares history, teachings, temple directories, blogs, student resources, and cultural connections for the Ravidassia diaspora.",
              },
            },
            {
              "@type": "Question",
              name: "Can I find temples and community centers through this website?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. The website includes temple and community center discovery tools to help people connect with Sangat in different countries.",
              },
            },
            {
              "@type": "Question",
              name: "Does Ravidassia Abroad support students and families abroad?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. The platform includes student support, youth guidance, learning resources, and community information for families living abroad.",
              },
            },
          ],
        },
      ],
    },
    "/about": {
      title: `About Us | ${SITE_NAME}`,
      description:
        "Learn about Ravidassia Abroad, our mission, and how the platform supports the global Ravidassia community.",
    },
    "/contact": {
      title: `Contact Us | ${SITE_NAME}`,
      description:
        "Contact Ravidassia Abroad for support, privacy requests, community updates, and general questions.",
    },
    "/blogs": {
      title: `Blogs and Community News | ${SITE_NAME}`,
      description:
        "Read community news, updates, cultural articles, and diaspora stories from Ravidassia Abroad.",
      type: "blog",
    },
    "/connect-scst": {
      title: `Connect by Country | ${SITE_NAME}`,
      description:
        "Explore country-based connections, outreach, and support resources through the Ravidassia Abroad network.",
    },
    "/matrimony": {
      title: `Ravidassia Matrimony | ${SITE_NAME}`,
      description:
        "Browse Ravidassia matrimonial profiles and connect respectfully through the Ravidassia Abroad matrimony platform.",
    },
    "/personalities": {
      title: `Famous Personalities | ${SITE_NAME}`,
      description:
        "Discover inspiring personalities, biographies, and contributions connected to Ravidassia history and identity.",
    },
    "/temples-globally": {
      title: `Temples Globally | ${SITE_NAME}`,
      description:
        "Find Shri Guru Ravidass Sabhas, temples, and community centers across countries through the global directory.",
    },
    "/students": {
      title: `Students Hub | ${SITE_NAME}`,
      description:
        "Access student resources, learning paths, and community support designed for youth and families abroad.",
    },
    "/countries": {
      title: `Countries and Global Presence | ${SITE_NAME}`,
      description:
        "Explore the global presence of the Ravidassia community across Canada, the UK, the USA, India, and more.",
    },
    "/feature": {
      title: `Community Features | ${SITE_NAME}`,
      description:
        "See the key features of Ravidassia Abroad including teachings, community support, global updates, and directories.",
    },
    "/service": {
      title: `Community Services | ${SITE_NAME}`,
      description:
        "Explore the services, resources, and support areas provided through the Ravidassia Abroad platform.",
    },
    "/testimonial": {
      title: `Testimonials | ${SITE_NAME}`,
      description:
        "Read testimonials and reflections from community members using Ravidassia Abroad.",
    },
    "/training": {
      title: `Programs and Learning | ${SITE_NAME}`,
      description:
        "Discover programs, guidance, and learning opportunities for youth, families, and the wider community.",
    },
    "/privacy-policy": {
      title: `Privacy Policy | ${SITE_NAME}`,
      description:
        "Review the privacy policy for Ravidassia Abroad and learn how personal data is handled.",
    },
    "/terms-of-use": {
      title: `Terms of Use | ${SITE_NAME}`,
      description:
        "Read the terms of use for accessing and participating in the Ravidassia Abroad platform.",
    },
    "/community-guidelines": {
      title: `Community Guidelines | ${SITE_NAME}`,
      description:
        "Understand the community guidelines that help keep Ravidassia Abroad respectful, safe, and useful.",
    },
    "/privacy-data-request": {
      title: `Privacy and Data Request | ${SITE_NAME}`,
      description:
        "Submit privacy-related questions or data requests through the Ravidassia Abroad compliance process.",
    },
    "/auth": {
      title: `Sign In | ${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      robots: "noindex,nofollow",
    },
    "/forgot-password": {
      title: `Forgot Password | ${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      robots: "noindex,nofollow",
    },
  };

  if (publicRoutes[pathname]) {
    const label = publicRoutes[pathname].title.split(" | ")[0];
    return withBreadcrumb(
      { canonicalPath: pathname, ...publicRoutes[pathname] },
      label
    );
  }

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/students/tests") ||
    pathname.startsWith("/matrimony/post") ||
    pathname.startsWith("/matrimony/my-profile")
  ) {
    return {
      title: `${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      canonicalPath: pathname,
      robots: "noindex,nofollow",
    };
  }

  if (pathname.startsWith("/blogs/")) {
    return {
      title: `Community Blog | ${SITE_NAME}`,
      description:
        "Read the latest article from Ravidassia Abroad community news and updates.",
      canonicalPath: pathname,
      type: "article",
      structuredData: buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Blogs", path: "/blogs" },
      ]),
    };
  }

  if (pathname.startsWith("/articles/")) {
    return {
      title: `Article | ${SITE_NAME}`,
      description:
        "Read teachings, history, and reference articles published on Ravidassia Abroad.",
      canonicalPath: pathname,
      type: "article",
      structuredData: buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "History", path: "/history" },
      ]),
    };
  }

  return {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    canonicalPath: pathname,
  };
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const staticSeo = getStaticSeo(location.pathname);

  // ✅ Show loader on route change
  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timeout);
  }, [location]);

  useEffect(() => {
    if (!getStoredUser()?.id) {
      return;
    }

    let cancelled = false;

    getMe()
      .then((data) => {
        if (!cancelled && data?.user) {
          setStoredUser(data.user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearStoredAuth();
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ErrorBoundary>
      <PopupProvider>
        <FormSubmitOverlay />
        <GlobalLoader visible={loading} />
        <ScrollAndInit />
        <Seo {...staticSeo} />

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
