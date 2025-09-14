import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./contexts/theme-context";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import i18n from "./lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import OrderStatus from "@/pages/order-status";
import Rates from "@/pages/rates";
import Support from "@/pages/support";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";
import { AdminLoginPage } from "@/pages/admin-login";
import { AdminPanelPage } from "@/pages/admin-panel";
import Landing from "@/pages/landing";
import UserDashboard from "@/pages/user-dashboard";

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      {/* Main exchange page - always accessible */}
      <Route path="/" component={Home} />
      <Route path="/exchange" component={Home} />
      
      {/* Public pages - accessible by everyone */}
      <Route path="/order-status" component={OrderStatus} />
      <Route path="/rates" component={Rates} />
      <Route path="/support" component={Support} />
      <Route path="/about" component={About} />
      
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
