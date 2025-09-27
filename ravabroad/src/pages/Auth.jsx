// src/pages/Auth.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../css/auth.css";

const API_BASE = "http://localhost:5000/api"; // your Node server

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // false = Sign In, true = Sign Up
  const [panelRight, setPanelRight] = useState(false);

  // open /auth?mode=signup directly on the Sign Up panel
  useEffect(() => {
    const mode = (searchParams.get("mode") || "").toLowerCase();
    setPanelRight(mode === "signup");
  }, [searchParams]);

  const [msg, setMsg] = useState(null);

  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ name: "", email: "", password: "" });

  const handleChange = (setFn) => (e) => {
    const { name, value } = e.target;
    setFn((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signUp),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      setMsg(data.message || "User created successfully. Please sign in.");
      alert(data.message || "User created successfully."); // popup
      setPanelRight(false); // switch to Sign In
      setSignUp({ name: "", email: "", password: "" });
    } catch (err) {
      setMsg(err.message);
      alert(err.message);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signIn),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      // store token (optional)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth:changed"));

      setMsg("Logged in successfully.");
      alert("Logged in successfully.");
      navigate("/"); // redirect after login
    } catch (err) {
      setMsg(err.message);
      alert(err.message);
    }
  };

  return (
    <div className="auth-root">
      <h2>Sign in / Sign up</h2>

      {/* MOBILE TABS (shown under 768px via CSS) */}
      <div className="auth-mobile-tabs" role="tablist" aria-label="Auth tabs">
        <button
          type="button"
          className={`tab ${!panelRight ? "active" : ""}`}
          onClick={() => setPanelRight(false)}
          aria-selected={!panelRight}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`tab ${panelRight ? "active" : ""}`}
          onClick={() => setPanelRight(true)}
          aria-selected={panelRight}
        >
          Sign Up
        </button>
      </div>

      {msg && (
        <p style={{ marginTop: 8, color: "#ff4b2b", fontWeight: 600, textAlign: "center" }}>
          {msg}
        </p>
      )}

      <div className={`container ${panelRight ? "right-panel-active" : ""}`} id="container">
        {/* SIGN UP */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignUp}>
            <h1>Create Account</h1>
            <div className="social-container">
              <a href="#" className="social" aria-label="Facebook"><i className="fab fa-facebook-f" /></a>
              <a href="#" className="social" aria-label="Google"><i className="fab fa-google-plus-g" /></a>
              <a href="#" className="social" aria-label="LinkedIn"><i className="fab fa-linkedin-in" /></a>
            </div>
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
              <button type="button" className="link-btn" onClick={() => setPanelRight(false)}>
                Sign in
              </button>
            </p>
          </form>
        </div>

        {/* SIGN IN */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleSignIn}>
            <h1>Sign in</h1>
            <div className="social-container">
              <a href="#" className="social" aria-label="Facebook"><i className="fab fa-facebook-f" /></a>
              <a href="#" className="social" aria-label="Google"><i className="fab fa-google-plus-g" /></a>
              <a href="#" className="social" aria-label="LinkedIn"><i className="fab fa-linkedin-in" /></a>
            </div>
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
              <button type="button" className="link-btn" onClick={() => setPanelRight(true)}>
                Create account
              </button>
            </p>
          </form>
        </div>

        {/* DESKTOP OVERLAY */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="ghost" onClick={() => setPanelRight(false)}>Sign In</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start your journey with us</p>
              <button className="ghost" onClick={() => setPanelRight(true)}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>

      <footer className="auth-footer">
        <p>
          UI inspired by Florin Pop’s challenge —{" "}
          <a target="_blank" rel="noreferrer" href="https://www.florin-pop.com/blog/2019/03/double-slider-sign-in-up-form/">
            how it was built
          </a>.
        </p>
      </footer>
    </div>
  );
}
