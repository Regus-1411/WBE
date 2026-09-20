import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const user = await login(username, password);

      // Route based on role
      if (user && user.role === "APARTMENT_ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/resident/dashboard");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" id="login-page">
      {/* Ambient decorative background glows */}
      <div className="login-page__ambient">
        <div className="login-ambient-orb login-ambient-orb--1" />
        <div className="login-ambient-orb login-ambient-orb--2" />
        <div className="login-ambient-orb login-ambient-orb--3" />
      </div>

      <div className="login-page__container">
        {/* ── LEFT HALF: Website Description & Logo ── */}
        <div className="login-hero-panel" id="login-hero-panel">
          <div className="login-hero__brand-header">
            <Link to="/" className="login-hero__logo-link" title="Return to Homepage">
              <div className="login-hero__logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <div className="login-hero__brand-text">
                <span className="login-hero__title">
                  DR<span className="login-hero__title-accent">OP</span>
                </span>
                <span className="login-hero__badge">SMART WATER</span>
              </div>
            </Link>
          </div>

          <div className="login-hero__main-content">
            <div className="login-hero__pill">
              <span className="login-hero__pill-dot"></span>
              <span>Intelligent Society Water Management</span>
            </div>

            <h1 className="login-hero__heading">
              Smart Water Metering & Automated Billing Platform
            </h1>

            <p className="login-hero__description">
              DROP streamlines apartment society water infrastructure with automated sub-meter tracking, fair tiered tariff billing, instant digital invoices, and real-time pipeline leakage detection.
            </p>

            {/* Feature Highlights Grid */}
            <div className="login-hero__features">
              <div className="login-feature-item">
                <div className="login-feature-item__icon login-feature-item__icon--blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                </div>
                <div className="login-feature-item__text">
                  <strong>Volumetric Billing Slabs</strong>
                  <span>Accurate fair-usage calculations & automatic invoices</span>
                </div>
              </div>

              <div className="login-feature-item">
                <div className="login-feature-item__icon login-feature-item__icon--emerald">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="login-feature-item__text">
                  <strong>Real-Time Leak Detection</strong>
                  <span>Continuous flow monitoring and rapid loss prevention</span>
                </div>
              </div>

              <div className="login-feature-item">
                <div className="login-feature-item__icon login-feature-item__icon--amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div className="login-feature-item__text">
                  <strong>Transparent Portals</strong>
                  <span>Dedicated dashboards for Society Admins & Residents</span>
                </div>
              </div>
            </div>

            {/* Live Metrics Row */}
            <div className="login-hero__stats">
              <div className="login-stat-card">
                <span className="login-stat-card__value">20%+</span>
                <span className="login-stat-card__label">Water Conserved</span>
              </div>
              <div className="login-stat-card">
                <span className="login-stat-card__value">100%</span>
                <span className="login-stat-card__label">Billing Accuracy</span>
              </div>
              <div className="login-stat-card">
                <span className="login-stat-card__value">24/7</span>
                <span className="login-stat-card__label">Leakage Guard</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT HALF: Sign In Window ── */}
        <div className="login-form-panel" id="login-form-panel">
          <div className="login-card" id="login-card">
            <div className="login-card__header">
              <div className="login-card__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
              </div>
              <h2 className="login-card__title">Sign In</h2>
              <p className="login-card__subtitle">Enter your credentials to access your account</p>
            </div>

            <form className="login-card__form" onSubmit={handleSubmit} id="login-form">
              <div className="login-card__field">
                <label htmlFor="login-username">Username or Email</label>
                <div className="login-card__input-wrapper">
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or resident"
                    autoComplete="username"
                    autoFocus
                  />
                  <svg className="login-card__input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>

              <div className="login-card__field">
                <div className="login-card__label-row">
                  <label htmlFor="login-password">Password</label>
                </div>
                <div className="login-card__input-wrapper">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  />
                  <svg className="login-card__input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <button
                    type="button"
                    className="login-card__password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    id="toggle-password"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-card__error" id="login-error" role="alert">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary login-card__submit"
                disabled={isLoading}
                id="login-submit"
              >
                {isLoading ? (
                  <>
                    <span className="login-spinner"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>

              <div className="login-card__divider">
                <div className="login-card__divider-line" />
                <span className="login-card__divider-text">New to DROP?</span>
                <div className="login-card__divider-line" />
              </div>

              <div className="login-card__register-box">
                <p className="login-card__register">
                  Need to set up a new community?
                </p>
                <Link to="/register" className="login-card__register-btn" id="register-link">
                  <span>Register Society</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;