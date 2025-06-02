export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-heading font-bold text-primary-800 mb-6">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information you provide directly to us, such as when you create an account, 
              write reviews, or contact us. This may include your name, email address, and any content 
              you submit to our platform.
            </p>
            <p>
              We also automatically collect certain information about your device and how you interact 
              with our service, including your IP address, browser type, and pages visited.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">3. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties 
              without your consent, except as described in this policy. We may share your information 
              in certain limited circumstances, such as to comply with legal obligations or protect 
              our rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">4. Advertising</h2>
            <p className="mb-4">
              We use third-party advertising companies to serve ads when you visit our website. 
              These companies may use information about your visits to this and other websites 
              in order to provide advertisements about goods and services of interest to you.
            </p>
            <p>
              We use Google AdSense to display ads on our site. Google's use of advertising cookies 
              enables it and its partners to serve ads based on your visit to our site and/or other 
              sites on the Internet. You may opt out of personalized advertising by visiting 
              Google's Ads Settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">5. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to collect and use personal information 
              about you. You can control cookies through your browser settings, but disabling cookies 
              may affect the functionality of our site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">6. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. However, no method of 
              transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">7. Children's Privacy</h2>
            <p>
              Our service is not directed to children under 13. We do not knowingly collect personal 
              information from children under 13. If you become aware that a child has provided us 
              with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">8. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access, update, or delete your personal information</li>
              <li>Object to processing of your personal information</li>
              <li>Request that we limit the processing of your personal information</li>
              <li>Request portability of your personal information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes 
              by posting the new privacy policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">10. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy, please contact us at:
            </p>
            <p className="mt-2 font-medium">
              Email: privacy@tvtantrum.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}