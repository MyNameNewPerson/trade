import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/useAuth";
import { usePerformanceTracking } from "@/lib/performance";
import type { Currency, ExchangeRate } from "@shared/schema";

const exchangeFormSchema = z.object({
  fromCurrency: z.string().min(1, "Please select a currency to send"),
  toCurrency: z.string().min(1, "Please select a currency to receive"),
  fromAmount: z.string().min(1, "Please enter an amount"),
  rateType: z.enum(["fixed", "float"]),
  recipientAddress: z.string().optional(),
  cardNumber: z.string().optional(),
  bankName: z.string().optional(),
  holderName: z.string().optional(),
  contactEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).superRefine((data, ctx) => {
  // Validate crypto payout requirements
  if (!data.toCurrency.startsWith("card-")) {
    if (!data.recipientAddress || data.recipientAddress.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wallet address is required for crypto payouts",
        path: ["recipientAddress"]
      });
    }
  }
  // Validate card payout requirements
  if (data.toCurrency.startsWith("card-")) {
    if (!data.cardNumber || data.cardNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Card number is required for card payouts",
        path: ["cardNumber"]
      });
    }
    if (!data.bankName || data.bankName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bank name is required for card payouts",
        path: ["bankName"]
      });
    }
    if (!data.holderName || data.holderName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Card holder name is required for card payouts",
        path: ["holderName"]
      });
    }
  }
});

type ExchangeFormData = z.infer<typeof exchangeFormSchema>;

// Skeleton loader for better perceived performance
function ExchangeWidgetSkeleton() {
  return (
    <div className="max-w-2xl mx-auto glassmorphism rounded-2xl p-8 shadow-2xl animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-white/20 rounded"></div>
        <div className="flex space-x-2">
          <div className="h-8 w-20 bg-white/20 rounded"></div>
          <div className="h-8 w-20 bg-white/20 rounded"></div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-20 bg-white/20 rounded"></div>
          <div className="flex space-x-3">
            <div className="h-12 flex-1 bg-white/20 rounded"></div>
            <div className="h-12 w-32 bg-white/20 rounded"></div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-white/20 rounded"></div>
          <div className="flex space-x-3">
            <div className="h-12 flex-1 bg-white/20 rounded"></div>
            <div className="h-12 w-32 bg-white/20 rounded"></div>
          </div>
        </div>
        <div className="h-12 w-full bg-white/20 rounded"></div>
      </div>
    </div>
  );
}

