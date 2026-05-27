import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Seo from "../components/Seo";
import { apiFetch } from "../utils/api";
import { buildBreadcrumbSchema } from "../utils/seo";
import "../css/business-directory.css";
import "../css/SupportUs.css";

const supportAreas = [
  "Travel to temples and community centers for respectful documentation",
  "Video, interview, and documentary-style storytelling",
  "Website hosting, maintenance, moderation, and updates",
  "Student, family, and community resource development",
  "Preserving Ravidassia heritage through articles, temple records, and archives",
];

const supportOptions = [
  {
    title: "One-time Support",
    text: "Help fund documentation trips, research, and public resource building.",
  },
  {
    title: "Monthly Supporter",
    text: "We can set up deeper recurring partnerships once the first donation flow is live and stable.",
  },
  {
    title: "Sponsor a Temple Visit",
    text: "Support travel, filming, and verified temple/community coverage in a specific city or region.",
  },
  {
    title: "Contribute Information",
    text: "Share photos, corrections, history notes, contact details, and local community guidance.",
  },
];

const presetAmountsCad = [10, 25, 50, 100, 250];

function formatCad(amount) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SupportUs() {
  const location = useLocation();
  const donateSectionRef = useRef(null);
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const donationStatus = searchParams.get("donation");

  useEffect(() => {
    if (location.hash === "#donate" || donationStatus) {
      donateSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [location.hash, donationStatus]);

  const effectiveAmount = useMemo(() => {
    if (customAmount.trim()) {
      return Number(customAmount);
    }
    return selectedAmount;
  }, [customAmount, selectedAmount]);

  const handlePresetSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    setError("");
  };

  const handleDonate = async () => {
    setError("");
    const normalizedAmount = Math.round(Number(effectiveAmount) * 100) / 100;

    if (!Number.isFinite(normalizedAmount) || normalizedAmount < 5) {
      setError("Please choose or enter at least 5 CAD.");
      return;
    }

    if (normalizedAmount > 10000) {
      setError("For larger gifts above 10,000 CAD, please contact us directly.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiFetch("/donations/checkout-session", {
        method: "POST",
        body: JSON.stringify({ amountCad: normalizedAmount }),
      });

      if (response?.url) {
        window.location.assign(response.url);
        return;
      }

      setError("We could not open Stripe Checkout right now.");
    } catch (err) {
      setError(
        err?.message ||
          "We could not start the donation checkout right now. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="business-shell py-5">
      <Seo
        title="Support Ravidassia Abroad | World Guru Ravidass Journey"
        description="Support Ravidassia Abroad as we document temples, sangat, history, teachings, and community stories across the global diaspora."
        canonicalPath="/support-us"
        structuredData={[
          buildBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Support Us", path: "/support-us" },
          ]),
        ]}
      />

      <div className="container">
        <section className="business-hero mb-5">
          <span className="business-kicker">Community Mission</span>
          <div className="row align-items-center g-4 mt-1">
            <div className="col-lg-8">
              <h1 className="display-5 fw-bold mb-3">Support Ravidassia Abroad</h1>
              <p className="lead mb-0 text-white-50">
                Help us document Guru Ravidass temples, history, sangat, teachings,
                and diaspora stories worldwide through the World Guru Ravidass Journey.
              </p>
            </div>
            <div className="col-lg-4">
              <div className="business-panel p-4 text-dark">
                <h2 className="h5 fw-bold mb-3">Why support matters</h2>
                <p className="mb-0 text-muted">
                  Every contribution helps preserve community memory and make
                  reliable public resources easier to access for families, students,
                  and future generations.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="donate"
          ref={donateSectionRef}
          className="support-donate-section row g-4 mb-5 align-items-stretch"
        >
          <div className="col-lg-7">
            <div className="support-donate-card h-100">
              <div className="support-donate-header">
                <span className="support-donate-kicker">Secure Stripe Checkout</span>
                <h2 className="h3 fw-bold mb-3">Donate in a few taps</h2>
                <p className="mb-0 text-white-50">
                  Donations are collected in Canadian dollars and processed by
                  Stripe on their hosted checkout page. International supporters
                  may see local currency and local payment methods when Stripe
                  supports them.
                </p>
              </div>

              {donationStatus === "success" && (
                <div className="alert alert-success support-donate-alert mt-4 mb-0">
                  Thank you for supporting Ravidassia Abroad. Your donation was
                  received successfully.
                </div>
              )}

              {donationStatus === "canceled" && (
                <div className="alert alert-warning support-donate-alert mt-4 mb-0">
                  Your donation checkout was canceled. You can try again whenever
                  you are ready.
                </div>
              )}

              <div className="support-amount-grid mt-4">
                {presetAmountsCad.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={`support-amount-pill ${
                      !customAmount && selectedAmount === amount ? "is-active" : ""
                    }`}
                    onClick={() => handlePresetSelect(amount)}
                  >
                    {formatCad(amount)}
                  </button>
                ))}
              </div>

              <div className="support-custom-amount mt-4">
                <label htmlFor="customDonationAmount" className="form-label fw-semibold">
                  Custom amount in CAD
                </label>
                <div className="support-input-wrap">
                  <span className="support-currency">CAD</span>
                  <input
                    id="customDonationAmount"
                    type="number"
                    min="5"
                    step="1"
                    className="form-control"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(event) => {
                      setCustomAmount(event.target.value);
                      setError("");
                    }}
                  />
                </div>
                <small className="text-muted d-block mt-2">
                  Minimum donation is 5 CAD. For larger sponsorships, temple visits,
                  or partnership support, please contact us directly.
                </small>
              </div>

              {error ? <div className="alert alert-danger mt-4 mb-0">{error}</div> : null}

              <div className="support-donate-actions mt-4">
                <button
                  type="button"
                  className="btn btn-primary support-pay-btn"
                  onClick={handleDonate}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Opening Stripe Checkout..."
                    : `Donate ${Number.isFinite(Number(effectiveAmount)) && Number(effectiveAmount) >= 5
                        ? formatCad(Number(effectiveAmount))
                        : "Now"}`}
                </button>
                <Link
                  to="/contact"
                  className="btn btn-outline-light rounded-pill px-4"
                >
                  Contact Us for Sponsorship
                </Link>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="business-panel p-4 p-lg-5 h-100">
              <h2 className="h4 fw-bold mb-3">What your donation supports</h2>
              <div className="business-info-list">
                {supportAreas.map((item) => (
                  <div key={item} className="business-info-item">
                    <i className="fas fa-check-circle"></i>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="support-trust-strip mt-4">
                <div className="support-trust-item">
                  <strong>Worldwide donors</strong>
                  <span>Hosted Stripe Checkout works across countries and cards.</span>
                </div>
                <div className="support-trust-item">
                  <strong>Secure checkout</strong>
                  <span>Your card details stay on Stripe, not on our website.</span>
                </div>
                <div className="support-trust-item">
                  <strong>Built for growth</strong>
                  <span>We can add recurring giving and donor emails in the next phase.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="row g-4 mb-5">
          <div className="col-lg-7">
            <div className="business-panel p-4 p-lg-5 h-100">
              <h2 className="h3 fw-bold mb-3">Our mission</h2>
              <p className="text-muted">
                Ravidassia Abroad exists to respectfully document temples,
                teachings, sangat spaces, lived community stories, and diaspora
                experiences without losing sight of accuracy, dignity, and service.
              </p>
              <div className="business-info-list mt-4">
                {supportAreas.map((item) => (
                  <div key={item} className="business-info-item">
                    <i className="fas fa-check-circle"></i>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="business-cta-card p-4 p-lg-5 h-100">
              <h2 className="h4 fw-bold mb-3">Ways to get involved</h2>
              <div className="business-link-grid">
                <button
                  type="button"
                  className="btn btn-primary rounded-pill px-4"
                  onClick={() =>
                    donateSectionRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    })
                  }
                >
                  Donate Securely
                </button>
                <Link
                  to="/sponsor-advertise"
                  className="btn btn-outline-light rounded-pill px-4"
                >
                  Sponsor a Temple Visit
                </Link>
                <Link
                  to="/contact"
                  className="btn btn-outline-warning rounded-pill px-4"
                >
                  Suggest a Temple
                </Link>
              </div>
              <p className="small text-white-50 mt-4 mb-0">
                If you want to support a city, a temple visit, or a specific
                documentation project, contact us and we can coordinate it directly.
              </p>
            </div>
          </div>
        </section>

        <section className="business-panel p-4 p-lg-5">
          <div className="row g-4">
            {supportOptions.map((option) => (
              <div key={option.title} className="col-md-6 col-xl-3">
                <div className="business-card p-4 h-100">
                  <span className="business-chip gold mb-3">Support Option</span>
                  <h3 className="h5 fw-bold">{option.title}</h3>
                  <p className="text-muted mb-0">{option.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
