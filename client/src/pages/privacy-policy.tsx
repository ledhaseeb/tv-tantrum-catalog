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
                <strong>Last updated:</strong> [DATE TO BE PROVIDED]
              </p>

              <div className="text-gray-700">
                <p className="mb-4">
                  Content to be provided by user for the Privacy Policy.
                </p>
                <p className="mb-4">
                  This page will include comprehensive privacy information covering data collection, 
                  usage, storage, and user rights in accordance with applicable privacy laws.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}