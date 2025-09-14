import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogIn, Loader2 } from "lucide-react";
import { SiGoogle, SiGithub, SiReplit } from "react-icons/si";

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
}

export function AuthProviders({ 
  className = "", 
  buttonSize = "default", 
  layout = "vertical",
  title = "Sign in with",
  showTitle = true
}: AuthProvidersProps) {
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch available providers from backend
  useEffect(() => {
    async function fetchProviders() {
      try {
        const response = await fetch('/api/auth/providers');
        if (response.ok) {
          const data = await response.json();
          // Prioritize Google OAuth and include available providers
          const providers = data.providers || ['google', 'replit'];
          // Always put Google first if available
          const sortedProviders = providers.includes('google') 
            ? ['google', ...providers.filter(p => p !== 'google')]
            : providers;
          setAvailableProviders(sortedProviders);
        } else {
          // Default to Google OAuth as primary
          setAvailableProviders(['google', 'replit']);
        }
      } catch (error) {
        console.error('Error fetching auth providers:', error);
        // Default to Google OAuth as primary
        setAvailableProviders(['google', 'replit']);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProviders();
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
      url: '/api/auth/google',
      color: 'bg-blue-600 hover:bg-blue-700'
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

  // Multiple providers - show all options
  return (
    <div className={className}>
      {showTitle && (
        <div className="text-center mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
        </div>
      )}
      
      <div className={`space-y-3 ${layout === 'horizontal' ? 'sm:space-y-0 sm:space-x-3 sm:flex' : ''}`}>
        {providers.map((provider, index) => (
          <div key={provider.id} className={layout === 'horizontal' ? 'flex-1' : ''}>
            <Button
              size={buttonSize}
              variant="outline"
              onClick={() => window.location.href = provider.url}
              className={`w-full border-2 hover:border-primary/50 transition-colors ${
                layout === 'horizontal' ? 'flex-1' : ''
              }`}
              data-testid={`button-login-${provider.id}`}
            >
              {provider.icon}
              <span className="ml-2">
                {layout === 'horizontal' && providers.length > 2 ? provider.name : `Continue with ${provider.name}`}
              </span>
            </Button>
            
            {/* Add separator between providers except for the last one */}
            {index < providers.length - 1 && layout === 'vertical' && (
              <div className="flex items-center my-4">
                <Separator className="flex-1" />
                <span className="px-2 text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {providers.length > 1 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Choose your preferred authentication method
          </p>
        </div>
      )}
    </div>
  );
}