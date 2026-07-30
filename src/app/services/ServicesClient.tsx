'use client';

export default function ServicesClient() {
  return (
    <div className="page-shell">
        <section id="services" aria-labelledby="services-title">
        <div className="services-layout">
          <div className="services-image">
            <img src="/assets/images/workshop.png" alt="Royal Enfield authorized service workshop" loading="lazy" />
            <div className="services-image-overlay">
              <h4><i className="fa-solid fa-shield-halved"></i> &nbsp;100% Genuine Parts</h4>
              <p>Only authentic Royal Enfield spare parts and accessories — sourced directly from the factory,
                with full warranty.</p>
            </div>
          </div>
          <div>
            <span className="section-tag">Expert Care</span>
            <h2 className="section-title" id="services-title">Services &amp;<br />Genuine Parts</h2>
            <p className="section-subtitle" style={{textAlign: 'left',maxWidth:'100%',margin:'16px 0 36px'}}>Your Royal
              Enfield deserves nothing but the best. Our certified technicians and authorised service centre keep
              your machine in peak condition.</p>
            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon"><i className="fa-solid fa-wrench"></i></div>
                <h4>Expert Servicing</h4>
                <p>Scheduled maintenance by RE-certified technicians using precision tools and diagnostics.</p>
              </div>
              <div className="service-card">
                <div className="service-icon"><i className="fa-solid fa-gear"></i></div>
                <h4>Genuine Parts</h4>
                <p>OEM spare parts with factory warranty. No counterfeits, no compromises.</p>
              </div>
              <div className="service-card">
                <div className="service-icon"><i className="fa-solid fa-road"></i></div>
                <h4>Roadside Assistance</h4>
                <p>24×7 emergency support wherever the road takes you. One call away.</p>
              </div>
              <div className="service-card">
                <div className="service-icon"><i className="fa-solid fa-file-contract"></i></div>
                <h4>AMC Plans</h4>
                <p>Annual Maintenance Contracts that give you peace of mind and predictable costs.</p>
              </div>
              <div className="service-card">
                <div className="service-icon"><i className="fa-solid fa-shield"></i></div>
                <h4>Insurance Renewal</h4>
                <p>Hassle-free insurance renewal and claim assistance through our in-house desk.</p>
              </div>
              <div className="service-card">
                <div className="service-icon"><i className="fa-solid fa-spray-can-sparkles"></i></div>
                <h4>Custom Accessories</h4>
                <p>Personalise your ride with official Royal Enfield accessories and custom fitment.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