export function ExchangeWidget() {
  const { trackRender } = usePerformanceTracking('ExchangeWidget');
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [rateType, setRateType] = useState<"fixed" | "float">("fixed");
  
  // Track render performance
  useEffect(() => {
    trackRender();
  }, [trackRender]);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [receiveAmount, setReceiveAmount] = useState<string>("0");
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutes

  // WebSocket for real-time rate updates
  const { lastMessage } = useWebSocket("/ws");

  const form = useForm<ExchangeFormData>({
    resolver: zodResolver(exchangeFormSchema),
    defaultValues: {
      fromCurrency: "usdt-trc20",
      toCurrency: "card-mdl",
      fromAmount: "",
      rateType: "fixed",
      recipientAddress: "",
      cardNumber: "",
      bankName: "",
      holderName: "",
      contactEmail: "",
      termsAccepted: false,
    },
  });

  const { data: currencies = [], isLoading: currenciesLoading } = useQuery<Currency[]>({
    queryKey: ['/api/currencies'],
    staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
  });

  const { data: rates = [], isLoading: ratesLoading } = useQuery<ExchangeRate[]>({
    queryKey: ['/api/rates'],
    staleTime: 15 * 60 * 1000, // Consider data fresh for 15 minutes (matches server cache)
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes  
    refetchOnWindowFocus: false, // Don't refetch on window focus for better performance
    refetchInterval: 15 * 60 * 1000, // Auto-refetch every 15 minutes
  });

  // Store order data for confirmation page
  // Note: createOrderMutation moved to order-confirmation page

  // Update exchange rate when currencies change
  useEffect(() => {
    const fromCurrency = form.watch("fromCurrency");
    const toCurrency = form.watch("toCurrency");
    
    if (fromCurrency && toCurrency) {
      const rate = (rates as ExchangeRate[]).find((r: ExchangeRate) => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency);
      if (rate) {
        setExchangeRate(parseFloat(rate.rate));
      }
    }
  }, [form.watch("fromCurrency"), form.watch("toCurrency"), rates]);

  // Calculate receive amount when from amount or rate changes
  useEffect(() => {
    const fromAmount = parseFloat(form.watch("fromAmount") || "0");
    if (fromAmount > 0 && exchangeRate > 0) {
      const fee = fromAmount * 0.005; // 0.5% fee
      const networkFee = form.watch("fromCurrency").includes("usdt") ? 2 : 0.0001;
      const effectiveAmount = fromAmount - fee - networkFee;
      const calculatedReceive = effectiveAmount * exchangeRate;
      setReceiveAmount(calculatedReceive.toFixed(2));
    } else {
      setReceiveAmount("0");
    }
  }, [form.watch("fromAmount"), exchangeRate, form.watch("fromCurrency")]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'rates_update') {
      const updatedRates = lastMessage.data;
      const fromCurrency = form.watch("fromCurrency");
      const toCurrency = form.watch("toCurrency");
      
      const currentRate = updatedRates.find((r: ExchangeRate) => 
        r.fromCurrency === fromCurrency && r.toCurrency === toCurrency
      );
      
      if (currentRate) {
        setExchangeRate(parseFloat(currentRate.rate));
      }
    }
  }, [lastMessage, form.watch("fromCurrency"), form.watch("toCurrency")]);

  // Countdown timer for fixed rate
  useEffect(() => {
    if (rateType === "fixed") {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [rateType]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const swapCurrencies = () => {
    const fromCurrency = form.getValues("fromCurrency");
    const toCurrency = form.getValues("toCurrency");
    
    form.setValue("fromCurrency", toCurrency);
    form.setValue("toCurrency", fromCurrency);
    form.setValue("fromAmount", "");
  };

  const toCurrencyValue = form.watch("toCurrency");
  const isCardPayout = toCurrencyValue.startsWith("card-");
  const isCryptoPayout = !toCurrencyValue.startsWith("card-") && (currencies as Currency[]).find((c: Currency) => c.id === toCurrencyValue)?.type === 'crypto';
  const fromCurrency = (currencies as Currency[]).find((c: Currency) => c.id === form.watch("fromCurrency"));
  const toCurrency = (currencies as Currency[]).find((c: Currency) => c.id === toCurrencyValue);

  const onSubmit = (data: ExchangeFormData) => {
    // Helper function to mask card number for security
    const maskCardNumber = (cardNumber: string) => {
      if (cardNumber.length < 4) return '****';
      return '****' + cardNumber.slice(-4);
    };

    // Store minimal data in sessionStorage for security - DO NOT store sensitive card details
    const orderData = {
      fromCurrency: data.fromCurrency,
      toCurrency: data.toCurrency,
      fromAmount: data.fromAmount,
      rateType: data.rateType,
      exchangeRate: exchangeRate, // Include real exchange rate
      receiveAmount: receiveAmount, // Include calculated receive amount
      recipientAddress: data.recipientAddress,
      cardNumberMasked: data.cardNumber ? maskCardNumber(data.cardNumber) : undefined, // Only store masked version
      contactEmail: data.contactEmail,
      // Store encrypted/hashed sensitive data for server verification only
      cardDataHash: data.cardNumber ? btoa(data.cardNumber + '|' + data.bankName + '|' + data.holderName) : undefined,
    };
    
    // Store sensitive card data temporarily in a more secure way (will be cleared on page load)
    if (data.cardNumber && data.bankName && data.holderName) {
      // This will be used only for the API call and immediately cleared
      sessionStorage.setItem('tempCardData', JSON.stringify({
        cardNumber: data.cardNumber,
        bankName: data.bankName,
        holderName: data.holderName,
      }));
    }
    
    sessionStorage.setItem('orderConfirmationData', JSON.stringify(orderData));
    
    // Redirect to confirmation page
    window.location.href = '/order-confirmation';
  };

  // Show skeleton while essential data is loading
  if (currenciesLoading || ratesLoading) {
    return <ExchangeWidgetSkeleton />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white text-center sm:text-left">{t('exchange.title')}</h2>
        <div className="flex space-x-2 justify-center sm:justify-end">
          <Button
            type="button"
            variant={rateType === "fixed" ? "default" : "outline"}
            size="sm"
            onClick={() => setRateType("fixed")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            data-testid="button-fixed-rate"
          >
            {t('exchange.fixedRate')}
          </Button>
          <Button
            type="button"
            variant={rateType === "float" ? "default" : "outline"}
            size="sm"
            onClick={() => setRateType("float")}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            data-testid="button-float-rate"
          >
            {t('exchange.floatRate')}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Send Currency */}
          <div className="space-y-3">
            <FormLabel className="text-slate-700 dark:text-slate-300 text-sm font-medium">
              {t('exchange.youSend')}
            </FormLabel>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <FormField
                control={form.control}
                name="fromAmount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-primary/30 h-12 sm:h-10 text-base sm:text-sm"
                        {...field}
                        data-testid="input-from-amount"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fromCurrency"
                render={({ field }) => (
                  <FormItem className="sm:min-w-[140px]">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full sm:min-w-[140px] bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white h-12 sm:h-10" data-testid="select-from-currency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(currencies as Currency[]).filter((c: Currency) => c.type === 'crypto').map((currency: Currency) => (
                          <SelectItem key={currency.id} value={currency.id} data-testid={`option-from-${currency.id}`}>
                            {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {fromCurrency && (
              <div className="text-xs text-slate-500 dark:text-slate-400 px-1">
                {t('exchange.min')}: {fromCurrency.minAmount} {fromCurrency.symbol} • {t('exchange.max')}: {fromCurrency.maxAmount} {fromCurrency.symbol}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center my-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={swapCurrencies}
              className="p-3 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-all min-h-[48px] min-w-[48px]"
              data-testid="button-swap-currencies"
            >
              <ArrowUpDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </Button>
          </div>

          {/* Receive Currency */}
          <div className="space-y-3">
            <FormLabel className="text-slate-700 dark:text-slate-300 text-sm font-medium">
              {t('exchange.youReceive')}
            </FormLabel>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={receiveAmount}
                  readOnly
                  className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 h-12 sm:h-10 text-base sm:text-sm"
                  data-testid="input-receive-amount"
                />
              </div>
              <FormField
                control={form.control}
                name="toCurrency"
                render={({ field }) => (
                  <FormItem className="sm:min-w-[140px]">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full sm:min-w-[140px] bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white h-12 sm:h-10" data-testid="select-to-currency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(currencies as Currency[]).map((currency: Currency) => (
                          <SelectItem key={currency.id} value={currency.id} data-testid={`option-to-${currency.id}`}>
                            {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Exchange Rate Info */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3 border border-slate-200 dark:border-slate-600">
            <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
              <span className="text-sm text-slate-600 dark:text-slate-400">{t('exchange.exchangeRate')}:</span>
              <span className="text-sm text-slate-900 dark:text-white font-medium" data-testid="text-exchange-rate">
                1 {fromCurrency?.symbol} = {exchangeRate.toFixed(2)} {toCurrency?.symbol}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
              <span className="text-sm text-slate-600 dark:text-slate-400">{t('exchange.platformFee')}:</span>
              <span className="text-sm text-slate-900 dark:text-white">0.5%</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
              <span className="text-sm text-slate-600 dark:text-slate-400">{t('exchange.networkFee')}:</span>
              <span className="text-sm text-slate-900 dark:text-white">~{form.watch("fromCurrency").includes("usdt") ? "2 USDT" : "0.0001 BTC"}</span>
            </div>
            {rateType === "fixed" && (
              <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                <span className="text-sm text-slate-600 dark:text-slate-400">{t('exchange.rateLocked')}:</span>
                <span className="text-sm text-slate-900 dark:text-white font-medium" data-testid="text-rate-lock-time">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>

          {/* Card Details */}
          {/* Crypto Payout - Wallet Address */}
          {isCryptoPayout && (
            <div className="space-y-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <h3 className="text-slate-900 dark:text-white font-medium text-sm sm:text-base">{t('exchange.cryptoPayout')}</h3>
              </div>
              <FormField
                control={form.control}
                name="recipientAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder={t('exchange.walletAddressPlaceholder')}
                        className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-slate-900 dark:text-white placeholder-slate-400 h-12 sm:h-10 text-base sm:text-sm"
                        {...field}
                        data-testid="input-wallet-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          {/* Card Payout - Card Details */}
          {isCardPayout && (
            <div className="space-y-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <h3 className="text-slate-900 dark:text-white font-medium text-sm sm:text-base">{t('exchange.cardPayout')}</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder={t('exchange.cardNumber')}
                          className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-slate-900 dark:text-white placeholder-slate-400 h-12 sm:h-10 text-base sm:text-sm"
                          {...field}
                          data-testid="input-card-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder={t('exchange.bankName')}
                          className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-slate-900 dark:text-white placeholder-slate-400 h-12 sm:h-10 text-base sm:text-sm"
                          {...field}
                          data-testid="input-bank-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="holderName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormControl>
                        <Input
                          placeholder={t('exchange.holderName')}
                          className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-slate-900 dark:text-white placeholder-slate-400 h-12 sm:h-10 text-base sm:text-sm"
                          {...field}
                          data-testid="input-holder-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Contact Email */}
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t('exchange.email')}
                    className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white placeholder-slate-400 h-12 sm:h-10 text-base sm:text-sm"
                    {...field}
                    data-testid="input-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Terms */}
          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-1">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1 min-w-[20px] min-h-[20px]"
                    data-testid="checkbox-terms"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm sm:text-base text-white/80 leading-relaxed cursor-pointer">
                    {t('exchange.terms')}
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white font-bold py-4 sm:py-4 rounded-lg btn-modern animate-glow hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-base sm:text-sm min-h-[48px] shadow-lg border border-white/20"
            disabled={false}
            data-testid="button-create-order"
          >
            {false ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {t('exchange.createOrder')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
