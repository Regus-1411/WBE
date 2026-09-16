import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";

function Header() {
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const isRegister = location.pathname === "/register";
  const isLogin = location.pathname === "/login";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header 
      className={`header ${isLanding ? "header--landing" : "header--auth"} ${scrolled ? "header--scrolled" : ""}`} 
      id="main-header"
    >
      <div className="header__inner">
        {/* Brand or Back to Home Link */}
        <div className="header__left">
          {!isLanding ? (
            <Link to="/" className="header__back-btn" id="header-back-home">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Home</span>
            </Link>
          ) : (
            <Link to="/" className="header__brand" id="header-brand">
              <div className="header__logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <div className="header__brand-text-col">
                <span className="header__title">
                  DR<span className="header__title-accent">OP</span>
                </span>
                <span className="header__subtitle">Smart Water</span>
              </div>
            </Link>
          )}
        </div>

        {/* Center Nav for Landing Page or Brand for Auth */}
        {isLanding ? (
          <nav className={`header__nav ${mobileMenuOpen ? "header__nav--open" : ""}`} id="header-nav">
            <a href="#features" className="header__nav-link" onClick={() => setMobileMenuOpen(false)}>
              Features
            </a>
            <a href="#portals" className="header__nav-link" onClick={() => setMobileMenuOpen(false)}>
              Portals
            </a>
            <a href="#calculator" className="header__nav-link" onClick={() => setMobileMenuOpen(false)}>
              Savings Calculator
            </a>
            <a href="#how-it-works" className="header__nav-link" onClick={() => setMobileMenuOpen(false)}>
              How It Works
            </a>
            <a href="#faq" className="header__nav-link" onClick={() => setMobileMenuOpen(false)}>
              FAQ
            </a>
            
            {/* Mobile-only action buttons */}
            <div className="header__mobile-actions">
              <Link to="/login" className="header__mobile-login-btn">
                Sign In (Resident / Admin)
              </Link>
              <Link to="/register" className="header__mobile-register-btn">
                Register Community
              </Link>
            </div>
          </nav>
        ) : (
          <Link to="/" className="header__auth-brand" id="header-auth-brand">
            <div className="header__logo-icon header__logo-icon--sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <span className="header__title">
              DR<span className="header__title-accent">OP</span>
            </span>
          </Link>
        )}

        {/* Right Actions */}
        <div className="header__actions">
          {isLanding ? (
            <>
              <Link to="/login" className="header__login-link" id="header-login-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Sign In</span>
              </Link>

              <Link to="/register" className="header__cta-btn" id="header-register-btn">
                <span>Get Started</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>

              {/* Mobile toggle */}
              <button 
                className="header__mobile-toggle" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
                type="button"
                id="header-mobile-toggle"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {mobileMenuOpen ? (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>
            </>
          ) : (
            <div className="header__auth-right">
              {isLogin && (
                <Link to="/register" className="header__auth-action-btn" id="header-to-register">
                  <span>Need an account?</span>
                  <strong>Register Society</strong>
                </Link>
              )}
              {isRegister && (
                <Link to="/login" className="header__auth-action-btn" id="header-to-login">
                  <span>Already registered?</span>
                  <strong>Sign In</strong>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
