"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const SectionPageShell = ({ children }: { children: React.ReactNode }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin");

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isMenuOpen]);

  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div>
      <div id="scroll-progress" aria-hidden="true"></div>
      <nav id="navbar">
        <a href="/" className="nav-logo" aria-label="Royal Enfield Home">
          <span className="logo-brand">Funshine Getaways</span>
          <span className="logo-sub">Authorized Dealership</span>
        </a>
        <ul className="nav-links">
          <li>
            <Link href="/models">Models</Link>
          </li>
          <li>
            <Link href="/about">About</Link>
          </li>
          <li>
            <Link href="/services">Services</Link>
          </li>
          <li>
            <Link href="/finance">Finance</Link>
          </li>
          <li>
            <Link href="/events">Events</Link>
          </li>
          <li>
            <Link href="/contact">Contact</Link>
          </li>
        </ul>
        <Link href="/test-ride" className="nav-cta">
          Book Test Ride
        </Link>
        <button
          className={`nav-hamburger ${isMenuOpen ? "open" : ""}`}
          aria-label="Toggle menu"
          id="hamburger"
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>
      <div
        className={`mobile-menu ${isMenuOpen ? "open" : ""}`}
        id="mobile-menu"
      >
        <Link href="/models" onClick={toggleMenu}>
          Models
        </Link>
        <Link href="/about" onClick={toggleMenu}>
          About
        </Link>
        <Link href="/services" onClick={toggleMenu}>
          Services
        </Link>
        <Link href="/test-ride" onClick={toggleMenu}>
          Test Ride
        </Link>
        <Link href="/finance" onClick={toggleMenu}>
          Finance
        </Link>
        <Link href="/events" onClick={toggleMenu}>
          Events
        </Link>
        <Link href="/contact" onClick={toggleMenu}>
          Contact
        </Link>
      </div>
      {children}
      <footer>
        <div className="footer-main">
          <div className="footer-brand footer-col">
            <span className="logo-brand">Funshine Getaways</span>
            <span className="logo-sub">Authorized Dealership · Est. 2016</span>
            <p>
              Your trusted home for Royal Enfield motorcycles, genuine parts,
              expert service, and easy finance — all under one roof.
            </p>
            <div className="contact-socials">
              <a href="#" className="social-btn" aria-label="Facebook">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
              <a href="#" className="social-btn" aria-label="Instagram">
                <i className="fa-brands fa-instagram"></i>
              </a>
              <a href="#" className="social-btn" aria-label="YouTube">
                <i className="fa-brands fa-youtube"></i>
              </a>
              <a href="#" className="social-btn" aria-label="WhatsApp">
                <i className="fa-brands fa-whatsapp"></i>
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4>Models</h4>
            <ul>
              <li>
                <a href="/products">All Models</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Dealership</h4>
            <ul>
              <li>
                <a href="/about">About Us</a>
              </li>
              <li>
                <a href="/services">Services</a>
              </li>
              <li>
                <a href="/services">Genuine Parts</a>
              </li>
              <li>
                <a href="/finance">Finance</a>
              </li>
              <li>
                <a href="/test-ride">Book Test Ride</a>
              </li>
              <li>
                <a href="/contact">Contact</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li>
                <a href="tel:+918638707085">+91 8638707085</a>
              </li>
              <li>
                <a href="mailto:funshine.reshowroom@gmail.com">
                  funshine.reshowroom@gmail.com
                </a>
              </li>
              <li>
                <a href="/contact">AT Rd, near ASTC Bus Stand, Sivasagar</a>
              </li>
            </ul>
            <div style={{ marginTop: "20px" }}>
              <a
                href="#test-ride"
                className="btn-primary"
                style={{ padding: "10px 20px", fontSize: "0.78rem" }}
              >
                Book Test Ride
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">
            © {new Date().getFullYear()} Funshine Getaways. All rights reserved.
            An Authorized Royal Enfield Dealership.
          </p>
          <div className="footer-legal">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-service">Terms of Service</Link>
            <Link href="/cookie-policy">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SectionPageShell;
