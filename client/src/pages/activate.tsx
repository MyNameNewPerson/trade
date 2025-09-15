import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Mail, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ActivationStatus = "loading" | "success" | "error" | "expired" | "invalid";

interface ActivationResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    isActive: boolean;
  };
  error?: string;
}

export default function ActivatePage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<ActivationStatus>("loading");
  const [message, setMessage] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const activateAccount = async () => {
      // Get token from URL query params
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (!token) {
        setStatus("invalid");
        setMessage("Activation token is missing. Please check your email link.");
        return;
      }

      try {
        const response = await fetch(`/api/auth/activate?token=${encodeURIComponent(token)}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result: ActivationResponse = await response.json();

        if (response.ok && result.success) {
          setStatus("success");
          setMessage(result.message || "Your account has been activated successfully!");
          setUserEmail(result.user?.email || "");
        } else {
          // Handle different error cases
          if (response.status === 400 && result.error?.includes("expired")) {
            setStatus("expired");
            setMessage("Your activation token has expired. Please register again.");
          } else if (response.status === 404 || result.error?.includes("Invalid")) {
            setStatus("invalid");
            setMessage("Invalid or already used activation token.");
          } else {
            setStatus("error");
            setMessage(result.error || "Account activation failed. Please try again.");
          }
        }
      } catch (error) {
        console.error("Activation error:", error);
        setStatus("error");
        setMessage("Network error. Please check your connection and try again.");
      }
    };

    activateAccount();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        );
      case "success":
        return <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />;
      case "error":
        return <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />;
      case "expired":
        return <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />;
      case "invalid":
        return <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />;
      default:
        return null;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case "loading":
        return "Activating Account...";
      case "success":
        return "Account Activated!";
      case "error":
        return "Activation Failed";
      case "expired":
        return "Token Expired";
      case "invalid":
        return "Invalid Token";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "text-blue-600 dark:text-blue-400";
      case "success":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      case "expired":
        return "text-amber-600 dark:text-amber-400";
      case "invalid":
        return "text-orange-600 dark:text-orange-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case "success":
        return "bg-green-100 dark:bg-green-900";
      case "error":
        return "bg-red-100 dark:bg-red-900";
      case "expired":
        return "bg-amber-100 dark:bg-amber-900";
      case "invalid":
        return "bg-orange-100 dark:bg-orange-900";
      default:
        return "bg-blue-100 dark:bg-blue-900";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <Card className="bg-white/10 border-white/20 backdrop-blur text-center">
          <CardHeader>
            <div className={`mx-auto mb-4 p-3 ${getBackgroundColor()} rounded-full w-16 h-16 flex items-center justify-center`}>
              {getStatusIcon()}
            </div>
            <CardTitle className={`text-2xl text-white ${getStatusColor()}`}>
              {getStatusTitle()}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {status === "loading" && "Please wait while we activate your account..."}
              {status === "success" && "Welcome to our crypto exchange platform!"}
              {status === "error" && "Something went wrong during activation"}
              {status === "expired" && "Your activation link has expired"}
              {status === "invalid" && "The activation link is not valid"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {message && (
              <Alert 
                variant={status === "success" ? "default" : "destructive"}
                className={status === "success" ? "border-green-200 dark:border-green-800" : ""}
                data-testid={`alert-${status}`}
              >
                <AlertDescription className={status === "success" ? "text-green-800 dark:text-green-200" : ""}>
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {status === "success" && userEmail && (
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Mail className="mx-auto h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                <p className="text-sm text-green-800 dark:text-green-200">
                  Account activated for: <strong>{userEmail}</strong>
                </p>
              </div>
            )}

            {status === "expired" && (
              <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="mx-auto h-6 w-6 text-amber-600 dark:text-amber-400 mb-2" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Activation tokens expire after 24 hours for security reasons.
                </p>
              </div>
            )}

            <div className="pt-4 space-y-3">
              {status === "success" && (
                <Button
                  onClick={() => setLocation("/admin/login")}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold"
                  data-testid="button-login"
                >
                  Sign In Now
                </Button>
              )}

              {(status === "expired" || status === "invalid") && (
                <Button
                  onClick={() => setLocation("/register")}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                  data-testid="button-register-again"
                >
                  Register Again
                </Button>
              )}

              {status === "error" && (
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  data-testid="button-retry"
                >
                  Try Again
                </Button>
              )}

              <Button
                onClick={() => setLocation("/")}
                variant="ghost"
                className="w-full text-white hover:bg-white/10"
                data-testid="button-home"
              >
                Return to Home
              </Button>

              {status === "success" && (
                <div className="text-center text-sm text-gray-300 pt-2">
                  <p>You can now access all platform features!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}