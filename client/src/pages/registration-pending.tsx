import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "wouter";
import { CheckCircle2, Mail } from "lucide-react";

export default function RegistrationPendingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl">Registration Successful!</CardTitle>
          <CardDescription>
            Your account is pending admin approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center">
            Thank you for registering for early access to TV Tantrum. Your account has been
            created successfully but requires administrator approval before you can log in.
          </p>
          <div className="flex items-center justify-center p-4 rounded-lg bg-muted">
            <Mail className="h-6 w-6 mr-2 text-primary" />
            <p className="font-medium">
              We'll email you once your account is approved.
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Please note that approval may take 1-2 business days. In the
            meantime, you can explore our pre-launch information.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/">Return to Home</Link>
          </Button>
          <Button asChild>
            <Link href="/about">Learn More</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}