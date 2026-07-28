
'use client';

import StatCounter from '@/components/StatCounter';

const AboutPage = () => {
  return (
    <div className="page-shell">
        <section id="about" aria-labelledby="about-title">
        <div className="about-grid">
          <div className="about-image-wrap">
            <span className="about-frame" aria-hidden="true"></span>
            <img className="about-image-main" src="/assets/images/showroom.png" alt="Royal Enfield showroom interior" loading="lazy" />
            <div className="about-image-accent">
              <span className="accent-num">18</span>
              <span className="accent-label">Years of Pure Legacy</span>
            </div>
          </div>
          <div className="about-content">
            <span className="section-tag">Our Story</span>
            <h2 className="section-title" id="about-title">Where Passion<br />Meets Purpose</h2>
            <p>We are more than a dealership — we are custodians of a century-old legacy. Established in 2016, we
              have grown to become one of the most trusted Royal Enfield authorized dealerships, serving thousands
              of riders across the region.</p>
            <p>Our state-of-the-art showroom spans over 10,000 sq. ft., featuring the complete Royal Enfield lineup
              alongside expert consultation, authentic accessories, and a world-className service centre.</p>
            <p>Every person who walks through our doors is welcomed into the Royal Enfield brotherhood — a community
              bound not by horsepower alone, but by the spirit of adventure.</p>
            <div className="about-stats">
              <div className="about-stat">
                <StatCounter target={5000} suffix="+" />
                <div className="about-stat-label">Happy Riders</div>
              </div>
              <div className="about-stat">
                <StatCounter target={18} suffix=" Yrs" />
                <div className="about-stat-label">In Business</div>
              </div>
              <div className="about-stat">
                <StatCounter target={30} suffix="+" />
                <div className="about-stat-label">Expert Staff</div>
              </div>
            </div>
            <a href="#test-ride" className="btn-primary">
              <i className="fa-solid fa-route"></i> Book Your Ride
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
