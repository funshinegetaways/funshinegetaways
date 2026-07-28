import Link from 'next/link';

type LegalSection = {
  title: string;
  body: string | string[];
};

type LegalPageProps = {
  title: string;
  intro: string;
  sections: LegalSection[];
  lastUpdated: string;
};

export default function LegalPage({ title, intro, sections, lastUpdated }: LegalPageProps) {
  return (
    <main className="legal-page" style={{ paddingTop: '120px' }}>
      <section className="legal-hero">
        <p className="section-tag">Legal</p>
        <h1>{title}</h1>
        <p>{intro}</p>
        <p className="legal-updated">Last updated: {lastUpdated}</p>
      </section>

      <section className="legal-content">
        {sections.map((section, index) => (
          <article key={`${section.title}-${index}`} className="legal-card">
            <h2>{section.title}</h2>
            {Array.isArray(section.body) ? (
              <ul>
                {section.body.map((item, itemIndex) => (
                  <li key={`${section.title}-${itemIndex}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>{section.body}</p>
            )}
          </article>
        ))}
      </section>

      <section className="legal-footer-card">
        <h2>Need help?</h2>
        <p>If you have any questions about these policies, please contact us at <a href="mailto:funshine.reshowroom@gmail.com">funshine.reshowroom@gmail.com</a> or <a href="/contact">visit our contact page</a>.</p>
        <Link href="/" className="btn-primary">Return Home</Link>
      </section>
    </main>
  );
}
