import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — Essential Matwork',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-primary hover:text-primary-light transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to app
          </Link>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1">
            Privacy Policy
          </h1>
          <p className="text-muted text-sm">
            Last updated: 4 April 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="prose prose-sm max-w-none text-foreground/80 space-y-8">

          {/* 1. Introduction */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              1. Introduction
            </h2>
            <p className="text-[14px] leading-relaxed">
              Essential Matwork (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a Pilates reference and client management
              tool designed for certified Pilates instructors. We are committed to protecting the privacy
              and personal data of both our users (instructors) and the clients whose information is
              managed through the platform.
            </p>
            <p className="text-[14px] leading-relaxed mt-2">
              This policy explains what data we collect, why we collect it, how it is stored and
              protected, and your rights under the General Data Protection Regulation (GDPR) and
              other applicable data protection laws.
            </p>
          </section>

          {/* 2. Data Controller */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              2. Data Controller
            </h2>
            <p className="text-[14px] leading-relaxed">
              The data controller for information processed through Essential Matwork is the Pilates
              instructor who creates an account and manages client records. Essential Matwork provides
              the technical platform; the instructor determines the purposes and means of processing
              their clients&apos; personal data.
            </p>
          </section>

          {/* 3. Data We Collect */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              3. Data We Collect
            </h2>

            <h3 className="font-heading text-[15px] font-semibold text-foreground mt-4 mb-2">
              3.1 Instructor Account Data
            </h3>
            <ul className="list-disc list-inside text-[14px] leading-relaxed space-y-1">
              <li>Email address (for authentication and account recovery)</li>
              <li>Password (stored as a secure hash; we never store plaintext passwords)</li>
            </ul>

            <h3 className="font-heading text-[15px] font-semibold text-foreground mt-4 mb-2">
              3.2 Client Data (Managed by Instructor)
            </h3>
            <p className="text-[14px] leading-relaxed mb-2">
              When an instructor creates a client record, the following data may be collected:
            </p>
            <ul className="list-disc list-inside text-[14px] leading-relaxed space-y-1">
              <li><strong>Identity:</strong> First name, last name, and age</li>
              <li><strong>Health information:</strong> Medical conditions, injuries, surgeries, pain areas,
                medications, and pregnancy status (as provided via the intake questionnaire)</li>
              <li><strong>Lifestyle information:</strong> Occupation, daily activities, repetitive movements,
                exercise habits, and stress/sleep quality</li>
              <li><strong>Functional concerns:</strong> Balance, flexibility, mobility, and posture-related issues</li>
              <li><strong>Pilates goals:</strong> Client-stated objectives for their Pilates practice</li>
              <li><strong>Postural assessments:</strong> Observations from side, front, and back view analysis,
                spine sequencing notes, and posture classification</li>
              <li><strong>Class plans:</strong> Exercise selections and session notes</li>
            </ul>
            <p className="text-[14px] leading-relaxed mt-2">
              <strong>Note on minimal data collection:</strong> We deliberately collect age (as a number) rather
              than date of birth, and do not require any government-issued identifiers. We follow the
              principle of data minimisation — only data that is necessary for safe and effective Pilates
              instruction is collected.
            </p>

            <h3 className="font-heading text-[15px] font-semibold text-foreground mt-4 mb-2">
              3.3 Invoicing and Business Data
            </h3>
            <p className="text-[14px] leading-relaxed">
              Client first and last names are also used by the instructor for the purpose of generating
              invoices and managing their business relationship. This constitutes a legitimate interest
              under GDPR Article 6(1)(f). Any additional billing data (e.g. address, payment details)
              is managed by the instructor outside of the Essential Matwork platform, using their own
              invoicing tools or systems.
            </p>
          </section>

          {/* 4. Legal Basis for Processing */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              4. Legal Basis for Processing
            </h2>
            <p className="text-[14px] leading-relaxed mb-2">
              We process personal data on the following legal grounds:
            </p>
            <ul className="list-disc list-inside text-[14px] leading-relaxed space-y-2">
              <li>
                <strong>Consent (Article 6(1)(a)):</strong> Client data is only stored after the instructor
                confirms that they have obtained explicit consent from the client. This consent is recorded
                with a timestamp in the system.
              </li>
              <li>
                <strong>Legitimate interest (Article 6(1)(f)):</strong> Processing of client names for
                invoicing and business administration purposes.
              </li>
              <li>
                <strong>Contract performance (Article 6(1)(b)):</strong> Processing of instructor account
                data to provide the service.
              </li>
            </ul>

            <h3 className="font-heading text-[15px] font-semibold text-foreground mt-4 mb-2">
              4.1 Special Category Data (Health Data)
            </h3>
            <p className="text-[14px] leading-relaxed">
              Health-related information (injuries, medical conditions, pain areas) is classified as
              special category data under GDPR Article 9. This data is processed on the basis of
              <strong> explicit consent</strong> obtained by the instructor from their client, for the purpose
              of providing safe and appropriate Pilates instruction. The instructor is responsible for
              obtaining and documenting this consent before entering health data into the system.
            </p>
          </section>

          {/* 5. How Data is Stored and Protected */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              5. How Data is Stored and Protected
            </h2>
            <ul className="list-disc list-inside text-[14px] leading-relaxed space-y-2">
              <li>All data is stored in a secure PostgreSQL database hosted by <strong>Supabase</strong>,
                with servers located in the EU.</li>
              <li>Data is encrypted in transit (TLS/SSL) and at rest.</li>
              <li>Access to client data is restricted through Row Level Security (RLS) policies — each
                instructor can only access their own clients&apos; records.</li>
              <li>Authentication is handled securely via Supabase Auth with hashed passwords.</li>
              <li>The application is hosted on <strong>Vercel</strong>, which complies with GDPR requirements.</li>
            </ul>
          </section>

          {/* 6. Data Retention */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              6. Data Retention
            </h2>
            <p className="text-[14px] leading-relaxed">
              Client data is retained for as long as the instructor maintains an active account and
              has not deleted the client record. Instructors can delete individual client records at
              any time, which will permanently remove all associated data (intake forms, assessments,
              and class plans).
            </p>
            <p className="text-[14px] leading-relaxed mt-2">
              If an instructor deletes their account, all associated data (including all client records)
              will be permanently deleted within 30 days.
            </p>
          </section>

          {/* 7. Your Rights */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              7. Your Rights
            </h2>

            <h3 className="font-heading text-[15px] font-semibold text-foreground mt-4 mb-2">
              For Instructors (Account Holders)
            </h3>
            <p className="text-[14px] leading-relaxed mb-2">You have the right to:</p>
            <ul className="list-disc list-inside text-[14px] leading-relaxed space-y-1">
              <li>Access all data stored in your account</li>
              <li>Correct or update your account information</li>
              <li>Delete your account and all associated data</li>
              <li>Export your data in a portable format</li>
            </ul>

            <h3 className="font-heading text-[15px] font-semibold text-foreground mt-4 mb-2">
              For Clients (Whose Data is Managed by an Instructor)
            </h3>
            <p className="text-[14px] leading-relaxed mb-2">
              As a client of a Pilates instructor using Essential Matwork, you have the right to:
            </p>
            <ul className="list-disc list-inside text-[14px] leading-relaxed space-y-1">
              <li><strong>Access:</strong> Request to see what data your instructor holds about you</li>
              <li><strong>Rectification:</strong> Ask your instructor to correct any inaccurate data</li>
              <li><strong>Erasure:</strong> Request that your instructor delete all your data (&quot;right to be forgotten&quot;)</li>
              <li><strong>Withdraw consent:</strong> Withdraw your consent for data processing at any time</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Complaint:</strong> Lodge a complaint with your local data protection authority</li>
            </ul>
            <p className="text-[14px] leading-relaxed mt-2">
              To exercise these rights, please contact your Pilates instructor directly. The instructor
              can manage your data through the platform, including full deletion of your records.
            </p>
          </section>

          {/* 8. Consent for Client Data */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              8. Consent for Client Data
            </h2>
            <p className="text-[14px] leading-relaxed">
              Before storing any client data, the instructor must confirm that they have obtained
              the client&apos;s explicit consent. When creating a new client record, the instructor
              acknowledges that:
            </p>
            <ul className="list-disc list-inside text-[14px] leading-relaxed space-y-1 mt-2">
              <li>They have informed the client about what data will be collected</li>
              <li>They have explained why the data is stored (safe Pilates instruction)</li>
              <li>They have informed the client of their right to access, correct, or request
                deletion of their data at any time</li>
              <li>The consent was given freely and can be withdrawn at any time</li>
            </ul>
            <p className="text-[14px] leading-relaxed mt-2">
              The date and time of this consent confirmation is automatically recorded in the system.
            </p>
          </section>

          {/* 9. Third-Party Services */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              9. Third-Party Services
            </h2>
            <p className="text-[14px] leading-relaxed mb-2">
              Essential Matwork uses the following third-party services:
            </p>
            <ul className="list-disc list-inside text-[14px] leading-relaxed space-y-1">
              <li><strong>Supabase</strong> — Database hosting, authentication, and storage (EU-hosted)</li>
              <li><strong>Vercel</strong> — Application hosting and deployment</li>
            </ul>
            <p className="text-[14px] leading-relaxed mt-2">
              We do not sell, share, or transfer personal data to any other third parties. We do not
              use analytics trackers, advertising services, or social media pixels.
            </p>
          </section>

          {/* 10. Cookies */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              10. Cookies
            </h2>
            <p className="text-[14px] leading-relaxed">
              Essential Matwork uses only <strong>essential cookies</strong> required for authentication
              and session management. We do not use any tracking, advertising, or analytics cookies.
              No cookie consent banner is required as these cookies are strictly necessary for the
              service to function.
            </p>
          </section>

          {/* 11. Data Breach Notification */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              11. Data Breach Notification
            </h2>
            <p className="text-[14px] leading-relaxed">
              In the event of a personal data breach that poses a risk to the rights and freedoms of
              individuals, we will notify affected users within 72 hours and, where required, the
              relevant data protection authority, in accordance with GDPR Article 33.
            </p>
          </section>

          {/* 12. Changes to This Policy */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              12. Changes to This Policy
            </h2>
            <p className="text-[14px] leading-relaxed">
              We may update this privacy policy from time to time. Any changes will be posted on this
              page with an updated &quot;last updated&quot; date. We encourage you to review this policy
              periodically.
            </p>
          </section>

          {/* 13. Contact */}
          <section>
            <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
              13. Contact
            </h2>
            <p className="text-[14px] leading-relaxed">
              If you have any questions about this privacy policy or your data, please contact us
              through the application or reach out to your Pilates instructor directly.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center">
          <Link
            href="/"
            className="text-[13px] font-medium text-primary hover:text-primary-light transition-colors"
          >
            Back to Essential Matwork
          </Link>
        </div>
      </div>
    </div>
  )
}
