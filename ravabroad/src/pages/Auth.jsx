import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "../css/auth.css";
import { login, register, verifyRegistrationOtp, API_BASE } from "../utils/api";
import { usePopup } from "../components/PopupProvider";
import { clearPostAuthRedirect, getPostAuthRedirect } from "../utils/formDrafts";
import { setStoredAuth } from "../utils/auth";
import {
  LEGAL_PATHS,
  MARKETING_OPT_IN_LABEL,
  SIGNUP_ACKNOWLEDGMENT,
} from "../utils/compliance";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const popup = usePopup();

  const [panelRight, setPanelRight] = useState(false);
  const [msg, setMsg] = useState(null);
  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({
    name: "",
    email: "",
    password: "",
    policyAccepted: false,
    marketingOptIn: false,
  });
  const [signUpStep, setSignUpStep] = useState("form");
  const [signUpOtp, setSignUpOtp] = useState("");
  const [signUpCooldown, setSignUpCooldown] = useState(0);

  useEffect(() => {
    const mode = (searchParams.get("mode") || "").toLowerCase();
    setPanelRight(mode === "signup");
  }, [searchParams]);

  useEffect(() => {
    if (signUpCooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setSignUpCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [signUpCooldown]);

  const handleChange = (setFn) => (e) => {
    const { name, value } = e.target;
    setFn((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignUpFieldChange = (e) => {
    const { name, value } = e.target;
    setSignUp((prev) => ({ ...prev, [name]: value }));
    if (signUpStep === "verify") {
      setSignUpStep("form");
      setSignUpOtp("");
      setSignUpCooldown(0);
      setMsg("Details changed. Send a new verification code.");
    }
  };

  const handleSignUpCheckboxChange = (name) => (e) => {
    setSignUp((prev) => ({ ...prev, [name]: e.target.checked }));
    if (signUpStep === "verify") {
      setSignUpStep("form");
      setSignUpOtp("");
      setSignUpCooldown(0);
      setMsg("Details changed. Send a new verification code.");
    }
  };

  const getAuthRedirectPath = () => {
    return location.state?.redirectTo || getPostAuthRedirect() || "/";
  };

  const finishAuth = (data, successMessage) => {
    setStoredAuth(data.user, data.token);
    clearPostAuthRedirect();
    popup.open({
      title: "Welcome",
      message: successMessage,
      type: "success",
    });
    navigate(getAuthRedirectPath(), { replace: true });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const data = await register({
        name: signUp.name,
        email: signUp.email,
        password: signUp.password,
        policyAccepted: signUp.policyAccepted,
        marketingOptIn: signUp.marketingOptIn,
      });
      setSignUpStep("verify");
      setSignUpOtp("");
      setSignUpCooldown(Number(data.resend_after_seconds) || 60);
      setMsg(data.message || "A verification code has been sent to your email.");
    } catch (err) {
      popup.open({
        title: "Registration Error",
        message: err.message,
        type: "error",
      });
    }
  };

  const handleVerifySignUp = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const data = await verifyRegistrationOtp({
        email: signUp.email,
        otp: signUpOtp,
      });
      finishAuth(data, "Account created successfully!");
    } catch (err) {
      popup.open({
        title: "Verification Error",
        message: err.message,
        type: "error",
      });
    }
  };

  const handleResendSignUpOtp = async () => {
    if (signUpCooldown > 0) return;
    setMsg(null);
    try {
      const data = await register({
        name: signUp.name,
        email: signUp.email,
        password: signUp.password,
        policyAccepted: signUp.policyAccepted,
        marketingOptIn: signUp.marketingOptIn,
      });
      setSignUpCooldown(Number(data.resend_after_seconds) || 60);
      setMsg(data.message || "A fresh verification code has been sent.");
    } catch (err) {
      popup.open({
        title: "Could Not Resend Code",
        message: err.message,
        type: "error",
      });
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const data = await login(signIn);
      finishAuth(data, "Logged in successfully!");
    } catch (err) {
      popup.open({
        title: "Login Failed",
        message: err.message,
        type: "error",
      });
    }
  };

  async function handleGoogleResponse(response) {
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      finishAuth(data, "Signed in with Google successfully!");
    } catch (err) {
      popup.open({
        title: "Google Login Failed",
        message: err.message,
        type: "error",
      });
    }
  }

  useEffect(() => {
    function initGoogle() {
      if (window.google && GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        const btnSignIn = document.getElementById("googleSignInBtn");
        const btnSignUp = document.getElementById("googleSignUpBtn");

        if (btnSignIn) {
          window.google.accounts.id.renderButton(btnSignIn, {
            theme: "outline",
            size: "large",
            width: 240,
          });
        }

        if (btnSignUp) {
          window.google.accounts.id.renderButton(btnSignUp, {
            theme: "outline",
            size: "large",
            width: 240,
          });
        }
      } else {
        console.warn("Google SDK not ready yet");
      }
    }

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 500);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="auth-root">
      <h2>Sign in / Sign up</h2>

      <div className="auth-mobile-tabs" role="tablist" aria-label="Auth tabs">
        <button
          type="button"
          className={`tab ${!panelRight ? "active" : ""}`}
          onClick={() => setPanelRight(false)}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`tab ${panelRight ? "active" : ""}`}
          onClick={() => setPanelRight(true)}
        >
          Sign Up
        </button>
      </div>

      {msg && (
        <p
          style={{
            marginTop: 8,
            color: "#ff4b2b",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {msg}
        </p>
      )}

      <div
        className={`container ${panelRight ? "right-panel-active" : ""}`}
        id="container"
      >
        <div className="form-container sign-up-container">
          <form onSubmit={signUpStep === "verify" ? handleVerifySignUp : handleSignUp}>
            <h1>{signUpStep === "verify" ? "Verify Email" : "Create Account"}</h1>
            {signUpStep !== "verify" && (
              <>
                <div id="googleSignUpBtn"></div>
                <p className="small text-muted mt-2 mb-3">
                  By continuing with Google, you agree to the{" "}
                  <Link to={LEGAL_PATHS.terms}>Terms of Use</Link> and acknowledge the{" "}
                  <Link to={LEGAL_PATHS.privacy}>Privacy Policy</Link>.
                </p>
              </>
            )}

            <span>
              {signUpStep === "verify"
                ? "Enter the 6-digit code sent to your email"
                : "or use your email for registration"}
            </span>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={signUp.name}
              onChange={handleSignUpFieldChange}
              required
              disabled={signUpStep === "verify"}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={signUp.email}
              onChange={handleSignUpFieldChange}
              required
              disabled={signUpStep === "verify"}
            />
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 chars)"
              value={signUp.password}
              onChange={handleSignUpFieldChange}
              required
              minLength={6}
              disabled={signUpStep === "verify"}
            />
            <div className="auth-checkbox-group">
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  name="policyAccepted"
                  checked={signUp.policyAccepted}
                  onChange={handleSignUpCheckboxChange("policyAccepted")}
                  required
                  disabled={signUpStep === "verify"}
                />
                <span>{SIGNUP_ACKNOWLEDGMENT}</span>
              </label>
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  name="marketingOptIn"
                  checked={signUp.marketingOptIn}
                  onChange={handleSignUpCheckboxChange("marketingOptIn")}
                  disabled={signUpStep === "verify"}
                />
                <span>{MARKETING_OPT_IN_LABEL}</span>
              </label>
            </div>

            {signUpStep === "verify" && (
              <div className="auth-verify-box">
                <p className="auth-verify-note">
                  We sent a verification code to <strong>{signUp.email}</strong>.
                </p>
                <input
                  type="text"
                  name="signupOtp"
                  placeholder="Enter verification code"
                  value={signUpOtp}
                  onChange={(e) => setSignUpOtp(e.target.value)}
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                />
                <div className="auth-secondary-actions">
                  <button
                    type="button"
                    className="auth-secondary-btn"
                    onClick={handleResendSignUpOtp}
                    disabled={signUpCooldown > 0}
                  >
                    {signUpCooldown > 0
                      ? `Resend in ${signUpCooldown}s`
                      : "Resend code"}
                  </button>
                  <button
                    type="button"
                    className="auth-secondary-btn"
                    onClick={() => {
                      setSignUpStep("form");
                      setSignUpOtp("");
                      setSignUpCooldown(0);
                      setMsg(null);
                    }}
                  >
                    Edit details
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="auth-submit-btn">
              {signUpStep === "verify" ? "Verify and Create Account" : "Send Verification Code"}
            </button>

            <p className="auth-mobile-only">
              Already have an account?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => setPanelRight(false)}
              >
                Sign in
              </button>
            </p>
          </form>
        </div>

        <div className="form-container sign-in-container">
          <form onSubmit={handleSignIn}>
            <h1>Sign in</h1>
            <div id="googleSignInBtn"></div>
            <p className="small text-muted mt-2 mb-3">
              By continuing with Google, you agree to the{" "}
              <Link to={LEGAL_PATHS.terms}>Terms of Use</Link> and acknowledge the{" "}
              <Link to={LEGAL_PATHS.privacy}>Privacy Policy</Link>.
            </p>

            <span>or use your account</span>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={signIn.email}
              onChange={handleChange(setSignIn)}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={signIn.password}
              onChange={handleChange(setSignIn)}
              required
            />
            <Link
              to="/forgot-password"
              className="text-decoration-none text-warning"
            >
              Forgot your password?
            </Link>
            <button type="submit" className="auth-submit-btn">Sign In</button>

            <p className="auth-mobile-only">
              New here?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => setPanelRight(true)}
              >
                Create account
              </button>
            </p>
          </form>
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>
                To keep connected with us please login with your personal info
              </p>
              <button className="ghost" onClick={() => setPanelRight(false)}>
                Sign In
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start your journey with us</p>
              <button className="ghost" onClick={() => setPanelRight(true)}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
