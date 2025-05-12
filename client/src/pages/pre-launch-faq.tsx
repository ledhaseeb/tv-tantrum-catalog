import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PreLaunchFAQ() {
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
            <Link href="/about">About</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-12 px-4 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-xl font-medium">
              What is TV Tantrum?
            </AccordionTrigger>
            <AccordionContent className="text-lg">
              TV Tantrum is a platform that analyzes children's TV shows based on their sensory impact. 
              We provide detailed information about elements like animation style, scene frequency, music tempo, 
              dialogue intensity, and overall stimulation level to help parents make informed decisions about 
              what their children watch.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-xl font-medium">
              When will TV Tantrum launch?
            </AccordionTrigger>
            <AccordionContent className="text-lg">
              We're currently in the final stages of development and plan to launch in the coming weeks. 
              Join our waitlist now to qualify for early access to the platform before the public launch. 
              Only users who pre-register will be able to access TV Tantrum during the early access period.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-xl font-medium">
              What is a "stimulation score"?
            </AccordionTrigger>
            <AccordionContent className="text-lg">
              A stimulation score is our proprietary rating that measures how stimulating a show is for a child's 
              developing brain. Shows with higher scores contain more fast-paced scenes, louder sound effects, 
              and more intense visual elements. This score helps parents find content that matches their child's 
              sensory preferences and needs.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4">
            <AccordionTrigger className="text-xl font-medium">
              How many shows does TV Tantrum analyze?
            </AccordionTrigger>
            <AccordionContent className="text-lg">
              At launch, we'll have detailed analyses of over 300 popular children's shows, with new shows 
              being added regularly. We prioritize shows based on popularity and user requests.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger className="text-xl font-medium">
              Will TV Tantrum be free to use?
            </AccordionTrigger>
            <AccordionContent className="text-lg">
              Yes! TV Tantrum will be completely free to use. All features, including detailed show analyses, 
              filtering tools, and personalized recommendations will be available to everyone at no cost. 
              We believe that all parents should have access to this important information regardless of 
              their financial situation.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-6">
            <AccordionTrigger className="text-xl font-medium">
              How do I suggest a show to be analyzed?
            </AccordionTrigger>
            <AccordionContent className="text-lg">
              Once we launch, registered users will be able to suggest shows for analysis by using a simple 
              request form directly on our website. Our content team reviews all suggestions and prioritizes 
              new additions based on popularity and educational value.
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-7">
            <AccordionTrigger className="text-xl font-medium">
              What age ranges does TV Tantrum cover?
            </AccordionTrigger>
            <AccordionContent className="text-lg">
              We analyze shows suitable for children from ages 0-13+, with particular focus on the crucial 
              developmental stages from toddlerhood through elementary school years.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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
            <p className="mt-2">Have another question? Email us at support@tvtantrum.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}