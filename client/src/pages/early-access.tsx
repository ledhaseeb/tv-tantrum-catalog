import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/LoginForm";
import { RegistrationForm } from "@/components/RegistrationForm";
import { useAuth } from "@/hooks/use-auth";

export default function EarlyAccessPage() {
  const [activeTab, setActiveTab] = useState("login");
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user has the early access token
    const token = localStorage.getItem("earlyAccessToken");
    if (!token) {
      setLocation("/token-entry");
    }
  }, [setLocation]);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation("/home");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Column - Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center font-bold">Early Access</CardTitle>
              <CardDescription className="text-center">
                Welcome to TV Tantrum's exclusive early access. Login or create an account to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <LoginForm onSuccess={() => setLocation("/home")} />
                  <div className="mt-4 text-center text-sm">
                    <span className="text-muted-foreground">Don't have an account?</span>{" "}
                    <button 
                      className="text-primary hover:underline"
                      onClick={() => setActiveTab("register")}
                    >
                      Register here
                    </button>
                  </div>
                </TabsContent>
                <TabsContent value="register">
                  <RegistrationForm onSuccess={() => setLocation("/registration-pending")} />
                  <div className="mt-4 text-center text-sm">
                    <span className="text-muted-foreground">Already have an account?</span>{" "}
                    <button 
                      className="text-primary hover:underline"
                      onClick={() => setActiveTab("login")}
                    >
                      Login here
                    </button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <div className="mt-4 text-center">
            <button 
              className="text-sm text-muted-foreground hover:underline"
              onClick={() => {
                localStorage.removeItem("earlyAccessToken");
                setLocation("/token-entry");
              }}
            >
              ← Back to token entry
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Hero Image & Info */}
      <div className="w-full md:w-1/2 bg-primary p-8 flex items-center justify-center">
        <div className="max-w-md text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            Making Children's TV Viewing a Better Experience
          </h1>
          <p className="text-lg mb-6">
            TV Tantrum helps parents navigate children's media by providing detailed sensory scores and 
            comparative analytics of popular shows.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-white/20 rounded-full p-1 mr-3 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Sensory Impact Analysis</h3>
                <p className="text-sm text-white/80">Understand the stimulation level of each show</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/20 rounded-full p-1 mr-3 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Age-Appropriate Filtering</h3>
                <p className="text-sm text-white/80">Find shows that match your child's developmental stage</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/20 rounded-full p-1 mr-3 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Compare Shows</h3>
                <p className="text-sm text-white/80">Direct comparisons to make informed choices</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}