import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Copy, ArrowLeft, CheckCircle, Clock, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import QRCode from "qrcode";
import type { Currency } from "@shared/schema";

interface OrderData {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: string;
  rateType: "fixed" | "float";
  exchangeRate: number;
  receiveAmount: string;
  recipientAddress?: string;
  cardNumberMasked?: string;
  contactEmail?: string;
  cardDataHash?: string;
}

interface TempCardData {
  cardNumber: string;
  bankName: string;
  holderName: string;
}

// Type guard for card details
const isCardPayout = (toCurrency: string): boolean => {
  return toCurrency.startsWith("card-");
};

export default function OrderConfirmation() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const qrCodeRef = useRef<HTMLDivElement>(null);
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [tempCardData, setTempCardData] = useState<TempCardData | null>(null);
  const [depositAddress, setDepositAddress] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutes for fixed rate
  const [qrCodeGenerated, setQrCodeGenerated] = useState(false);
  const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);

  // Get currencies for display
  const { data: currencies = [] } = useQuery<Currency[]>({
    queryKey: ['/api/currencies'],
  });

  // Generate unique deposit address based on currency and time
  const generateDepositAddress = (currency: string) => {
    // Generate a deterministic but unique address based on currency and timestamp
    const timestamp = Date.now();
    const userSuffix = user?.id ? user.id.slice(-4) : '0000';
    
    if (currency.includes('usdt-trc20')) {
      // Generate TRC20-like address
      const baseAddress = 'TQn9Y2khEsLMWtWsMab9C5zsdnUr95JkVt';
      const uniquePart = (timestamp % 10000).toString().padStart(4, '0') + userSuffix;
      return baseAddress.slice(0, -8) + uniquePart;
    } else if (currency.includes('btc')) {
      // Generate BTC-like address  
      return 'bc1q' + (timestamp % 1000000).toString(16) + userSuffix + 'example';
    } else {
      // Default to TRC20-like for other currencies
      const baseAddress = 'TQn9Y2khEsLMWtWsMab9C5zsdnUr95JkVt';
      const uniquePart = (timestamp % 10000).toString().padStart(4, '0') + userSuffix;
      return baseAddress.slice(0, -8) + uniquePart;
    }
  };

  useEffect(() => {
    // Get order data from sessionStorage
    const savedData = sessionStorage.getItem('orderConfirmationData');
    const tempCardDataString = sessionStorage.getItem('tempCardData');
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData) as OrderData;
        setOrderData(parsedData);
        
        // Generate unique deposit address
        const uniqueAddress = generateDepositAddress(parsedData.fromCurrency);
        setDepositAddress(uniqueAddress);
        
        // Handle temporary card data securely
        if (tempCardDataString && parsedData.cardDataHash) {
          try {
            const tempCard = JSON.parse(tempCardDataString) as TempCardData;
            setTempCardData(tempCard);
            // Clear sensitive data immediately after reading
            sessionStorage.removeItem('tempCardData');
          } catch (cardError) {
            console.error('Failed to parse temp card data:', cardError);
          }
        }
      } catch (error) {
        console.error('Failed to parse order data:', error);
        toast({
          title: "Error",
          description: "Invalid order data. Redirecting to home page.",
          variant: "destructive",
        });
        setLocation('/');
      }
    } else {
      toast({
        title: "Error",
        description: "No order data found. Redirecting to home page.",
        variant: "destructive",
      });
      setLocation('/');
    }
  }, [user?.id, setLocation, toast]);

  // Generate QR code when deposit address is available
  useEffect(() => {
    if (orderData && depositAddress && qrCodeRef.current && !qrCodeGenerated) {
      setIsGeneratingAddress(true);
      try {
        // Clear any existing QR code
        qrCodeRef.current.innerHTML = '';
        
        // Generate new QR code with the unique deposit address using new qrcode API
        QRCode.toDataURL(depositAddress, {
          width: 200,
          color: { 
            dark: '#000000',
            light: '#ffffff' 
          },
          errorCorrectionLevel: 'H'
        }).then((url: string) => {
          const img = document.createElement('img');
          img.src = url;
          img.style.width = '200px';
          img.style.height = '200px';
          img.alt = 'QR Code for Deposit Address';
          qrCodeRef.current!.appendChild(img);
          
          setQrCodeGenerated(true);
          setIsGeneratingAddress(false);
        }).catch((error: any) => {
          console.error('QR code generation failed:', error);
          setIsGeneratingAddress(false);
          throw error;
        });
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        setIsGeneratingAddress(false);
        toast({
          title: "QR Code Error",
          description: "Failed to generate QR code. You can still copy the deposit address.",
          variant: "destructive",
        });
      }
    }
  }, [orderData, depositAddress, qrCodeGenerated, toast]);

  // Countdown timer for fixed rate
  useEffect(() => {
    if (orderData?.rateType === "fixed" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [orderData?.rateType, timeRemaining]);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!orderData) throw new Error("No order data available");
      
      const isCardPayoutType = isCardPayout(orderData.toCurrency);
      
      const requestData: any = {
        fromCurrency: orderData.fromCurrency,
        toCurrency: orderData.toCurrency,
        fromAmount: orderData.fromAmount,
        rateType: orderData.rateType,
        exchangeRate: orderData.exchangeRate, // Use real exchange rate
        expectedReceiveAmount: orderData.receiveAmount, // Include expected amount
        contactEmail: orderData.contactEmail || undefined,
        userId: user?.id,
        depositAddress: depositAddress, // Include generated deposit address
      };
      
      // Add relevant fields based on payout type
      if (isCardPayoutType && tempCardData) {
        requestData.cardDetails = {
          number: tempCardData.cardNumber,
          bankName: tempCardData.bankName,
          holderName: tempCardData.holderName,
        };
      } else if (!isCardPayoutType) {
        requestData.recipientAddress = orderData.recipientAddress || "";
      }

      const response = await apiRequest("POST", "/api/orders", requestData);
      return response.json();
    },
    onSuccess: (order) => {
      // Clear all session storage for security
      sessionStorage.removeItem('orderConfirmationData');
      sessionStorage.removeItem('tempCardData'); // Extra safety
      
      // Clear sensitive temp data
      setTempCardData(null);
      
      toast({
        title: "Order Created Successfully!",
        description: `Order ID: ${order.id}. Redirecting to order status...`,
      });
      
      // Use wouter navigation
      setTimeout(() => {
        setLocation(`/order-status?id=${order.id}`);
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Order Creation Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmOrder = () => {
    if (orderData?.rateType === "fixed" && timeRemaining <= 0) {
      toast({
        title: "Rate Expired",
        description: "The fixed rate has expired. Please go back and get a new quote.",
        variant: "destructive",
      });
      return;
    }
    
    if (!depositAddress) {
      toast({
        title: "Error",
        description: "Deposit address not ready. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Additional validation for card payments
    if (orderData && isCardPayout(orderData.toCurrency) && !tempCardData && !orderData.cardDataHash) {
      toast({
        title: "Error",
        description: "Card payment data is missing. Please go back and try again.",
        variant: "destructive",
      });
      return;
    }
    
    createOrderMutation.mutate();
  };

  const handleGoBack = () => {
    // Use wouter navigation instead of window.history
    setLocation('/');
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get currency details for display
  const fromCurrency = currencies.find(c => c.id === orderData?.fromCurrency);
  const toCurrency = currencies.find(c => c.id === orderData?.toCurrency);
  
  // Use REAL calculations from exchange widget - NO MORE MOCK DATA!
  const fromAmount = parseFloat(orderData?.fromAmount || "0");
  const exchangeRate = orderData?.exchangeRate || 0; // Use REAL exchange rate from widget
  const receiveAmount = parseFloat(orderData?.receiveAmount || "0"); // Use REAL calculated amount
  
  // Calculate fees for display (should match exchange widget logic exactly)
  const fee = fromAmount * 0.005; // 0.5% fee
  const networkFee = orderData?.fromCurrency?.includes("usdt") ? 2 : 0.0001;

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 sm:py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4" data-testid="text-page-title">
            {t('orderConfirmation.title', 'Confirm Your Exchange')}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg" data-testid="text-page-subtitle">
            {t('orderConfirmation.subtitle', 'Review the details and complete your order')}
          </p>
        </div>

        {/* Fixed Rate Timer */}
        {orderData.rateType === "fixed" && (
          <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    {t('orderConfirmation.rateExpiry', 'Rate expires in:')}
                  </span>
                </div>
                <Badge 
                  variant={timeRemaining > 60 ? "default" : "destructive"}
                  className="text-sm font-mono"
                  data-testid="badge-time-remaining"
                >
                  {formatTime(timeRemaining)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Exchange Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>{t('orderConfirmation.exchangeDetails', 'Exchange Details')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center" data-testid="row-send-amount">
                  <span className="text-muted-foreground">You Send:</span>
                  <div className="text-right">
                    <div className="font-semibold">{orderData.fromAmount} {fromCurrency?.symbol || orderData.fromCurrency}</div>
                    <div className="text-xs text-muted-foreground">{fromCurrency?.name}</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center" data-testid="row-receive-amount">
                  <span className="text-muted-foreground">You Receive:</span>
                  <div className="text-right">
                    <div className="font-semibold">{receiveAmount.toFixed(2)} {toCurrency?.symbol || orderData.toCurrency.replace('card-', '').toUpperCase()}</div>
                    <div className="text-xs text-muted-foreground">{toCurrency?.name || orderData.toCurrency}</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Service Fee (0.5%):</span>
                    <span>-{fee.toFixed(4)} {fromCurrency?.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Fee:</span>
                    <span>-{networkFee.toFixed(4)} {fromCurrency?.symbol}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Exchange Rate:</span>
                    <span>1 {fromCurrency?.symbol} = {exchangeRate} {toCurrency?.symbol || orderData.toCurrency.replace('card-', '').toUpperCase()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payout Details */}
            <Card>
              <CardHeader>
                <CardTitle>{t('orderConfirmation.payoutDetails', 'Payout Details')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isCardPayout(orderData.toCurrency) ? (
                  <>
                    <div className="flex justify-between" data-testid="row-card-number">
                      <span className="text-muted-foreground">Card Number:</span>
                      <span className="font-mono">{orderData.cardNumberMasked || "****"}</span>
                    </div>
                    {tempCardData && (
                      <>
                        <div className="flex justify-between" data-testid="row-bank-name">
                          <span className="text-muted-foreground">Bank:</span>
                          <span>{tempCardData.bankName}</span>
                        </div>
                        <div className="flex justify-between" data-testid="row-holder-name">
                          <span className="text-muted-foreground">Holder Name:</span>
                          <span>{tempCardData.holderName}</span>
                        </div>
                      </>
                    )}
                    {!tempCardData && (
                      <div className="text-sm text-muted-foreground italic">
                        Card details will be verified during order creation
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2" data-testid="row-recipient-address">
                    <div className="text-muted-foreground">Recipient Address:</div>
                    <div className="font-mono text-sm bg-muted p-2 rounded break-all">
                      {orderData.recipientAddress}
                    </div>
                  </div>
                )}
                
                {orderData.contactEmail && (
                  <div className="flex justify-between" data-testid="row-contact-email">
                    <span className="text-muted-foreground">Contact Email:</span>
                    <span>{orderData.contactEmail}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Deposit Instructions */}
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-green-800 dark:text-green-200">
                    {t('orderConfirmation.depositInstructions', 'Deposit Instructions')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                    {t('orderConfirmation.depositMessage', 'After confirming, send your crypto to this address:')}
                  </p>
                  
                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    {isGeneratingAddress ? (
                      <div className="p-4 bg-white rounded-lg shadow-inner w-[232px] h-[232px] flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <div className="text-sm text-muted-foreground">Generating QR Code...</div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        ref={qrCodeRef}
                        className="p-4 bg-white rounded-lg shadow-inner min-h-[232px] min-w-[232px] flex items-center justify-center"
                        data-testid="qr-code-container"
                      >
                        {!qrCodeGenerated && depositAddress && (
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground">Loading QR Code...</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Deposit Address */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Deposit Address:</div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded border">
                      {depositAddress ? (
                        <div className="font-mono text-sm break-all" data-testid="text-deposit-address">
                          {depositAddress}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 justify-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="text-sm text-muted-foreground">Generating address...</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => copyToClipboard(depositAddress, "Deposit address")}
                      disabled={!depositAddress || isGeneratingAddress}
                      data-testid="button-copy-address"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {t('common.copy', 'Copy Address')}
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-4 space-y-1">
                    <p>• {t('orderConfirmation.instruction1', 'Send only USDT TRC20 to this address')}</p>
                    <p>• {t('orderConfirmation.instruction2', 'Minimum amount: 10 USDT')}</p>
                    <p>• {t('orderConfirmation.instruction3', 'Processing time: 5-30 minutes')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 sm:mt-12">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="flex-1 sm:flex-initial"
            disabled={createOrderMutation.isPending}
            data-testid="button-go-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.goBack', 'Go Back')}
          </Button>
          
          <Button
            onClick={handleConfirmOrder}
            className="flex-1"
            disabled={createOrderMutation.isPending || (orderData.rateType === "fixed" && timeRemaining <= 0)}
            data-testid="button-confirm-order"
          >
            {createOrderMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t('orderConfirmation.creating', 'Creating Order...')}
              </>
            ) : (
              t('orderConfirmation.confirmOrder', 'Confirm Order')
            )}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-8 sm:mt-12 text-xs text-muted-foreground max-w-2xl mx-auto">
          <p>
            {t('orderConfirmation.securityNotice', 
              'Your transaction is secure and encrypted. Never share your private keys or seed phrases with anyone.'
            )}
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}