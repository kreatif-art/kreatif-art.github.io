export function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-white">Terms of Service &amp; Content Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-neutral-300">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="mt-2">By creating an account or using Kreatif, you agree to these Terms of Service. If you do not agree, do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. Originality &amp; Copyright</h2>
            <p className="mt-2">You may only upload content that you created yourself or hold the legal rights to upload. When you upload content, you must confirm the originality attestation: &ldquo;I confirm this is my own original work or I hold rights to upload it.&rdquo; This attestation is recorded with your user ID and timestamp.</p>
            <p className="mt-2">You retain ownership of your content. By uploading, you grant Kreatif a license to display, distribute, and reproduce your content on the platform for the purpose of operating the service.</p>
            <p className="mt-2">Uploading content that infringes on others&apos; copyrights is prohibited and may result in content removal and account termination.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. DMCA / Takedown Process</h2>
            <p className="mt-2">If you believe content on Kreatif infringes your copyright, you may submit a takedown request. Send a written notice including:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>Your contact information (name, email)</li>
              <li>Identification of the copyrighted work</li>
              <li>The URL of the infringing content on Kreatif</li>
              <li>A statement that you have a good faith belief the use is unauthorized</li>
              <li>A statement under penalty of perjury that the information is accurate and you are the owner or authorized to act</li>
            </ul>
            <p className="mt-2">Send takedown requests to: <a href="mailto:dmca@kreatif.app" className="text-orange-400 hover:text-orange-300">dmca@kreatif.app</a>. We will review and respond to valid requests within 72 hours.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Prohibited Content</h2>
            <p className="mt-2">You may not upload content that is illegal, hateful, harassing, sexually explicit, or promotes violence. Spam and misleading content are also prohibited. Reported content may be hidden or removed by moderators.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Account Responsibilities</h2>
            <p className="mt-2">You are responsible for your account and all content uploaded through it. You must be at least 13 years old to create an account. Keep your password secure and do not share your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Termination</h2>
            <p className="mt-2">We may suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting support.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Disclaimer</h2>
            <p className="mt-2">Kreatif is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for damages arising from use of the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Contact</h2>
            <p className="mt-2">Questions about these terms? Contact us at <a href="mailto:support@kreatif.app" className="text-orange-400 hover:text-orange-300">support@kreatif.app</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
