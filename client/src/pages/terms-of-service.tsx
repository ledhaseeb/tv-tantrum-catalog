export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-heading font-bold text-primary-800 mb-6">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using TV Tantrum, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">2. Description of Service</h2>
            <p className="mb-4">
              TV Tantrum is a platform that provides information about children's television shows 
              and content, including reviews, ratings, and sensory information to help parents 
              make informed decisions about appropriate content for their children.
            </p>
            <p>
              Our service includes user-generated content such as reviews and ratings, which 
              reflect the opinions of individual users and not necessarily those of TV Tantrum.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">3. User Accounts</h2>
            <p className="mb-4">
              To access certain features of our service, you may be required to create an account. 
              You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information when creating your account</li>
              <li>Maintain the security of your password and account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">4. User Content and Conduct</h2>
            <p className="mb-4">
              When using our service, you agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Post content that is illegal, harmful, threatening, or offensive</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the intellectual property rights of others</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt our service</li>
              <li>Post spam or unsolicited promotional material</li>
            </ul>
            <p className="mt-4">
              You retain ownership of content you submit, but grant us a license to use, 
              display, and distribute your content in connection with our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">5. Content Accuracy</h2>
            <p>
              While we strive to provide accurate information about television shows and content, 
              we make no warranties about the completeness, reliability, or accuracy of this information. 
              Users should use their own judgment when making decisions about appropriate content for their children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">6. Third-Party Content and Links</h2>
            <p>
              Our service may contain links to third-party websites or services. We are not 
              responsible for the content, privacy policies, or practices of these third-party sites. 
              We also display third-party advertisements, which are not endorsements of the 
              products or services advertised.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">7. Intellectual Property</h2>
            <p>
              The TV Tantrum platform, including its design, functionality, and original content, 
              is protected by copyright and other intellectual property laws. You may not reproduce, 
              distribute, or create derivative works without our explicit permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">8. Privacy</h2>
            <p>
              Your privacy is important to us. Our Privacy Policy explains how we collect, 
              use, and protect your information when you use our service. By using our service, 
              you agree to our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">9. Disclaimer of Warranties</h2>
            <p>
              Our service is provided "as is" without warranties of any kind, either express or implied. 
              We do not warrant that the service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">10. Limitation of Liability</h2>
            <p>
              In no event shall TV Tantrum be liable for any indirect, incidental, special, 
              or consequential damages arising out of or in connection with your use of our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">11. Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account and access to our service 
              at our sole discretion, without notice, for conduct that we believe violates these 
              terms or is harmful to other users or our service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of 
              significant changes by posting a notice on our website. Your continued use of 
              our service after such modifications constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">13. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with applicable laws, 
              without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-primary-700 mb-3">14. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <p className="mt-2 font-medium">
              Email: hello@tvtantrum.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}