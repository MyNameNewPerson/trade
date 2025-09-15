import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SupportChat } from "@/components/support-chat";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import type { Order } from "@shared/schema";

// Type guard for card details
interface CardDetails {
  number: string;
  bankName: string;
  holderName: string;
}

const isCardDetails = (obj: unknown): obj is CardDetails => {
  return typeof obj === 'object' && obj !== null && 
    'number' in obj && 'bankName' in obj && 'holderName' in obj;
};

const statusColors = {
  'awaiting_deposit': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'confirmed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'processing': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'failed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'refunded': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const getStepStatus = (currentStatus: string, stepIndex: number) => {
  const statusOrder = ['awaiting_deposit', 'confirmed', 'processing', 'completed'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  if (stepIndex <= currentIndex) return 'completed';
  if (stepIndex === currentIndex + 1) return 'current';
  return 'pending';
};

export default function OrderStatus() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [orderId, setOrderId] = useState("");
  const [searchedOrderId, setSearchedOrderId] = useState("");

  // WebSocket for real-time order updates
  const { lastMessage } = useWebSocket("/ws");

  useEffect(() => {
    // Get order ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdFromUrl = urlParams.get('id');
    if (orderIdFromUrl) {
      setOrderId(orderIdFromUrl);
      setSearchedOrderId(orderIdFromUrl);
    }
  }, []);

  const { data: order, isLoading, error, refetch } = useQuery<Order>({
    queryKey: ['/api/orders', searchedOrderId],
    enabled: !!searchedOrderId,
  });

  // Handle WebSocket messages for order updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'order_update' && lastMessage.data.id === searchedOrderId) {
      refetch();
    }
  }, [lastMessage, searchedOrderId, refetch]);

  const handleSearch = () => {
    if (!orderId.trim()) {
      toast({
        title: "Error",
        description: t('errors.invalidOrderId'),
        variant: "destructive",
      });
      return;
    }
    setSearchedOrderId(orderId);
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

  const calculateTimeRemaining = () => {
    if (!order?.rateLockExpiry) return null;
    
    const now = new Date();
    const expiry = new Date(order.rateLockExpiry);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Extract card details safely
  const validCardDetails = order?.cardDetails && isCardDetails(order.cardDetails) ? order.cardDetails as CardDetails : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 sm:py-12 max-w-4xl">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6" data-testid="text-page-title">
            {t('orderTracking.title')}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg" data-testid="text-page-subtitle">
            {t('orderTracking.subtitle')}
          </p>
        </div>

        {/* Order Lookup */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Input
                type="text"
                placeholder={t('orderTracking.enterOrderId')}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="flex-1 h-11 sm:h-10"
                data-testid="input-order-id"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                className="h-11 sm:h-10 sm:w-auto"
                disabled={isLoading}
                data-testid="button-track-order"
              >
                {t('orderTracking.trackOrder')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading order details...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-red-600" data-testid="text-order-error">
                <p>{t('errors.orderNotFound')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-2xl">
                  {t('orderTracking.orderDetails')} #<span data-testid="text-order-id">{order.id}</span>
                </CardTitle>
                <Badge 
                  className={statusColors[order.status as keyof typeof statusColors]}
                  data-testid="badge-order-status"
                >
                  {t(`orderTracking.status.${order.status}`)}
                </Badge>
              </div>
              
              {/* Progress Steps */}
              <div className="mb-8">
                {/* Mobile: Vertical layout */}
                <div className="block sm:hidden space-y-4">
                  {[
                    { key: 'created', status: 'awaiting_deposit' },
                    { key: 'awaitingPayment', status: 'confirmed' },
                    { key: 'processing', status: 'processing' },
                    { key: 'completed', status: 'completed' },
                  ].map((step, index) => {
                    const stepStatus = getStepStatus(order.status, index);
                    return (
                      <div key={step.key} className="flex items-center">
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                            stepStatus === 'completed' ? 'bg-primary text-white' :
                            stepStatus === 'current' ? 'bg-primary text-white animate-pulse' :
                            'bg-muted text-muted-foreground'
                          }`}
                          data-testid={`step-mobile-${index}`}
                        >
                          {index + 1}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">
                            {t(`orderTracking.steps.${step.key}`)}
                          </div>
                          <div className={`text-xs ${
                            stepStatus === 'completed' ? 'text-green-600 dark:text-green-400' :
                            stepStatus === 'current' ? 'text-primary' :
                            'text-muted-foreground'
                          }`}>
                            {stepStatus === 'completed' ? '✓ Complete' :
                             stepStatus === 'current' ? 'In Progress' : 'Pending'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: Horizontal layout */}
                <div className="hidden sm:flex items-center justify-between overflow-x-auto">
                  {[
                    { key: 'created', status: 'awaiting_deposit' },
                    { key: 'awaitingPayment', status: 'confirmed' },
                    { key: 'processing', status: 'processing' },
                    { key: 'completed', status: 'completed' },
                  ].map((step, index) => {
                    const stepStatus = getStepStatus(order.status, index);
                    return (
                      <div key={step.key} className="flex items-center min-w-0">
                        <div className="flex items-center">
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                              stepStatus === 'completed' ? 'bg-primary text-white' :
                              stepStatus === 'current' ? 'bg-primary text-white animate-pulse' :
                              'bg-muted text-muted-foreground'
                            }`}
                            data-testid={`step-${index}`}
                          >
                            {index + 1}
                          </div>
                          <span className="ml-2 text-sm whitespace-nowrap">
                            {t(`orderTracking.steps.${step.key}`)}
                          </span>
                        </div>
                        {index < 3 && (
                          <div className="flex-1 h-0.5 bg-border mx-4 min-w-8"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Order Details Grid */}
              <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-base sm:text-lg font-semibold">{t('orderTracking.exchangeDetails')}</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between" data-testid="row-send-amount">
                      <span className="text-muted-foreground">{t('exchange.youSend')}:</span>
                      <span className="font-medium">{order.fromAmount} {order.fromCurrency.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between" data-testid="row-receive-amount">
                      <span className="text-muted-foreground">{t('exchange.youReceive')}:</span>
                      <span className="font-medium">{order.toAmount} {order.toCurrency.replace('card-', '').toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between" data-testid="row-exchange-rate">
                      <span className="text-muted-foreground">{t('exchange.exchangeRate')}:</span>
                      <span className="font-medium">1 {order.fromCurrency.toUpperCase()} = {order.exchangeRate} {order.toCurrency.replace('card-', '').toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between" data-testid="row-platform-fee">
                      <span className="text-muted-foreground">{t('exchange.platformFee')}:</span>
                      <span className="font-medium">{order.platformFee} {order.fromCurrency.toUpperCase()}</span>
                    </div>
                    {order.networkFee && (
                      <div className="flex justify-between" data-testid="row-network-fee">
                        <span className="text-muted-foreground">{t('exchange.networkFee')}:</span>
                        <span className="font-medium">{order.networkFee} {order.fromCurrency.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-base sm:text-lg font-semibold">{t('orderTracking.paymentInfo')}</h3>
                  <div className="space-y-4 sm:space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-muted-foreground text-sm">{t('orderTracking.depositAddress')}:</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(order.depositAddress, 'Deposit address')}
                          className="h-9 w-9 p-0 sm:h-8 sm:w-8"
                          data-testid="button-copy-address"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 sm:p-4">
                        <code className="text-xs sm:text-sm font-mono break-all leading-relaxed" data-testid="text-deposit-address">
                          {order.depositAddress}
                        </code>
                      </div>
                    </div>
                    
                    {validCardDetails && (
                      <div>
                        <span className="text-muted-foreground text-sm">{t('orderTracking.payoutDetails')}:</span>
                        <div className="bg-muted/50 rounded-lg p-3 mt-1">
                          <span className="text-sm" data-testid="text-payout-details">
                            Card: {validCardDetails.number} ({validCardDetails.bankName})
                          </span>
                        </div>
                      </div>
                    )}

                    {order.rateLockExpiry && order.rateType === 'fixed' && (
                      <div className="text-sm text-muted-foreground" data-testid="text-time-remaining">
                        <strong>{t('orderTracking.timeRemaining')}:</strong> {calculateTimeRemaining()} (Fixed rate)
                      </div>
                    )}

                    {order.txHash && (
                      <div>
                        <span className="text-muted-foreground text-sm">Transaction Hash:</span>
                        <div className="bg-muted/50 rounded-lg p-3 sm:p-4 mt-1">
                          <div className="flex items-start justify-between gap-2">
                            <code className="text-xs sm:text-sm font-mono break-all leading-relaxed flex-1" data-testid="text-tx-hash">
                              {order.txHash}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(order.txHash!, 'Transaction hash')}
                              className="h-9 w-9 p-0 sm:h-8 sm:w-8 flex-shrink-0"
                              data-testid="button-copy-tx-hash"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 pt-8 border-t border-border">
                <Button
                  variant="secondary"
                  className="flex-1 h-11 sm:h-10"
                  onClick={() => copyToClipboard(order.depositAddress, 'Deposit address')}
                  data-testid="button-copy-address-main"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {t('orderTracking.copyAddress')}
                </Button>
                <Button
                  className="flex-1 h-11 sm:h-10"
                  onClick={() => {
                    // This would typically open a support chat or contact form
                    toast({
                      title: "Support",
                      description: "Use the chat widget below to contact support",
                    });
                  }}
                  data-testid="button-contact-support"
                >
                  {t('orderTracking.contactSupport')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <SupportChat />
      <Footer />
    </div>
  );
}
