import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./RegisterPage.css";

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { firstName, lastName, email, username, password, confirmPassword } = formData;

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !username.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const user = await register({
        username,
        email,
        password,
        fullName: `${firstName} ${lastName}`.trim(),
        role: "APARTMENT_ADMIN",
      });

      if (user && user.role === "APARTMENT_ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/resident/dashboard");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page" id="register-page">
      {/* ── Background ── */}
      <div className="register-page__bg">
        <div className="register-page__bg-orb register-page__bg-orb--1" />
        <div className="register-page__bg-orb register-page__bg-orb--2" />
      </div>

      {/* ── Register Card ── */}
      <div className="register-page__content">
        <div className="register-card" id="register-card">
          {/* Header */}
          <div className="register-card__header">
            <div className="register-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <h1 className="register-card__title">Create Admin Account</h1>
            <p className="register-card__subtitle">
              Set up your society and manage water billing
            </p>
          </div>

          {/* Form */}
          <form className="register-card__form" onSubmit={handleSubmit} id="register-form">

            {/* First & Last Name */}
            <div className="register-card__row">
              <div className="register-card__field">
                <label htmlFor="reg-firstName">First Name</label>
                <div className="register-card__input-wrapper">
                  <input
                    id="reg-firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    autoFocus
                  />
                  <svg className="register-card__input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>
              <div className="register-card__field">
                <label htmlFor="reg-lastName">Last Name</label>
                <div className="register-card__input-wrapper">
                  <input
                    id="reg-lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                  <svg className="register-card__input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="register-card__field">
              <label htmlFor="reg-email">Email</label>
              <div className="register-card__input-wrapper">
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
                <svg className="register-card__input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
            </div>

            {/* Username */}
            <div className="register-card__field">
              <label htmlFor="reg-username">Username</label>
              <div className="register-card__input-wrapper">
                <input
                  id="reg-username"
                  name="username"
                  type="text"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                />
                <svg className="register-card__input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
                </svg>
              </div>
            </div>

            {/* Password */}
            <div className="register-card__field">
              <label htmlFor="reg-password">Password</label>
              <div className="register-card__input-wrapper">
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <svg className="register-card__input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="register-card__field">
              <label htmlFor="reg-confirmPassword">Confirm Password</label>
              <div className="register-card__input-wrapper">
                <input
                  id="reg-confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <svg className="register-card__input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="register-card__error" id="register-error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary register-card__submit"
              disabled={isLoading}
              id="register-submit"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>

            {/* Divider */}
            <div className="register-card__divider">
              <div className="register-card__divider-line" />
              <span className="register-card__divider-text">Already registered?</span>
              <div className="register-card__divider-line" />
            </div>

            {/* Login Link */}
            <p className="register-card__login">
              Have an account?
              <Link to="/login" className="register-card__login-link" id="login-link">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
