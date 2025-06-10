import CatalogNavbar from "@/components/CatalogNavbar";
import Footer from "@/components/Footer";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col">
      <CatalogNavbar />
      <div className="flex-grow bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
            
            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-gray-600 mb-6">
                <strong>Last updated:</strong> June 10, 2025
              </p>

              <div className="text-gray-700 space-y-6">
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                  <p className="mb-4">
                    By accessing and using TV Tantrum ("the Service"), you accept and agree to be bound by these Terms of Service. 
                    If you do not agree to these terms, please do not use our service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
                  <p className="mb-4">
                    TV Tantrum is a web-based platform that helps parents discover and evaluate children's television shows. 
                    We provide detailed information about TV shows including stimulation ratings, themes, age appropriateness, 
                    and sensory details to help parents make informed viewing decisions for their children.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts and Registration</h2>
                  <p className="mb-4">
                    You may need to create an account to access certain features. You are responsible for:
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Providing accurate and complete information during registration</li>
                    <li>Maintaining the security of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized use</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
                  <p className="mb-4">You agree to use our service only for lawful purposes and in accordance with these terms. You may not:</p>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Post false, misleading, or inappropriate content about TV shows</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Use automated tools to extract data without permission</li>
                    <li>Interfere with the proper functioning of the service</li>
                    <li>Violate any applicable laws or regulations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Content and Reviews</h2>
                  <p className="mb-4">
                    Users may submit reviews, ratings, and comments about TV shows. By submitting content, you grant us 
                    a non-exclusive license to use, modify, and display your content in connection with our service.
                  </p>
                  <p className="mb-4">
                    We reserve the right to remove content that violates these terms or is deemed inappropriate. 
                    We do not endorse user-generated content and are not responsible for its accuracy.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
                  <p className="mb-4">
                    TV Tantrum and its content are protected by copyright, trademark, and other intellectual property laws. 
                    You may not reproduce, distribute, or create derivative works without our written permission.
                  </p>
                  <p className="mb-4">
                    TV show information, images, and metadata are used for informational purposes under fair use principles. 
                    All rights to TV shows remain with their respective creators and distributors.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Privacy and Data Collection</h2>
                  <p className="mb-4">
                    Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
                    use, and protect your information. By using our service, you consent to our data practices 
                    as described in the Privacy Policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Disclaimers and Limitations</h2>
                  <p className="mb-4">
                    Our service is provided "as is" without warranties of any kind. We make no guarantees about:
                  </p>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>The accuracy or completeness of TV show information</li>
                    <li>The availability or reliability of the service</li>
                    <li>The suitability of content recommendations for your specific needs</li>
                  </ul>
                  <p className="mb-4">
                    <strong>Parental Responsibility:</strong> While we provide detailed information to help guide decisions, 
                    parents and caregivers remain solely responsible for determining what content is appropriate for their children.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
                  <p className="mb-4">
                    To the maximum extent permitted by law, TV Tantrum shall not be liable for any indirect, incidental, 
                    special, consequential, or punitive damages, including but not limited to loss of profits, data, 
                    or other intangible losses resulting from your use of the service.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Advertising and Third-Party Services</h2>
                  <p className="mb-4">
                    Our service may display advertisements and contain links to third-party websites or services. 
                    We are not responsible for the content, privacy practices, or terms of these third parties.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Termination</h2>
                  <p className="mb-4">
                    We may terminate or suspend your access to the service at any time, with or without cause, 
                    with or without notice. You may also terminate your account at any time by contacting us.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to Terms</h2>
                  <p className="mb-4">
                    We reserve the right to modify these terms at any time. We will notify users of material changes 
                    by posting the updated terms on this page and updating the "Last updated" date. 
                    Continued use of the service constitutes acceptance of the new terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Governing Law</h2>
                  <p className="mb-4">
                    These terms shall be governed by and construed in accordance with applicable laws. 
                    Any disputes arising from these terms or your use of the service shall be resolved 
                    through binding arbitration or in courts of competent jurisdiction.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact Information</h2>
                  <p className="mb-4">
                    If you have any questions about these Terms of Service, please contact us at:
                  </p>
                  <p className="mb-4">
                    <strong>Email:</strong> hello@tvtantrum.com<br />
                    <strong>Website:</strong> tvtantrum.com
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Severability</h2>
                  <p className="mb-4">
                    If any provision of these terms is found to be unenforceable or invalid, 
                    the remaining provisions will remain in full force and effect.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}