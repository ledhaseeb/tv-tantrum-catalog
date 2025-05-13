import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import GhlScriptLoader from "@/components/GhlScriptLoader";
// Import the preview image to ensure it's properly bundled
import previewImage from "../assets/tv-tantrum-preview.png";

export default function LandingPage() {
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <GhlScriptLoader />
      {/* Header */}
      <header className="container mx-auto py-6 flex justify-between items-center">
        <Link href="/">
          <div className="text-3xl font-bold text-primary cursor-pointer">TV Tantrum</div>
        </Link>
        <div className="flex space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/about">About</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/faq">FAQ</Link>
          </Button>
          <Button variant="outline" className="text-primary border-primary hover:bg-primary/10" asChild>
            <Link href="/token-entry">Early Access</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            <span className="text-primary">Discover</span> children's TV shows based on sensory impact
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-md">
            TV Tantrum helps parents understand how stimulating different TV shows are, 
            so you can make informed choices about what your children watch.
          </p>
          
          <div className="mt-6 flex justify-start">
            <Button className="text-lg px-8 py-6" size="lg">
              <a href="#register">Join the Waitlist</a>
            </Button>
          </div>
          
          <p className="mt-4 text-lg text-primary font-medium">
            Sign up now to secure early access! Only pre-registered users will be able to 
            access TV Tantrum during our exclusive early access period.
          </p>
        </div>
        
        <div className="relative">
          <Card className="bg-card/50 backdrop-blur shadow-xl transform rotate-1">
            <CardContent className="p-6">
              <img 
                src={previewImage} 
                alt="TV Tantrum Preview" 
                className="rounded-lg shadow-md w-full"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23F1F5F9' /%3E%3Cg fill='%2364748b'%3E%3Ctext x='300' y='180' font-family='Arial, sans-serif' font-size='24' text-anchor='middle'%3ETV Tantrum Preview%3C/text%3E%3Ctext x='300' y='220' font-family='Arial, sans-serif' font-size='16' text-anchor='middle'%3EComing Soon%3C/text%3E%3C/g%3E%3C/svg%3E";
                }}
              />
            </CardContent>
          </Card>
          <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg transform rotate-3">
            Coming Soon!
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto py-16 text-center">
        <h2 className="text-3xl font-bold mb-12">Why Parents Choose TV Tantrum</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-4.04Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-4.04Z"/></svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Sensory Impact Analysis</h3>
            <p className="text-muted-foreground">Understand exactly how stimulating each show is based on detailed sensory metrics.</p>
          </div>
          
          <div className="p-6 bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Personalized Recommendations</h3>
            <p className="text-muted-foreground">Discover shows that match your child's sensory preferences and developmental stage.</p>
          </div>
          
          <div className="p-6 bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <h3 className="text-xl font-medium mb-2">Parent Reviews</h3>
            <p className="text-muted-foreground">Read what other parents have to say about each show's impact on their children.</p>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="register" className="container mx-auto py-16 px-4">
        <div className="max-w-3xl mx-auto bg-card rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Join the Waitlist</h2>
            <p className="text-center text-muted-foreground mb-6">
              Be the first to know when TV Tantrum launches. Get early access and exclusive updates!
            </p>
            
            <div className="h-[500px]">
              <iframe
                src="https://api.leadconnectorhq.com/widget/form/8RE4HTUpZosOwqlmcA6g"
                style={{ width: "100%", height: "100%", border: "none", borderRadius: "3px" }}
                id="inline-8RE4HTUpZosOwqlmcA6g" 
                data-layout={`{'id':'INLINE'}`}
                data-trigger-type="alwaysShow"
                data-trigger-value=""
                data-activation-type="alwaysActivated"
                data-activation-value=""
                data-deactivation-type="neverDeactivate"
                data-deactivation-value=""
                data-form-name="TV Tantrum Pre-reg"
                data-height="492"
                data-layout-iframe-id="inline-8RE4HTUpZosOwqlmcA6g"
                data-form-id="8RE4HTUpZosOwqlmcA6g"
                title="TV Tantrum Pre-reg"
              />
              <script src="https://link.msgsndr.com/js/form_embed.js" async></script>
            </div>
            
            <p className="text-center text-primary font-medium mt-4">
              Remember, only pre-registered users will be granted access during our early access period before public launch!
            </p>
            <p className="text-center text-muted-foreground text-sm mt-2">
              Already have an early access token? <Link href="/token-entry" className="text-primary hover:underline">Click here</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Simple Copyright Footer */}
      <div className="container mx-auto py-8 text-center text-muted-foreground">
        <p>© {new Date().getFullYear()} TV Tantrum. All rights reserved.</p>
      </div>
    </div>
  );
}