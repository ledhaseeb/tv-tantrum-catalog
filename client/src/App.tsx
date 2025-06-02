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
import AuthPage from "@/pages/auth-page-new";
import AdminPage from "@/pages/admin-page";
import LandingPage from "@/pages/landing-page";
import PreLaunchAbout from "@/pages/pre-launch-about";
import PreLaunchFAQ from "@/pages/pre-launch-faq";
import TokenEntryPage from "@/pages/token-entry";
import RegistrationPendingPage from "@/pages/registration-pending";
import UserDashboard from "@/pages/user-dashboard";
import UserProfile from "@/pages/user-profile";
import SubmitShow from "@/pages/submit-show";
import Research from "@/pages/research";
import ResearchDetail from "@/pages/research-detail";
import ResearchView from "@/pages/research-view";
import SharePage from "@/pages/share";
import AdminResearchLinks from "@/pages/admin-research-links";
import AdminResearchManager from "@/pages/admin-research-manager";
import CompleteRegistration from "@/pages/complete-registration";
import ColorPaletteCustomizer from "@/components/ColorPaletteCustomizer";
import { AuthProvider } from "@/hooks/use-auth";
import { ApprovedRoute } from "@/lib/protected-route-approved";
import { AdminRoute } from "@/lib/protected-route-admin";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  // Access URL to check for development mode
  const isDevMode = window.location.search.includes('dev=true');
  
  // Check if user has early access token stored in localStorage
  const hasEarlyAccess = localStorage.getItem("earlyAccessShown") === "true";

  return (
    <div className="min-h-screen flex flex-col">
      <Switch>
        {/* Home Page - Open to everyone */}
        <Route path="/">
          <div className="flex-grow flex flex-col">
            <Navbar />
            <div className="flex-grow">
              <Home />
            </div>
            <Footer />
          </div>
        </Route>
        
        {/* Landing Page Route */}
        <Route path="/landing">
          <LandingPage />
        </Route>
        <Route path="/about">
          <PreLaunchAbout />
        </Route>
        <Route path="/faq">
          <PreLaunchFAQ />
        </Route>
        <Route path="/token-entry">
          <TokenEntryPage />
        </Route>
        <Route path="/early-access">
          <AuthPage />
        </Route>
        <Route path="/registration-pending">
          <RegistrationPendingPage />
        </Route>
        <Route path="/complete-registration">
          <CompleteRegistration />
        </Route>
        
        {/* Share page - accessible to all users */}
        <Route path="/share/:id">
          {(params) => (
            <SharePage />
          )}
        </Route>
        
        {/* Home Page Alias - Open to everyone */}
        <Route path="/home">
          <div className="flex-grow flex flex-col">
            <Navbar />
            <div className="flex-grow">
              <Home />
            </div>
            <Footer />
          </div>
        </Route>
        
        {/* Browse Page - Open to everyone */}
        <Route path="/browse">
          <div className="flex-grow flex flex-col">
            <Navbar />
            <div className="flex-grow">
              <Browse />
            </div>
            <Footer />
          </div>
        </Route>

        {/* Show Detail Pages - Open to everyone */}
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
        <Route path="/detail/:id">
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

        {/* Compare Page - Open to everyone */}
        <Route path="/compare">
          <div className="flex-grow flex flex-col">
            <Navbar />
            <div className="flex-grow">
              <Compare />
            </div>
            <Footer />
          </div>
        </Route>

        {isDevMode ? (
          <Route path="/app-about">
            <div className="flex-grow flex flex-col">
              <Navbar />
              <div className="flex-grow">
                <About />
              </div>
              <Footer />
            </div>
          </Route>
        ) : (
          <ApprovedRoute 
            path="/app-about" 
            component={() => (
              <div className="flex-grow flex flex-col">
                <Navbar />
                <div className="flex-grow">
                  <About />
                </div>
                <Footer />
              </div>
            )} 
          />
        )}

        {/* Auth page is always accessible */}
        <Route path="/auth">
          <div className="flex-grow flex flex-col">
            <Navbar />
            <div className="flex-grow">
              <AuthPage />
            </div>
            <Footer />
          </div>
        </Route>

        {/* Login page - redirect to auth */}
        <Route path="/login">
          <div className="flex-grow flex flex-col">
            <Navbar />
            <div className="flex-grow">
              <AuthPage />
            </div>
            <Footer />
          </div>
        </Route>

        {/* User Dashboard - Requires authentication */}
        <ProtectedRoute 
          path="/user-dashboard" 
          component={() => (
            <div className="flex-grow flex flex-col">
              <Navbar />
              <div className="flex-grow">
                <UserDashboard />
              </div>
              <Footer />
            </div>
          )} 
        />
        <ProtectedRoute 
          path="/dashboard" 
          component={() => (
            <div className="flex-grow flex flex-col">
              <Navbar />
              <div className="flex-grow">
                <UserDashboard />
              </div>
              <Footer />
            </div>
          )} 
        />
        <Route path="/user/:userId">
          {(params) => (
            <div className="flex-grow flex flex-col">
              <Navbar />
              <div className="flex-grow">
                <UserProfile />
              </div>
              <Footer />
            </div>
          )}
        </Route>

        {/* Submit Show - Requires authentication */}
        <ProtectedRoute 
          path="/submit-show" 
          component={() => (
            <div className="flex-grow flex flex-col">
              <Navbar />
              <div className="flex-grow">
                <SubmitShow />
              </div>
              <Footer />
            </div>
          )} 
        />

        {/* Research Pages */}
        <Route path="/research">
          <div className="flex-grow flex flex-col">
            <Navbar />
            <div className="flex-grow">
              <Research />
            </div>
            <Footer />
          </div>
        </Route>
        <Route path="/research/:id">
          {(params) => (
            <div className="flex-grow flex flex-col">
              <Navbar />
              <div className="flex-grow">
                <ResearchDetail id={parseInt(params.id, 10)} />
              </div>
              <Footer />
            </div>
          )}
        </Route>

        {/* Admin route with approval and admin check */}
        {isDevMode ? (
          <>
            <Route path="/admin">
              <div className="flex-grow flex flex-col">
                <Navbar />
                <div className="flex-grow">
                  <AdminPage />
                </div>
                <Footer />
              </div>
            </Route>
            <Route path="/admin/research">
              <div className="flex-grow flex flex-col">
                <Navbar />
                <div className="flex-grow">
                  <AdminResearchManager />
                </div>
                <Footer />
              </div>
            </Route>
          </>
        ) : (
          <>
            <AdminRoute 
              path="/admin" 
              component={() => (
                <div className="flex-grow flex flex-col">
                  <Navbar />
                  <div className="flex-grow">
                    <AdminPage />
                  </div>
                  <Footer />
                </div>
              )} 
            />
            <AdminRoute 
              path="/admin/research" 
              component={() => (
                <div className="flex-grow flex flex-col">
                  <Navbar />
                  <div className="flex-grow">
                    <AdminResearchManager />
                  </div>
                  <Footer />
                </div>
              )} 
            />
          </>
        )}
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
