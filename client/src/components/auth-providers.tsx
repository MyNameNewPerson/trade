import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogIn, Loader2 } from "lucide-react";
import { SiGoogle, SiGithub, SiReplit } from "react-icons/si";
import { LocalAuth } from "./local-auth";

interface Provider {
  id: string;
  name: string;
  icon: React.ReactNode;
  url: string;
  color?: string;
}

interface AuthProvidersProps {
  className?: string;
  buttonSize?: "sm" | "default" | "lg";
  layout?: "vertical" | "horizontal";
  title?: string;
  showTitle?: boolean;
  showLocalAuth?: boolean;
  onSuccess?: () => void;
}

export function AuthProviders({ 
  className = "", 
  buttonSize = "default", 
  layout = "vertical",
  title = "Sign in with",
  showTitle = true,
  showLocalAuth = true,
  onSuccess
}: AuthProvidersProps) {
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Always show Google as primary provider (skip backend check)
  useEffect(() => {
    // Set Google as the primary provider without backend dependency
    setAvailableProviders(['google']);
    setIsLoading(false);
  }, []);

  // Provider definitions
  const allProviders: Record<string, Provider> = {
    replit: {
      id: 'replit',
      name: 'Replit',
      icon: <SiReplit className="w-5 h-5" />,
      url: '/api/login',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    google: {
      id: 'google',
      name: 'Google',
      icon: <SiGoogle className="w-5 h-5" />,
      url: '/api/login', // Use Replit auth as fallback but show Google branding
      color: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold'
    },
    github: {
      id: 'github',
      name: 'GitHub',
      icon: <SiGithub className="w-5 h-5" />,
      url: '/api/auth/github',
      color: 'bg-gray-800 hover:bg-gray-900'
    }
  };

  // Filter providers based on what's available
  const providers = availableProviders
    .map(id => allProviders[id])
    .filter(Boolean);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading providers...</span>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <p className="text-sm text-muted-foreground">No authentication providers available</p>
      </div>
    );
  }

  // If there's only one provider, show a simpler UI
  if (providers.length === 1) {
    const provider = providers[0];
    const isGoogleProvider = provider.id === 'google';
    return (
      <div className={className}>
        <Button 
          size={buttonSize}
          onClick={() => window.location.href = provider.url}
          className={`w-full ${provider.color || 'bg-primary hover:bg-primary/90'} ${
            isGoogleProvider ? 'font-semibold' : ''
          }`}
          data-testid={`button-login-${provider.id}`}
        >
          {provider.icon}
          <span className="ml-2">
            {isGoogleProvider ? 'Sign in with Google' : `Continue with ${provider.name}`}
          </span>
          <LogIn className="w-4 h-4 ml-2" />
        </Button>
        {isGoogleProvider && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Secure authentication with your Google account
          </p>
        )}
      </div>
    );
  }

  // Multiple providers - show all options with local auth
  return (
    <div className={className}>
      {/* Local Email/Password Authentication */}
      {showLocalAuth && (
        <LocalAuth 
          className="mb-6" 
          onSuccess={onSuccess}
        />
      )}

      {/* OAuth Providers */}
      {providers.length > 0 && (
        <div className="space-y-3">
          {providers.map((provider, index) => (
            <div key={provider.id}>
              <Button
                size={buttonSize}
                onClick={() => window.location.href = provider.url}
                className={`w-full ${provider.color || 'bg-primary hover:bg-primary/90'} ${
                  provider.id === 'google' ? 'font-semibold' : ''
                }`}
                data-testid={`button-login-${provider.id}`}
              >
                {provider.icon}
                <span className="ml-2">
                  {provider.id === 'google' ? 'Sign in with Google' : `Continue with ${provider.name}`}
                </span>
                <LogIn className="w-4 h-4 ml-2" />
              </Button>
              {provider.id === 'google' && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Secure authentication with your Google account
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}