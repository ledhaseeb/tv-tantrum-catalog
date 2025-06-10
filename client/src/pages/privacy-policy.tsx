import CatalogNavbar from "@/components/CatalogNavbar";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <CatalogNavbar />
      <div className="flex-grow bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-gray-600 mb-6">
                <strong>Last updated:</strong> 10/06/2025
              </p>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
                <p className="text-gray-700 mb-4">
                  We collect information you provide directly to us, such as when you create an account, write reviews, or contact us. This may include your name, email address, and any content you submit to our platform.
                </p>
                <p className="text-gray-700 mb-4">
                  We also automatically collect certain information about your device and how you interact with our service, including your IP address, browser type, and pages visited.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-700 mb-4">
                  We use the information we collect to provide, maintain, and improve our services, including to personalize content recommendations and communicate with you about our platform.
                </p>
                <p className="text-gray-700 mb-4">
                  We may also use your information to send you updates about new features, shows, or other information we think may interest you, but you can opt out at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Information Sharing</h2>
                <p className="text-gray-700 mb-4">
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.
                </p>
                <p className="text-gray-700 mb-4">
                  We may share aggregated, non-personally identifiable information for research and analytics purposes to help improve our content recommendations.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
                <p className="text-gray-700 mb-4">
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
                <p className="text-gray-700 mb-4">
                  However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Children's Privacy</h2>
                <p className="text-gray-700 mb-4">
                  Our platform is designed to help parents find appropriate content for children, but we do not knowingly collect personal information from children under 13.
                </p>
                <p className="text-gray-700 mb-4">
                  If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
                <p className="text-gray-700 mb-4">
                  You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us.
                </p>
                <p className="text-gray-700 mb-4">
                  To exercise these rights, please contact us using the information provided below.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Changes to This Policy</h2>
                <p className="text-gray-700 mb-4">
                  We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy on our website.
                </p>
                <p className="text-gray-700 mb-4">
                  Your continued use of our service after such changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about this privacy policy or our practices, please contact us at:
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>Email:</strong> hello@tvtantrum.com
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}