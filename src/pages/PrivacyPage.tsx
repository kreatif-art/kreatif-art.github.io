export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-neutral-300">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Data We Collect</h2>
            <p className="mt-2">When you create an account, we collect your email address and display name. When you upload content, we store the file, title, description, genre, and a timestamp of the originality attestation.</p>
            <p className="mt-2">We also collect data about your interactions: likes, subscriptions, and reports you submit. This data is associated with your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">2. How We Use Your Data</h2>
            <ul className="mt-2 list-inside list-disc space-y-1 pl-4">
              <li>To display your profile and uploaded content to other users</li>
              <li>To show like counts, subscriber counts, and leaderboard rankings</li>
              <li>To process reports and moderate content</li>
              <li>To send password reset emails when requested</li>
              <li>To maintain the originality attestation legal record</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">3. Data Storage</h2>
            <p className="mt-2">Your data is stored in a secure database. Uploaded files (audio and images) are stored in object storage. Passwords are hashed using industry-standard algorithms and are never stored or transmitted in plain text.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">4. Data Sharing</h2>
            <p className="mt-2">Your profile information (display name, avatar, bio) and uploaded content are publicly visible on the platform. Your email address is not shown to other users. We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">5. Cookies &amp; Sessions</h2>
            <p className="mt-2">We use authentication tokens stored in your browser to keep you signed in. These tokens expire automatically and can be cleared by signing out.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">6. Your Rights</h2>
            <p className="mt-2">You can view and edit your profile at any time. You can delete your uploaded content. To delete your account and associated data, contact <a href="mailto:kreatif@atomicmail.io" className="text-orange-400 hover:text-orange-300">kreatif@atomicmail.io</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">7. Data Retention</h2>
            <p className="mt-2">Your content and profile data are retained as long as your account is active. Originality attestations are retained as legal records and may be kept even after content deletion.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">8. Contact</h2>
            <p className="mt-2">Privacy questions? Contact <a href="mailto:kreatif@atomicmail.io" className="text-orange-400 hover:text-orange-300">kreatif@atomicmail.io</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
