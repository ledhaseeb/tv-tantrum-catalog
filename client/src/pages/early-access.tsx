import { useState, useEffect } from "react";
import { useLocation, useRouter } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// Secret token for early access
const EARLY_ACCESS_TOKEN = "tv-tantrum-early-2025";

export default function EarlyAccessPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [token, setToken] = useState("");
  const [isValidToken, setIsValidToken] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerCountry, setRegisterCountry] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [pendingApproval, setPendingApproval] = useState(false);

  // Check if the token in the URL is valid
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    
    if (urlToken === EARLY_ACCESS_TOKEN) {
      setIsValidToken(true);
      setToken(urlToken);
    }
  }, []);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/home");
    }
  }, [user, isLoading, navigate]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token === EARLY_ACCESS_TOKEN) {
      setIsValidToken(true);
      // Update URL with token
      const newUrl = `${window.location.pathname}?token=${token}`;
      window.history.pushState({}, "", newUrl);
    } else {
      toast({
        title: "Invalid Token",
        description: "The early access token you entered is not valid.",
        variant: "destructive",
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync({
        email: loginEmail,
        password: loginPassword,
      });
    } catch (error) {
      // Error is handled by the mutation
      if ((error as Error).message.includes("pending approval")) {
        setPendingApproval(true);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== registerPasswordConfirm) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await registerMutation.mutateAsync({
        email: registerEmail,
        username: registerUsername,
        country: registerCountry,
        password: registerPassword,
      });
      toast({
        title: "Registration successful",
        description: "Your account has been created and is pending admin approval.",
      });
      setPendingApproval(true);
    } catch (error) {
      // Show specific error messages
      const errorMsg = (error as Error).message || "Registration failed";
      
      // Custom error handling based on the error message
      if (errorMsg.includes("Username already taken")) {
        toast({
          title: "Username already taken",
          description: "Please choose a different username.",
          variant: "destructive",
        });
      } else if (errorMsg.includes("Email already registered")) {
        toast({
          title: "Email already registered",
          description: "This email is already registered in our system.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pendingApproval) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Approval Pending</CardTitle>
            <CardDescription className="text-center">
              Your account has been created but requires admin approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>
              Thank you for registering for early access to TV Tantrum. Your account is
              pending approval by our administrators.
            </p>
            <p>
              You will be notified via email once your account is approved and you can
              log in to access the application.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Early Access</CardTitle>
            <CardDescription className="text-center">
              Enter your early access token to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTokenSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Early Access Token</Label>
                <Input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your token"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">TV Tantrum Early Access</CardTitle>
          <CardDescription className="text-center">
            Log in or create an account to access the beta version
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    placeholder="yourusername"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select 
                    value={registerCountry}
                    onValueChange={(value) => setRegisterCountry(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                      <SelectItem value="Albania">Albania</SelectItem>
                      <SelectItem value="Algeria">Algeria</SelectItem>
                      <SelectItem value="Andorra">Andorra</SelectItem>
                      <SelectItem value="Angola">Angola</SelectItem>
                      <SelectItem value="Antigua and Barbuda">Antigua and Barbuda</SelectItem>
                      <SelectItem value="Argentina">Argentina</SelectItem>
                      <SelectItem value="Armenia">Armenia</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="Austria">Austria</SelectItem>
                      <SelectItem value="Azerbaijan">Azerbaijan</SelectItem>
                      <SelectItem value="Bahamas">Bahamas</SelectItem>
                      <SelectItem value="Bahrain">Bahrain</SelectItem>
                      <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                      <SelectItem value="Barbados">Barbados</SelectItem>
                      <SelectItem value="Belarus">Belarus</SelectItem>
                      <SelectItem value="Belgium">Belgium</SelectItem>
                      <SelectItem value="Belize">Belize</SelectItem>
                      <SelectItem value="Benin">Benin</SelectItem>
                      <SelectItem value="Bhutan">Bhutan</SelectItem>
                      <SelectItem value="Bolivia">Bolivia</SelectItem>
                      <SelectItem value="Bosnia and Herzegovina">Bosnia and Herzegovina</SelectItem>
                      <SelectItem value="Botswana">Botswana</SelectItem>
                      <SelectItem value="Brazil">Brazil</SelectItem>
                      <SelectItem value="Brunei">Brunei</SelectItem>
                      <SelectItem value="Bulgaria">Bulgaria</SelectItem>
                      <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                      <SelectItem value="Burundi">Burundi</SelectItem>
                      <SelectItem value="Cabo Verde">Cabo Verde</SelectItem>
                      <SelectItem value="Cambodia">Cambodia</SelectItem>
                      <SelectItem value="Cameroon">Cameroon</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Central African Republic">Central African Republic</SelectItem>
                      <SelectItem value="Chad">Chad</SelectItem>
                      <SelectItem value="Chile">Chile</SelectItem>
                      <SelectItem value="China">China</SelectItem>
                      <SelectItem value="Colombia">Colombia</SelectItem>
                      <SelectItem value="Comoros">Comoros</SelectItem>
                      <SelectItem value="Congo">Congo</SelectItem>
                      <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                      <SelectItem value="Croatia">Croatia</SelectItem>
                      <SelectItem value="Cuba">Cuba</SelectItem>
                      <SelectItem value="Cyprus">Cyprus</SelectItem>
                      <SelectItem value="Czech Republic">Czech Republic</SelectItem>
                      <SelectItem value="Denmark">Denmark</SelectItem>
                      <SelectItem value="Djibouti">Djibouti</SelectItem>
                      <SelectItem value="Dominica">Dominica</SelectItem>
                      <SelectItem value="Dominican Republic">Dominican Republic</SelectItem>
                      <SelectItem value="Ecuador">Ecuador</SelectItem>
                      <SelectItem value="Egypt">Egypt</SelectItem>
                      <SelectItem value="El Salvador">El Salvador</SelectItem>
                      <SelectItem value="Equatorial Guinea">Equatorial Guinea</SelectItem>
                      <SelectItem value="Eritrea">Eritrea</SelectItem>
                      <SelectItem value="Estonia">Estonia</SelectItem>
                      <SelectItem value="Eswatini">Eswatini</SelectItem>
                      <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                      <SelectItem value="Fiji">Fiji</SelectItem>
                      <SelectItem value="Finland">Finland</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Gabon">Gabon</SelectItem>
                      <SelectItem value="Gambia">Gambia</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Germany">Germany</SelectItem>
                      <SelectItem value="Ghana">Ghana</SelectItem>
                      <SelectItem value="Greece">Greece</SelectItem>
                      <SelectItem value="Grenada">Grenada</SelectItem>
                      <SelectItem value="Guatemala">Guatemala</SelectItem>
                      <SelectItem value="Guinea">Guinea</SelectItem>
                      <SelectItem value="Guinea-Bissau">Guinea-Bissau</SelectItem>
                      <SelectItem value="Guyana">Guyana</SelectItem>
                      <SelectItem value="Haiti">Haiti</SelectItem>
                      <SelectItem value="Honduras">Honduras</SelectItem>
                      <SelectItem value="Hungary">Hungary</SelectItem>
                      <SelectItem value="Iceland">Iceland</SelectItem>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="Indonesia">Indonesia</SelectItem>
                      <SelectItem value="Iran">Iran</SelectItem>
                      <SelectItem value="Iraq">Iraq</SelectItem>
                      <SelectItem value="Ireland">Ireland</SelectItem>
                      <SelectItem value="Israel">Israel</SelectItem>
                      <SelectItem value="Italy">Italy</SelectItem>
                      <SelectItem value="Jamaica">Jamaica</SelectItem>
                      <SelectItem value="Japan">Japan</SelectItem>
                      <SelectItem value="Jordan">Jordan</SelectItem>
                      <SelectItem value="Kazakhstan">Kazakhstan</SelectItem>
                      <SelectItem value="Kenya">Kenya</SelectItem>
                      <SelectItem value="Kiribati">Kiribati</SelectItem>
                      <SelectItem value="Kosovo">Kosovo</SelectItem>
                      <SelectItem value="Kuwait">Kuwait</SelectItem>
                      <SelectItem value="Kyrgyzstan">Kyrgyzstan</SelectItem>
                      <SelectItem value="Laos">Laos</SelectItem>
                      <SelectItem value="Latvia">Latvia</SelectItem>
                      <SelectItem value="Lebanon">Lebanon</SelectItem>
                      <SelectItem value="Lesotho">Lesotho</SelectItem>
                      <SelectItem value="Liberia">Liberia</SelectItem>
                      <SelectItem value="Libya">Libya</SelectItem>
                      <SelectItem value="Liechtenstein">Liechtenstein</SelectItem>
                      <SelectItem value="Lithuania">Lithuania</SelectItem>
                      <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                      <SelectItem value="Madagascar">Madagascar</SelectItem>
                      <SelectItem value="Malawi">Malawi</SelectItem>
                      <SelectItem value="Malaysia">Malaysia</SelectItem>
                      <SelectItem value="Maldives">Maldives</SelectItem>
                      <SelectItem value="Mali">Mali</SelectItem>
                      <SelectItem value="Malta">Malta</SelectItem>
                      <SelectItem value="Marshall Islands">Marshall Islands</SelectItem>
                      <SelectItem value="Mauritania">Mauritania</SelectItem>
                      <SelectItem value="Mauritius">Mauritius</SelectItem>
                      <SelectItem value="Mexico">Mexico</SelectItem>
                      <SelectItem value="Micronesia">Micronesia</SelectItem>
                      <SelectItem value="Moldova">Moldova</SelectItem>
                      <SelectItem value="Monaco">Monaco</SelectItem>
                      <SelectItem value="Mongolia">Mongolia</SelectItem>
                      <SelectItem value="Montenegro">Montenegro</SelectItem>
                      <SelectItem value="Morocco">Morocco</SelectItem>
                      <SelectItem value="Mozambique">Mozambique</SelectItem>
                      <SelectItem value="Myanmar">Myanmar</SelectItem>
                      <SelectItem value="Namibia">Namibia</SelectItem>
                      <SelectItem value="Nauru">Nauru</SelectItem>
                      <SelectItem value="Nepal">Nepal</SelectItem>
                      <SelectItem value="Netherlands">Netherlands</SelectItem>
                      <SelectItem value="New Zealand">New Zealand</SelectItem>
                      <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                      <SelectItem value="Niger">Niger</SelectItem>
                      <SelectItem value="Nigeria">Nigeria</SelectItem>
                      <SelectItem value="North Korea">North Korea</SelectItem>
                      <SelectItem value="North Macedonia">North Macedonia</SelectItem>
                      <SelectItem value="Norway">Norway</SelectItem>
                      <SelectItem value="Oman">Oman</SelectItem>
                      <SelectItem value="Pakistan">Pakistan</SelectItem>
                      <SelectItem value="Palau">Palau</SelectItem>
                      <SelectItem value="Palestine">Palestine</SelectItem>
                      <SelectItem value="Panama">Panama</SelectItem>
                      <SelectItem value="Papua New Guinea">Papua New Guinea</SelectItem>
                      <SelectItem value="Paraguay">Paraguay</SelectItem>
                      <SelectItem value="Peru">Peru</SelectItem>
                      <SelectItem value="Philippines">Philippines</SelectItem>
                      <SelectItem value="Poland">Poland</SelectItem>
                      <SelectItem value="Portugal">Portugal</SelectItem>
                      <SelectItem value="Qatar">Qatar</SelectItem>
                      <SelectItem value="Romania">Romania</SelectItem>
                      <SelectItem value="Russia">Russia</SelectItem>
                      <SelectItem value="Rwanda">Rwanda</SelectItem>
                      <SelectItem value="Saint Kitts and Nevis">Saint Kitts and Nevis</SelectItem>
                      <SelectItem value="Saint Lucia">Saint Lucia</SelectItem>
                      <SelectItem value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</SelectItem>
                      <SelectItem value="Samoa">Samoa</SelectItem>
                      <SelectItem value="San Marino">San Marino</SelectItem>
                      <SelectItem value="Sao Tome and Principe">Sao Tome and Principe</SelectItem>
                      <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                      <SelectItem value="Senegal">Senegal</SelectItem>
                      <SelectItem value="Serbia">Serbia</SelectItem>
                      <SelectItem value="Seychelles">Seychelles</SelectItem>
                      <SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                      <SelectItem value="Slovakia">Slovakia</SelectItem>
                      <SelectItem value="Slovenia">Slovenia</SelectItem>
                      <SelectItem value="Solomon Islands">Solomon Islands</SelectItem>
                      <SelectItem value="Somalia">Somalia</SelectItem>
                      <SelectItem value="South Africa">South Africa</SelectItem>
                      <SelectItem value="South Korea">South Korea</SelectItem>
                      <SelectItem value="South Sudan">South Sudan</SelectItem>
                      <SelectItem value="Spain">Spain</SelectItem>
                      <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                      <SelectItem value="Sudan">Sudan</SelectItem>
                      <SelectItem value="Suriname">Suriname</SelectItem>
                      <SelectItem value="Sweden">Sweden</SelectItem>
                      <SelectItem value="Switzerland">Switzerland</SelectItem>
                      <SelectItem value="Syria">Syria</SelectItem>
                      <SelectItem value="Taiwan">Taiwan</SelectItem>
                      <SelectItem value="Tajikistan">Tajikistan</SelectItem>
                      <SelectItem value="Tanzania">Tanzania</SelectItem>
                      <SelectItem value="Thailand">Thailand</SelectItem>
                      <SelectItem value="Timor-Leste">Timor-Leste</SelectItem>
                      <SelectItem value="Togo">Togo</SelectItem>
                      <SelectItem value="Tonga">Tonga</SelectItem>
                      <SelectItem value="Trinidad and Tobago">Trinidad and Tobago</SelectItem>
                      <SelectItem value="Tunisia">Tunisia</SelectItem>
                      <SelectItem value="Turkey">Turkey</SelectItem>
                      <SelectItem value="Turkmenistan">Turkmenistan</SelectItem>
                      <SelectItem value="Tuvalu">Tuvalu</SelectItem>
                      <SelectItem value="Uganda">Uganda</SelectItem>
                      <SelectItem value="Ukraine">Ukraine</SelectItem>
                      <SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Uruguay">Uruguay</SelectItem>
                      <SelectItem value="Uzbekistan">Uzbekistan</SelectItem>
                      <SelectItem value="Vanuatu">Vanuatu</SelectItem>
                      <SelectItem value="Vatican City">Vatican City</SelectItem>
                      <SelectItem value="Venezuela">Venezuela</SelectItem>
                      <SelectItem value="Vietnam">Vietnam</SelectItem>
                      <SelectItem value="Yemen">Yemen</SelectItem>
                      <SelectItem value="Zambia">Zambia</SelectItem>
                      <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={registerPasswordConfirm}
                    onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground text-center">
            By registering, you'll receive early access once your account
            is approved by an administrator.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}