import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function About() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-heading font-bold text-center mb-8">About TV Tantrum</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-2xl font-heading font-bold mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            TV Tantrum was created to help parents make informed decisions about the children's TV shows their kids watch. We understand that screen time is inevitable, so why not make it count?
          </p>
          <p className="text-gray-700 mb-4">
            Our unique rating system focuses on metrics that matter to parents, including:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li><span className="font-semibold">Tantrum Factor</span> - How likely will your child melt down when the show ends?</li>
            <li><span className="font-semibold">Educational Value</span> - What skills or concepts might children learn?</li>
            <li><span className="font-semibold">Parent Enjoyment</span> - Will you want to leave the room when this show is on?</li>
            <li><span className="font-semibold">Repeat Watchability</span> - How well does it hold up to the inevitable rewatches?</li>
          </ul>
        </div>
        
        <div className="bg-primary-50 rounded-lg p-6">
          <h2 className="text-2xl font-heading font-bold mb-4">Data Sources</h2>
          <p className="text-gray-700 mb-4">
            Our data comes from the TVTantrum GitHub repository, which aggregates ratings and information from:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
            <li>Parent surveys and reviews</li>
            <li>Child development expert assessments</li>
            <li>Content analysis by our team</li>
            <li>User contributions and feedback</li>
          </ul>
          <p className="text-gray-700">
            We're constantly updating our database as new shows emerge and more parents contribute their experiences.
          </p>
          <div className="mt-4">
            <Button variant="outline" className="bg-white">
              <i className="fab fa-github mr-2"></i>
              View on GitHub
            </Button>
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-heading font-bold mb-6">How to Use Our Ratings</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-search text-primary-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-heading font-bold mb-2">Browse</h3>
              <p className="text-gray-600">
                Explore our comprehensive database of children's TV shows with detailed ratings and reviews.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="bg-secondary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-filter text-secondary-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-heading font-bold mb-2">Filter</h3>
              <p className="text-gray-600">
                Narrow down shows by age appropriateness, tantrum factor, educational value, and more.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="bg-accent-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-balance-scale text-accent-600 text-2xl"></i>
              </div>
              <h3 className="text-xl font-heading font-bold mb-2">Compare</h3>
              <p className="text-gray-600">
                Side-by-side comparison of shows to find the best fit for your family and child.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-heart text-red-500 text-2xl"></i>
              </div>
              <h3 className="text-xl font-heading font-bold mb-2">Save</h3>
              <p className="text-gray-600">
                Bookmark your favorite shows and create personalized lists for easy reference.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-heading font-bold mb-6 text-center">Contribute to TV Tantrum</h2>
        <p className="text-gray-700 mb-6 text-center max-w-2xl mx-auto">
          We're always looking to improve our ratings and expand our database. Share your experiences and help other parents make informed choices.
        </p>
        <div className="flex justify-center space-x-4">
          <Button>Submit a Review</Button>
          <Button variant="outline">Suggest a Show</Button>
        </div>
      </div>
      
      <h2 className="text-2xl font-heading font-bold mb-6">Meet the Team</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-user text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-xl font-heading font-bold">Jane Smith</h3>
              <p className="text-gray-500">Founder & Child Development Expert</p>
              <p className="mt-4 text-gray-600">
                Former preschool teacher with 15 years of experience in early childhood education.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-user text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-xl font-heading font-bold">Michael Johnson</h3>
              <p className="text-gray-500">Content Analyst</p>
              <p className="mt-4 text-gray-600">
                Media researcher specializing in children's educational content and entertainment.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-user text-gray-400 text-2xl"></i>
              </div>
              <h3 className="text-xl font-heading font-bold">Sarah Lee</h3>
              <p className="text-gray-500">Parent Coordinator</p>
              <p className="mt-4 text-gray-600">
                Mother of three who oversees our parent review panel and community engagement.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
