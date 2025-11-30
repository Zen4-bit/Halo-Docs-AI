import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="container pb-24 pt-12">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-300 to-accent-sky text-white shadow-glow-brand">
            <FileText className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">Terms of Service</h1>
          <p className="mt-3 text-sm uppercase tracking-[0.3em] text-white/50">
            Last updated: November 8, 2024
          </p>
        </header>

        <div className="space-y-10 rounded-[2.5rem] border border-white/10 bg-surface-200/70 p-10 shadow-ring-soft backdrop-blur-3xl">
          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">1. Acceptance of terms</h2>
            <p className="text-sm text-muted-100/80">
              By accessing and using HALO Docs AI, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">2. Description of service</h2>
            <p className="text-sm text-muted-100/80">
              HALO Docs AI provides AI-powered document processing services including but not limited to summarization, translation, content improvement, PDF manipulation, and other document-related tools. The service is provided "as is" and "as available" without any warranties.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">3. User accounts</h2>
            <p className="mb-4 text-sm text-muted-100/80">
              When you create an account with us, you must provide accurate, complete, and current information. You are responsible for:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm text-white/80">
              <li>Maintaining the security of your account and password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">4. Acceptable use</h2>
            <p className="mb-4 text-sm text-muted-100/80">
              You agree not to use the service to:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm text-white/80">
              <li>Upload illegal, harmful, or offensive content</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit viruses or malicious code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Use the service for any commercial purpose without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">5. Content ownership</h2>
            <p className="text-sm text-muted-100/80">
              You retain all rights to the documents you upload. By uploading content, you grant us a limited license to process, store, and display your content solely for the purpose of providing our services. We do not claim ownership of your content.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">6. Service limitations</h2>
            <p className="mb-4 text-sm text-muted-100/80">
              Our service has certain limitations:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm text-white/80">
              <li>File size limits (50MB per file on free plan)</li>
              <li>Monthly processing limits based on your plan</li>
              <li>Supported file formats: PDF, DOC, DOCX, TXT</li>
              <li>AI processing may not be 100% accurate</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">7. Payment terms</h2>
            <p className="text-sm text-muted-100/80">
              Paid subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law. We reserve the right to change our pricing with 30 days notice.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">8. Termination</h2>
            <p className="text-sm text-muted-100/80">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these terms. Upon termination, your right to use the service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">9. Limitation of liability</h2>
            <p className="text-sm text-muted-100/80">
              In no event shall HALO Docs AI be liable for any indirect, incidental, special, consequential or punitive damages, including loss of profits, data, or other intangible losses resulting from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">10. Changes to terms</h2>
            <p className="text-sm text-muted-100/80">
              We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service. Your continued use of the service after such modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">11. Contact information</h2>
            <p className="text-sm text-muted-100/80">
              If you have any questions about these Terms, please contact us at:
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
