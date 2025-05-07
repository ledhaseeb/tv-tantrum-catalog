import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import haseebImage from "@/assets/haseeb_new.png";

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
            <li><span className="font-semibold">Stimulation Score</span> - Measure of how visually and audibly stimulating the content is.</li>
            <li><span className="font-semibold">Themes</span> - Understand what topics and concepts are covered in each show, from adventure and creativity to social-emotional learning and problem-solving.</li>
            <li><span className="font-semibold">Interactivity Level</span> - How engaging and interactive is the content for children?</li>
          </ul>
        </div>
        
        <div className="bg-primary-50 rounded-lg p-6">
          <h2 className="text-2xl font-heading font-bold mb-4">Data Sources</h2>
          <p className="text-gray-700 mb-4">
            Our comprehensive database aggregates ratings and information from:
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
        </div>
      </div>
      
      <h2 className="text-2xl font-heading font-bold mb-6">How to Use Our Features</h2>
      
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
                Narrow down shows by age appropriateness, stimulation score, themes, and more.
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
      
      <h2 className="text-2xl font-heading font-bold mb-6">Understanding Stimulation Ratings</h2>
      
      <div className="bg-gray-50 rounded-lg p-8 mb-12">
        <p className="text-gray-700 mb-6">
          Our stimulation ratings help you understand how a show may affect your child's sensory system and behavior. Lower-rated shows allow for longer watching periods before causing overstimulation, while higher-rated shows may lead to overstimulation more quickly, potentially resulting in tantrums. Keep in mind that younger children are more sensitive to stimulation, while older children can typically handle higher levels of stimulation.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
          <div className="bg-green-100 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">1</div>
              <h3 className="ml-2 text-lg font-bold text-green-800">Low</h3>
            </div>
            <p className="text-green-800">
              Gentle pacing with minimal scene changes. Soft sounds and music. Calm dialogue and predictable content. Ideal for very young children, bedtime viewing, or children sensitive to stimulation.
            </p>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">2</div>
              <h3 className="ml-2 text-lg font-bold text-yellow-800">Low-Medium</h3>
            </div>
            <p className="text-yellow-800">
              Moderate pacing with occasional transitions. Mild sound effects and harmonious music. Engaging but not overwhelming content. Good for longer viewing sessions and younger children.
            </p>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">3</div>
              <h3 className="ml-2 text-lg font-bold text-orange-800">Medium</h3>
            </div>
            <p className="text-orange-800">
              Balanced pacing with regular scene changes. Moderate sound effects and varied music. Mix of calm and exciting moments. Suitable for most children but monitor younger viewers for signs of overstimulation.
            </p>
          </div>
          
          <div className="bg-red-100 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-red-400 flex items-center justify-center text-white font-bold">4</div>
              <h3 className="ml-2 text-lg font-bold text-red-700">Medium-High</h3>
            </div>
            <p className="text-red-700">
              Fast-paced with frequent scene changes. Prominent sound effects and dynamic music. Energetic dialogue and action. Better for older children and shorter viewing sessions. May feel intense to younger viewers.
            </p>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">5</div>
              <h3 className="ml-2 text-lg font-bold text-red-800">High</h3>
            </div>
            <p className="text-red-800">
              Rapid pacing with constant scene changes. Loud sound effects and intense music. Highly energetic content with many elements competing for attention. Use with caution.
            </p>
          </div>
        </div>
      </div>
      
      <div id="contact" className="bg-gray-50 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-heading font-bold mb-6 text-center">Contact Us</h2>
        <p className="text-gray-700 mb-6 text-center max-w-2xl mx-auto">
          Have a question, suggestion, or want to work with us? Use the form below to get in touch with our team.
        </p>
        
        <form className="max-w-xl mx-auto">
          <div className="grid grid-cols-1 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Your name"
              />
            </div>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="your.email@example.com"
              />
            </div>
            
            {/* Phone (optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Your phone number"
              />
            </div>
            
            {/* Enquiry Type */}
            <div>
              <label htmlFor="enquiryType" className="block text-sm font-medium text-gray-700 mb-1">
                Enquiry Type <span className="text-red-500">*</span>
              </label>
              <select
                id="enquiryType"
                name="enquiryType"
                required
                defaultValue=""
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="" disabled>Select an option</option>
                <option value="feedback">Feedback</option>
                <option value="add-show">Add a show listing</option>
                <option value="get-featured">Get featured</option>
                <option value="press">Press</option>
                <option value="partnership">Partnership/Collaborate</option>
              </select>
            </div>
            
            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Your message here..."
              ></textarea>
            </div>
            
            <div>
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </div>
          </div>
        </form>
      </div>
      
      <h2 className="text-2xl font-heading font-bold mb-6">Meet the Team</h2>
      <div className="flex justify-center mb-8">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-64 h-64 rounded-full overflow-hidden mx-auto mb-6">
                <img 
                  src={haseebImage} 
                  alt="Haseeb Ibrahim" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-heading font-bold">Haseeb Ibrahim</h3>
              <p className="text-gray-500">The Founder</p>
              <p className="mt-4 text-gray-600">
                Media researcher and stimulation analyst specializing in children's content.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
