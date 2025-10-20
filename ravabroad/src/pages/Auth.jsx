import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../css/auth.css";
import { register, login } from "../utils/api";
import { usePopup } from "../components/PopupProvider";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const API_BASE = process.env.REACT_APP_API_URL + "/api";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const popup = usePopup();

  const [panelRight, setPanelRight] = useState(false);
  const [msg, setMsg] = useState(null);
  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    const mode = (searchParams.get("mode") || "").toLowerCase();
    setPanelRight(mode === "signup");
  }, [searchParams]);

  const handleChange = (setFn) => (e) => {
    const { name, value } = e.target;
    setFn((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const data = await register(signUp);
      setMsg(data.message || "User created successfully. Please sign in.");
      popup.open({
        title: "Success 🎉",
        message: data.message || "User created successfully. Please sign in.",
        type: "success",
      });
    } catch (err) {
      popup.open({
        title: "Error ❌",
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
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-updated"));
      popup.open({
        title: "Welcome 👋",
        message: "Logged in successfully!",
        type: "success",
      });
      navigate("/");
    } catch (err) {
      popup.open({
        title: "Login Failed ❌",
        message: err.message,
        type: "error",
      });
    }
  };

  // ✅ GOOGLE LOGIN HANDLER
  async function handleGoogleResponse(response) {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-updated"));

      popup.open({
        title: "Welcome 👋",
        message: "Signed in with Google successfully!",
        type: "success",
      });
      navigate("/");
    } catch (err) {
      popup.open({
        title: "Google Login Failed ❌",
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
      console.warn("⏳ Google SDK not ready yet");
    }
  }

  // If script already loaded
  if (window.google) {
    initGoogle();
  } else {
    // Wait until Google script loads
    const interval = setInterval(() => {
      if (window.google) {
        clearInterval(interval);
        initGoogle();
      }
    }, 500);
    return () => clearInterval(interval);
  }
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
        {/* SIGN UP */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignUp}>
            <h1>Create Account</h1>

            {/* ✅ Google Sign Up Button */}
            <div id="googleSignUpBtn"></div>

            <span>or use your email for registration</span>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={signUp.name}
              onChange={handleChange(setSignUp)}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={signUp.email}
              onChange={handleChange(setSignUp)}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password (min 6 chars)"
              value={signUp.password}
              onChange={handleChange(setSignUp)}
              required
              minLength={6}
            />
            <button type="submit">Sign Up</button>

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

        {/* SIGN IN */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleSignIn}>
            <h1>Sign in</h1>

            {/* ✅ Google Sign In Button */}
            <div id="googleSignInBtn"></div>

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
            <a href="#">Forgot your password?</a>
            <button type="submit">Sign In</button>

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

        {/* Overlay */}
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

      <footer className="auth-footer">
        <p>© Ravidassia Abroad</p>
      </footer>
    </div>
  );
}
