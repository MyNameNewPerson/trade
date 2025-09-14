import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Globe, Star } from "lucide-react";
import { AuthProviders } from "@/components/auth-providers";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Star className="w-3 h-3 mr-1" />
            Trusted by thousands worldwide
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Secure Cryptocurrency
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block">
              Exchange Platform
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Exchange crypto to crypto and crypto to fiat with enterprise-level security, real-time rates, 
            and optional KYC compliance. Join thousands of users who trust our platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="flex flex-col gap-4">
              <AuthProviders 
                buttonSize="lg" 
                layout="vertical"
                showTitle={false}
                className="min-w-[280px]"
              />
            </div>
            
            <div className="flex items-center">
              <div className="hidden sm:block w-px h-16 bg-gradient-to-b from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
              <span className="sm:hidden text-sm text-gray-400 dark:text-gray-500">or</span>
            </div>
            
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => document.getElementById('features')?.scrollIntoView()}
              className="border-2"
            >
              Learn More
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="w-10 h-10 text-blue-600 mb-4" />
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Maximum protection with session-based authentication, encrypted data storage, and rate limiting
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Zap className="w-10 h-10 text-green-600 mb-4" />
              <CardTitle>Real-Time Rates</CardTitle>
              <CardDescription>
                Live exchange rates with fixed and floating options, powered by multiple API providers
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
            <CardHeader>
              <Globe className="w-10 h-10 text-purple-600 mb-4" />
              <CardTitle>Multi-Language Support</CardTitle>
              <CardDescription>
                Available in English, Russian, and Romanian with localized payment methods
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Authentication Methods */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              Secure Authentication Options
            </CardTitle>
            <CardDescription>
              Choose your preferred way to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 mx-auto mb-2 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">G</span>
                </div>
                <p className="text-sm font-medium">Google</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-bold">GH</span>
                </div>
                <p className="text-sm font-medium">GitHub</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">A</span>
                </div>
                <p className="text-sm font-medium">Apple ID</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 mx-auto mb-2 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">@</span>
                </div>
                <p className="text-sm font-medium">Email</p>
              </div>
            </div>
            
            <div className="text-center pt-4">
              <Button 
                onClick={() => window.location.href = '/api/login'} 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                data-testid="button-get-started"
              >
                Get Started - It's Free
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}