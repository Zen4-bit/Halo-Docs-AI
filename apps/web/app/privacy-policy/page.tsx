import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="container pb-24 pt-12">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-300 to-accent-sky text-white shadow-glow-brand">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">Privacy Policy</h1>
          <p className="mt-3 text-sm uppercase tracking-[0.3em] text-white/50">
            Last updated: November 8, 2024
          </p>
        </header>

        <div className="space-y-10 rounded-[2.5rem] border border-white/10 bg-surface-200/70 p-10 shadow-ring-soft backdrop-blur-3xl">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
            <p className="text-sm leading-relaxed text-muted-100/80">
              Welcome to HALO Docs AI. We respect your privacy and are committed to protecting your
              personal data. This privacy policy explains how we handle personal data when you visit
              our website and describes your privacy rights.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">2. Data we collect</h2>
            <p className="mb-4 text-sm text-muted-100/80">
              We may collect, use, store and transfer different kinds of personal data about you:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm text-white/80">
              <li>Identity Data: first name, last name, username</li>
              <li>Contact Data: email address, telephone numbers</li>
              <li>Technical Data: IP address, browser type, time zone setting</li>
              <li>Usage Data: information about how you use our website and services</li>
              <li>Document Data: files you upload for processing</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">3. How we use your data</h2>
            <p className="mb-4 text-sm text-muted-100/80">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm text-white/80">
              <li>To provide and maintain our service</li>
              <li>To process your documents using AI</li>
              <li>To notify you about changes to our service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information to improve our service</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">4. Data security</h2>
            <p className="text-sm text-muted-100/80">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. All uploaded documents are encrypted and stored securely. We limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">5. Data retention</h2>
            <p className="text-sm text-muted-100/80">
              We will only retain your personal data for as long as necessary to fulfil the purposes we collected it for. Uploaded documents are automatically deleted after 30 days unless you choose to delete them earlier.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">6. Your legal rights</h2>
            <p className="mb-4 text-sm text-muted-100/80">
              Under certain circumstances, you have rights under data protection laws in relation to your personal data:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm text-white/80">
              <li>Request access to your personal data</li>
              <li>Request correction of your personal data</li>
              <li>Request erasure of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Request restriction of processing your personal data</li>
              <li>Request transfer of your personal data</li>
              <li>Right to withdraw consent</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">7. Third-party services</h2>
            <p className="text-sm text-muted-100/80">
              We use Halo-AI for document processing, backed by Google Generative AI infrastructure. Your documents are sent to Google's servers for AI processing. Please review Google's privacy policy for more information on how they handle data.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">8. Contact us</h2>
            <p className="text-sm text-muted-100/80">
              If you have any questions about this privacy policy or our privacy practices, please contact us at:
              <br />
              <a href="mailto:py786656@gmail.com" className="text-brand-200 hover:underline">
                py786656@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
