import { ReactNode, ComponentType } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle, LogIn, ArrowLeft } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'user';
  fallbackComponent?: ComponentType;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/60"></div>
        <div className="text-white/80 text-sm font-medium">Checking permissions...</div>
      </div>
    </div>
  );
}

function AccessDeniedFallback({ requiredRole }: { requiredRole?: string }) {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-6 text-3xl font-bold text-white">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-300">
            You don't have permission to access this page
          </p>
        </div>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-red-400" />
              Insufficient Permissions
            </CardTitle>
            <CardDescription className="text-gray-300">
              {requiredRole === 'admin' 
                ? "This area is restricted to administrators only."
                : "This area requires authentication."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive" className="border-red-500/50 bg-red-900/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                {requiredRole === 'admin' 
                  ? "Contact your system administrator if you believe this is an error."
                  : "Please sign in with an account that has the required permissions."
                }
              </AlertDescription>
            </Alert>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setLocation('/')}
                className="flex-1 border-gray-600 text-white hover:bg-gray-700"
                data-testid="button-go-home"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Home
              </Button>
              {requiredRole === 'admin' && (
                <Button
                  onClick={() => setLocation('/admin/login')}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  data-testid="button-admin-login"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Admin Login
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UnauthenticatedFallback() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-blue-400" />
          <h2 className="mt-6 text-3xl font-bold text-white">Authentication Required</h2>
          <p className="mt-2 text-sm text-gray-300">
            Please sign in to access this page
          </p>
        </div>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Sign In Required</CardTitle>
            <CardDescription className="text-gray-300">
              You must be signed in to view this content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setLocation('/')}
                className="flex-1 border-gray-600 text-white hover:bg-gray-700"
                data-testid="button-go-home-unauth"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Home
              </Button>
              <Button
                onClick={() => setLocation('/')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-sign-in"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children, requiredRole = 'user', fallbackComponent: FallbackComponent }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return FallbackComponent ? <FallbackComponent /> : <LoadingFallback />;
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <UnauthenticatedFallback />;
  }

  // Check role requirements
  if (requiredRole && user.role !== requiredRole) {
    // Special case: if user is admin, allow access to user-level routes
    if (!(user.role === 'admin' && requiredRole === 'user')) {
      return <AccessDeniedFallback requiredRole={requiredRole} />;
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>;
}