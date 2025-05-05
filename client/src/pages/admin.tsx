import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Admin() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  const handleImport = async () => {
    if (!clientEmail.trim() || !privateKey.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both client email and private key",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiRequest("/api/import-from-spreadsheet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          client_email: clientEmail,
          private_key: privateKey
        })
      });

      toast({
        title: "Success!",
        description: "Successfully imported data from Google Sheets",
        variant: "default"
      });
    } catch (error) {
      console.error("Error importing data:", error);
      
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Admin Tools</h1>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Import Data from Google Sheets</CardTitle>
          <CardDescription>
            Enter your Google Sheets Service Account credentials to import data
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Service Account Email
            </label>
            <Input
              placeholder="your-service-account@project-id.iam.gserviceaccount.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Private Key
            </label>
            <Textarea
              placeholder="Paste your private key here (including -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----)"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              disabled={loading}
              className="min-h-24 font-mono text-xs"
            />
            <p className="text-xs text-gray-500">
              These credentials are used only for the current session and are not stored on our servers.
            </p>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button
            onClick={handleImport}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Importing..." : "Import Data"}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4">How to Get These Credentials</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Step 1: Create Service Account</h3>
            <p className="text-gray-700">
              Create a service account in Google Cloud Console with the "Viewer" role.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Step 2: Create Key</h3>
            <p className="text-gray-700">
              Generate a JSON key for your service account and download it.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Step 3: Share Spreadsheet</h3>
            <p className="text-gray-700">
              Share your Google Spreadsheet with the service account email address.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Step 4: Copy Credentials</h3>
            <p className="text-gray-700">
              From the downloaded JSON file, copy the "client_email" and "private_key" values.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}