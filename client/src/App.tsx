import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/home";
import Browse from "@/pages/browse";
import Detail from "@/pages/detail";
import Compare from "@/pages/compare";
import About from "@/pages/about";
import AuthPage from "@/pages/auth-page";
import AdminPage from "@/pages/admin-page";
import LandingPage from "@/pages/landing-page";
import PreLaunchAbout from "@/pages/pre-launch-about";
import PreLaunchFAQ from "@/pages/pre-launch-faq";
import EarlyAccessPage from "@/pages/early-access";
import RegistrationPendingPage from "@/pages/registration-pending";
import ColorPaletteCustomizer from "@/components/ColorPaletteCustomizer";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  // Access URL to check for development mode
  const isDevMode = window.location.search.includes('dev=true');
  
  // Check if user has early access token stored in localStorage
  const hasEarlyAccess = localStorage.getItem("earlyAccessShown") === "true";

  return (
    <div className="min-h-screen flex flex-col">
      <Switch>
        {/* Pre-Launch Routes */}
        <Route path="/">
          <LandingPage />
        </Route>
        <Route path="/about">
          <PreLaunchAbout />
        </Route>
        <Route path="/faq">
          <PreLaunchFAQ />
        </Route>
        <Route path="/early-access">
          <EarlyAccessPage />
        </Route>
        <Route path="/registration-pending">
          <RegistrationPendingPage />
        </Route>
        
        {/* Main App Routes - Accessible with dev parameter or after early access approval */}
        {(isDevMode || hasEarlyAccess) && (
          <Route path="/home">
            <div className="flex-grow flex flex-col">
              <Navbar />
              <div className="flex-grow">
                <Home />
              </div>
              <Footer />
            </div>
          </Route>
        )}
        {(isDevMode || hasEarlyAccess) && (
          <Route path="/browse">
            <div className="flex-grow flex flex-col">
              <Navbar />
              <div className="flex-grow">
                <Browse />
              </div>
              <Footer />
            </div>
          </Route>
        )}
        {(isDevMode || hasEarlyAccess) && (
          <Route path="/shows/:id">
            {(params) => (
              <div className="flex-grow flex flex-col">
                <Navbar />
                <div className="flex-grow">
                  <Detail id={parseInt(params.id, 10)} />
                </div>
                <Footer />
              </div>
            )}
          </Route>
        )}
        {(isDevMode || hasEarlyAccess) && (
          <Route path="/compare">
            <div className="flex-grow flex flex-col">
              <Navbar />
              <div className="flex-grow">
                <Compare />
              </div>
              <Footer />
            </div>
          </Route>
        )}
        {(isDevMode || hasEarlyAccess) && (
          <Route path="/app-about">
            <div className="flex-grow flex flex-col">
              <Navbar />
              <div className="flex-grow">
                <About />
              </div>
              <Footer />
            </div>
          </Route>
        )}
        {(isDevMode || hasEarlyAccess) && (
          <Route path="/auth">
            <div className="flex-grow flex flex-col">
              <Navbar />
              <div className="flex-grow">
                <AuthPage />
              </div>
              <Footer />
            </div>
          </Route>
        )}
        <Route path="/admin">
          <div className="flex-grow flex flex-col">
            <Navbar />
            <div className="flex-grow">
              <AdminPage />
            </div>
            <Footer />
          </div>
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
          <ColorPaletteCustomizer />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
