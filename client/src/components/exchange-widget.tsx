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

export function ExchangeWidget() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rateType, setRateType] = useState<"fixed" | "float">("fixed");
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

  const { data: currencies = [] } = useQuery<Currency[]>({
    queryKey: ['/api/currencies'],
  });

  const { data: rates = [] } = useQuery<ExchangeRate[]>({
    queryKey: ['/api/rates'],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: ExchangeFormData) => {
      const isCardPayout = data.toCurrency.startsWith("card-");
      
      const orderData: any = {
        fromCurrency: data.fromCurrency,
        toCurrency: data.toCurrency,
        fromAmount: data.fromAmount,
        rateType: data.rateType,
        contactEmail: data.contactEmail || undefined,
      };
      
      // Add relevant fields based on payout type
      if (isCardPayout) {
        orderData.cardDetails = {
          number: data.cardNumber || "",
          bankName: data.bankName || "",
          holderName: data.holderName || "",
        };
      } else {
        orderData.recipientAddress = data.recipientAddress || "";
      }

      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (order) => {
      toast({
        title: "Order Created Successfully!",
        description: `Order ID: ${order.id}. You will be redirected to the order status page.`,
      });
      
      // Redirect to order status page
      setTimeout(() => {
        window.location.href = `/order-status?id=${order.id}`;
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Order Creation Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update exchange rate when currencies change
  useEffect(() => {
    const fromCurrency = form.watch("fromCurrency");
    const toCurrency = form.watch("toCurrency");
    
    if (fromCurrency && toCurrency) {
      const rate = rates.find(r => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency);
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
  const isCryptoPayout = !toCurrencyValue.startsWith("card-") && currencies.find(c => c.id === toCurrencyValue)?.type === 'crypto';
  const fromCurrency = currencies.find(c => c.id === form.watch("fromCurrency"));
  const toCurrency = currencies.find(c => c.id === toCurrencyValue);

  const onSubmit = (data: ExchangeFormData) => {
    createOrderMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto glassmorphism rounded-2xl p-8 shadow-2xl animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">{t('exchange.title')}</h2>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant={rateType === "fixed" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setRateType("fixed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              rateType === "fixed" 
                ? "bg-white/20 text-white" 
                : "text-white/70 hover:bg-white/20"
            }`}
            data-testid="button-fixed-rate"
          >
            {t('exchange.fixedRate')}
          </Button>
          <Button
            type="button"
            variant={rateType === "float" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setRateType("float")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              rateType === "float" 
                ? "bg-white/20 text-white" 
                : "text-white/70 hover:bg-white/20"
            }`}
            data-testid="button-float-rate"
          >
            {t('exchange.floatRate')}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Send Currency */}
          <div className="space-y-2">
            <FormLabel className="text-white/80 text-sm font-medium">
              {t('exchange.youSend')}
            </FormLabel>
            <div className="flex space-x-3">
              <FormField
                control={form.control}
                name="fromAmount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-white/30"
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
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-w-[140px] bg-white/10 border border-white/20 text-white" data-testid="select-from-currency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.filter(c => c.type === 'crypto').map((currency) => (
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
              <div className="text-xs text-white/60">
                {t('exchange.min')}: {fromCurrency.minAmount} {fromCurrency.symbol} • {t('exchange.max')}: {fromCurrency.maxAmount} {fromCurrency.symbol}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={swapCurrencies}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-all transform hover:scale-110"
              data-testid="button-swap-currencies"
            >
              <ArrowUpDown className="w-5 h-5 text-white" />
            </Button>
          </div>

          {/* Receive Currency */}
          <div className="space-y-2">
            <FormLabel className="text-white/80 text-sm font-medium">
              {t('exchange.youReceive')}
            </FormLabel>
            <div className="flex space-x-3">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={receiveAmount}
                  readOnly
                  className="bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                  data-testid="input-receive-amount"
                />
              </div>
              <FormField
                control={form.control}
                name="toCurrency"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-w-[140px] bg-white/10 border border-white/20 text-white" data-testid="select-to-currency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
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
          <div className="bg-white/10 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm text-white/80">
              <span>{t('exchange.exchangeRate')}:</span>
              <span data-testid="text-exchange-rate">
                1 {fromCurrency?.symbol} = {exchangeRate.toFixed(2)} {toCurrency?.symbol}
              </span>
            </div>
            <div className="flex justify-between text-sm text-white/80">
              <span>{t('exchange.platformFee')}:</span>
              <span>0.5%</span>
            </div>
            <div className="flex justify-between text-sm text-white/80">
              <span>{t('exchange.networkFee')}:</span>
              <span>~{form.watch("fromCurrency").includes("usdt") ? "2 USDT" : "0.0001 BTC"}</span>
            </div>
            {rateType === "fixed" && (
              <div className="flex justify-between text-sm text-white/80">
                <span>{t('exchange.rateLocked')}:</span>
                <span className="font-medium" data-testid="text-rate-lock-time">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>

          {/* Card Details */}
          {/* Crypto Payout - Wallet Address */}
          {isCryptoPayout && (
            <div className="space-y-4 bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/80 mb-3">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <h3 className="text-white font-medium">{t('exchange.cryptoPayout')}</h3>
              </div>
              <FormField
                control={form.control}
                name="recipientAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder={t('exchange.walletAddressPlaceholder')}
                        className="bg-white/10 border border-white/20 text-white placeholder-white/50"
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
            <div className="space-y-4 bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/80 mb-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <h3 className="text-white font-medium">{t('exchange.cardPayout')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cardNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder={t('exchange.cardNumber')}
                          className="bg-white/10 border border-white/20 text-white placeholder-white/50"
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
                          className="bg-white/10 border border-white/20 text-white placeholder-white/50"
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
                    <FormItem className="md:col-span-2">
                      <FormControl>
                        <Input
                          placeholder={t('exchange.holderName')}
                          className="bg-white/10 border border-white/20 text-white placeholder-white/50"
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
                    className="bg-white/10 border border-white/20 text-white placeholder-white/50"
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
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1"
                    data-testid="checkbox-terms"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm text-white/80 leading-relaxed cursor-pointer">
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
            className="w-full bg-white text-primary font-semibold py-4 rounded-lg hover:bg-white/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            disabled={createOrderMutation.isPending}
            data-testid="button-create-order"
          >
            {createOrderMutation.isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {t('exchange.createOrder')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
