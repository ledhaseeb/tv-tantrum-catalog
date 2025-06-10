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
                <strong>Last updated:</strong> 10/06/2025
              </p>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 mb-4">
                  By accessing and using TV Tantrum, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
                <p className="text-gray-700 mb-4">
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Use License</h2>
                <p className="text-gray-700 mb-4">
                  Permission is granted to temporarily access and use TV Tantrum for personal, non-commercial purposes only.
                </p>
                <p className="text-gray-700 mb-4">
                  This license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Content</h2>
                <p className="text-gray-700 mb-4">
                  Users may post reviews, ratings, and other content. You are responsible for the content you post and must ensure it does not violate any laws or infringe on others' rights.
                </p>
                <p className="text-gray-700 mb-4">
                  We reserve the right to remove any content that we deem inappropriate or that violates these terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Children's Content Guidelines</h2>
                <p className="text-gray-700 mb-4">
                  Our platform focuses on children's media. All content recommendations and reviews should be appropriate for family audiences.
                </p>
                <p className="text-gray-700 mb-4">
                  We take the safety and appropriateness of children's content seriously and will remove any inappropriate material.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Prohibited Uses</h2>
                <p className="text-gray-700 mb-4">
                  You may not use our service for any unlawful purpose, to harass others, to post inappropriate content, or to attempt to gain unauthorized access to our systems.
                </p>
                <p className="text-gray-700 mb-4">
                  Violation of these prohibitions may result in termination of your access to the service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Disclaimer</h2>
                <p className="text-gray-700 mb-4">
                  The information on this website is provided on an "as is" basis. We make no warranties, expressed or implied, and disclaim all other warranties.
                </p>
                <p className="text-gray-700 mb-4">
                  Content recommendations are based on user reviews and algorithmic analysis, but suitability for individual children may vary.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitations</h2>
                <p className="text-gray-700 mb-4">
                  In no event shall TV Tantrum or its suppliers be liable for any damages arising out of the use or inability to use the service.
                </p>
                <p className="text-gray-700 mb-4">
                  We are not responsible for the content of external websites or streaming services that we may link to or reference.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Modifications</h2>
                <p className="text-gray-700 mb-4">
                  We may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the current version.
                </p>
                <p className="text-gray-700 mb-4">
                  Material changes will be posted prominently on our website before they take effect.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms of Service, please contact us at:
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