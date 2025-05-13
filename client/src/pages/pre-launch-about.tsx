import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PreLaunchAbout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="container mx-auto py-6 flex justify-between items-center">
        <Link href="/">
          <div className="text-3xl font-bold text-primary cursor-pointer">TV Tantrum</div>
        </Link>
        <div className="flex space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/faq">FAQ</Link>
          </Button>
          <Button variant="outline" className="text-primary border-primary hover:bg-primary/10" asChild>
            <Link href="/early-access">Early Access</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">About TV Tantrum</h1>
        
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
          <p>
            TV Tantrum was created with a simple mission: to help parents and caregivers 
            make informed decisions about the children's TV shows their little ones watch. 
            We believe that understanding the sensory and developmental impact of media is 
            crucial for creating a balanced and healthy viewing experience.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">What Makes Us Different</h2>
          <p>
            Unlike traditional content rating systems that focus primarily on age-appropriateness 
            and content warnings, TV Tantrum analyzes shows based on their sensory impact - 
            elements like animation style, scene frequency, music tempo, dialogue intensity, 
            and overall stimulation level. These factors can significantly affect how children 
            process and respond to media.
          </p>

          <div className="bg-primary/10 p-6 rounded-lg my-8">
            <h3 className="text-xl font-medium mb-2">Our Comprehensive Analysis Includes:</h3>
            <ul className="mt-4 space-y-2">
              <li><strong>Stimulation Score:</strong> An overall rating of how stimulating a show is</li>
              <li><strong>Sensory Metrics:</strong> Detailed breakdowns of visual pacing, sound effects, and music</li>
              <li><strong>Thematic Analysis:</strong> Identification of educational themes and values</li>
              <li><strong>Age-Range Guidance:</strong> Developmentally appropriate age recommendations</li>
              <li><strong>Parent Reviews:</strong> Real feedback from other caregivers</li>
            </ul>
          </div>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Story</h2>
          <p>
            TV Tantrum began when a group of parents, child development specialists, and media 
            experts came together with a shared concern: the lack of detailed information about 
            how children's shows affect developing minds. After countless hours of research, 
            analysis, and testing with real families, we built a platform that gives parents 
            the insights they need to make media choices aligned with their child's unique 
            sensory profile.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Join Our Community</h2>
          <p>
            We're building a community of thoughtful parents and caregivers who care deeply 
            about the media their children consume. By joining our pre-launch list, you'll be 
            the first to access our full platform when it launches, and you'll help shape the 
            future of how families interact with children's media.
          </p>
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" className="px-8 py-6 text-lg" asChild>
            <Link href="/#register">Join the Waitlist</Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} TV Tantrum. All rights reserved.</p>
            <p className="mt-2">Helping parents make informed choices about children's media.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}