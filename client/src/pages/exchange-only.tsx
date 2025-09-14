import { Header } from "@/components/header";
import { ExchangeWidget } from "@/components/exchange-widget";

export default function ExchangeOnly() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased transition-colors duration-300">
      <Header />
      
      {/* Enhanced Exchange Page with beautiful gradient */}
      <main className="min-h-screen gradient-bg relative overflow-hidden">
        {/* Floating decoration elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text text-transparent mb-4 animate-slide-up">
              Crypto Exchange
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
              Fast, secure, and reliable cryptocurrency exchange with instant transactions
            </p>
          </div>
          
          {/* Centered Exchange Widget */}
          <div className="flex justify-center items-center">
            <div className="animate-slide-up" style={{animationDelay: '0.4s'}}>
              <ExchangeWidget />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}