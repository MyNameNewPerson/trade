import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserPlus, AlertCircle, CheckCircle, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registerSchema, type RegisterRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<RegisterRequest>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      login: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  const onSubmit = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        toast({
          title: "Registration Successful!",
          description: "Please check your email to activate your account.",
        });
        
        // Reset form
        form.reset();
      } else {
        throw new Error(result.error || "Registration failed");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
        <div className="w-full max-w-md space-y-8">
          <Card className="bg-white/10 border-white/20 backdrop-blur text-center">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl text-white">Check Your Email!</CardTitle>
              <CardDescription className="text-gray-300">
                We've sent you an activation link to complete your registration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Mail className="mx-auto h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Please click the activation link in your email to activate your account.
                  The link expires in 24 hours.
                </p>
              </div>
              
              <div className="pt-4 space-y-3">
                <Button
                  onClick={() => setLocation("/")}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  data-testid="button-home"
                >
                  Return to Home
                </Button>
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setError("");
                  }}
                  variant="ghost"
                  className="w-full text-white hover:bg-white/10"
                  data-testid="button-register-another"
                >
                  Register Another Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-blue-400" />
          <h2 className="mt-6 text-3xl font-bold text-white">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            Join our crypto exchange platform
          </p>
        </div>

        <Card className="bg-white/10 border-white/20 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Registration</CardTitle>
            <CardDescription className="text-gray-300">
              Fill in your details to create a new account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4" data-testid="alert-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="login"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Login</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter your login"
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 h-12 sm:h-10 text-base sm:text-sm"
                          data-testid="input-login"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="your@email.com"
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 h-12 sm:h-10 text-base sm:text-sm"
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 h-12 sm:h-10 text-base sm:text-sm"
                          data-testid="input-password"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                      <p className="text-xs text-gray-400 mt-1">
                        At least 8 characters with uppercase, lowercase, and number
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="••••••••"
                          className="bg-white/10 border-white/20 text-white placeholder-gray-400 focus:border-blue-500 h-12 sm:h-10 text-base sm:text-sm"
                          data-testid="input-password-confirm"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="pt-4 space-y-3">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold h-12 sm:h-10 text-base sm:text-sm"
                    data-testid="button-register"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  <div className="text-center text-sm text-gray-300">
                    Already have an account?{" "}
                    <Link 
                      href="/admin/login"
                      className="text-blue-400 hover:text-blue-300 font-medium"
                      data-testid="link-login"
                    >
                      Sign in here
                    </Link>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}