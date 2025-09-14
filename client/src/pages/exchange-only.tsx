import { Header } from "@/components/header";
import { ExchangeWidget } from "@/components/exchange-widget";

export default function ExchangeOnly() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-300">
      <Header />
      
      {/* Clean Exchange Page - Just the widget */}
      <main className="min-h-screen gradient-bg">
        <div className="container mx-auto px-4 py-12">
          {/* Centered Exchange Widget */}
          <div className="flex justify-center items-center min-h-[80vh]">
            <ExchangeWidget />
          </div>
        </div>
      </main>
    </div>
  );
}