import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";
import { usePopup } from "../components/PopupProvider";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const popup = usePopup();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: request OTP, 2: verify/reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔁 Resend OTP timer
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // 1️⃣ Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      popup.open({
        title: "OTP Sent 📧",
        message: data.message,
        type: "success",
      });
      setStep(2);
      setTimer(30); // start countdown
    } catch (err) {
      popup.open({ title: "Error", message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0) return;
    try {
      const res = await fetch(`${API_BASE}/auth/request-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      popup.open({
        title: "OTP Resent 📩",
        message: "Check your inbox again!",
        type: "success",
      });
      setTimer(30);
    } catch (err) {
      popup.open({ title: "Error", message: err.message, type: "error" });
    }
  };

  // 2️⃣ Verify OTP + Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      popup.open({
        title: "Password Changed ✅",
        message: "Your password was updated successfully. Please log in again.",
        type: "success",
      });

      // Auto-logout
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth-updated"));

      // Redirect after 2s
      setTimeout(() => navigate("/auth"), 2000);
    } catch (err) {
      popup.open({ title: "Error ❌", message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <div className="container card shadow p-4" style={{ maxWidth: 400 }}>
        <h3 className="text-center mb-3">
          {step === 1 ? "Forgot Password" : "Reset Password"}
        </h3>

        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <input
              type="email"
              placeholder="Enter your registered email"
              className="form-control mb-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn btn-warning w-100" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <input
              type="text"
              placeholder="Enter OTP"
              className="form-control mb-3"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Enter new password"
              className="form-control mb-3"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            <button className="btn btn-success w-100 mb-3" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            {/* Resend OTP link */}
            <div className="text-center">
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={handleResendOtp}
                disabled={timer > 0}
              >
                {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
