import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./contexts/theme-context";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import i18n from "./lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import ExchangeOnly from "@/pages/exchange-only"; // Main exchange page - clean widget only

// Lazy load non-critical pages for better performance
const Home = lazy(() => import("@/pages/home"));
const OrderStatus = lazy(() => import("@/pages/order-status"));
const OrderConfirmation = lazy(() => import("@/pages/order-confirmation"));
const Rates = lazy(() => import("@/pages/rates"));
const Support = lazy(() => import("@/pages/support"));
const About = lazy(() => import("@/pages/about"));
const NotFound = lazy(() => import("@/pages/not-found"));
const AdminLoginPage = lazy(() => import("@/pages/admin-login").then(module => ({ default: module.AdminLoginPage })));
const AdminPanelPage = lazy(() => import("@/pages/admin-panel").then(module => ({ default: module.AdminPanelPage })));
const Landing = lazy(() => import("@/pages/landing"));
const UserDashboard = lazy(() => import("@/pages/user-dashboard"));
const RegisterPage = lazy(() => import("@/pages/register"));
const ActivatePage = lazy(() => import("@/pages/activate"));

// High-performance loading component with skeleton
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/60"></div>
        <div className="text-white/80 text-sm font-medium">Loading...</div>
      </div>
    </div>
  );
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* Main exchange page - clean widget only (eager loaded) */}
        <Route path="/" component={ExchangeOnly} />
        <Route path="/exchange" component={ExchangeOnly} />
        
        {/* Full landing page with features (lazy loaded) */}
        <Route path="/home" component={Home} />
        <Route path="/landing" component={Landing} />
        
        {/* Public pages - accessible by everyone (lazy loaded) */}
        <Route path="/order-confirmation" component={OrderConfirmation} />
        <Route path="/order-status" component={OrderStatus} />
        <Route path="/rates" component={Rates} />
        <Route path="/support" component={Support} />
        <Route path="/about" component={About} />
        
        {/* Auth pages - accessible by everyone */}
        <Route path="/register" component={RegisterPage} />
        <Route path="/activate" component={ActivatePage} />
        
        {/* User dashboard - only for authenticated users */}
        {isAuthenticated && (
          <Route path="/dashboard" component={UserDashboard} />
        )}
        
        {/* Admin pages */}
        <Route path="/admin/login" component={AdminLoginPage} />
        {isAuthenticated && (
          <Route path="/admin" component={AdminPanelPage} />
        )}
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
