import type { Order } from "@shared/schema";
import { CryptoService } from './crypto';

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: {
    inline_keyboard: Array<Array<{
      text: string;
      callback_data?: string;
      url?: string;
    }>>;
  };
}

export class TelegramService {
  private botToken: string;
  private chatId: string;
  private signingSecret: string;
  private configured: boolean;
  private rateLimiter: Map<string, number> = new Map();
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS_PER_MINUTE = 30;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    this.signingSecret = process.env.TELEGRAM_SIGNING_SECRET || '';
    this.configured = !!(this.botToken && this.chatId && this.signingSecret);
    
    // Validate token format
    if (this.botToken && !this.isValidBotToken(this.botToken)) {
      console.error('Invalid Telegram bot token format');
      this.configured = false;
    }
    
    // Validate chat ID format
    if (this.chatId && !this.isValidChatId(this.chatId)) {
      console.error('Invalid Telegram chat ID format');
      this.configured = false;
    }
    
    // Validate signing secret
    if (!this.signingSecret) {
      console.error('TELEGRAM_SIGNING_SECRET is required for security');
      this.configured = false;
    }
  }

  private isValidBotToken(token: string): boolean {
    // Telegram bot token format: {bot_id}:{bot_secret}
    const tokenRegex = /^\d+:[A-Za-z0-9_-]{35}$/;
    return tokenRegex.test(token);
  }

  private isValidChatId(chatId: string): boolean {
    // Chat ID can be a number (user/group ID) or @channel_name
    return /^-?\d+$/.test(chatId) || /^@[a-zA-Z0-9_]+$/.test(chatId);
  }

  private checkRateLimit(identifier: string = 'default'): boolean {
    const now = Date.now();
    const windowStart = now - this.RATE_LIMIT_WINDOW;
    
    // Clean old entries
    for (const [key, timestamp] of Array.from(this.rateLimiter.entries())) {
      if (timestamp < windowStart) {
        this.rateLimiter.delete(key);
      }
    }
    
    // Count requests in current window
    const recentRequests = Array.from(this.rateLimiter.values())
      .filter(timestamp => timestamp >= windowStart).length;
    
    if (recentRequests >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }
    
    this.rateLimiter.set(`${identifier}_${now}`, now);
    return true;
  }

  private async sendRequest(method: string, data: any): Promise<any> {
    if (!this.configured) {
      console.warn('Telegram service not properly configured');
      return null;
    }

    if (!this.checkRateLimit(method)) {
      console.warn('Telegram rate limit exceeded');
      return null;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Telegram ${method} failed:`, error);
      return null;
    }
  }

  async sendMessage(text: string, chatId?: string): Promise<boolean> {
    const message: TelegramMessage = {
      chat_id: chatId || this.chatId,
      text,
      parse_mode: 'HTML'
    };

    const result = await this.sendRequest('sendMessage', message);
    return result?.ok === true;
  }

  async sendOrderNotification(order: Order): Promise<boolean> {
    const message = this.formatOrderMessage(order);
    const inlineKeyboard = this.createOrderKeyboard(order);

    const telegramMessage: TelegramMessage = {
      chat_id: this.chatId,
      text: message,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: inlineKeyboard
      }
    };

    const result = await this.sendRequest('sendMessage', telegramMessage);
    return result?.ok === true;
  }

  private formatOrderMessage(order: Order): string {
    const fromSymbol = order.fromCurrency.toUpperCase().replace('-', ' ');
    const toSymbol = order.toCurrency.replace('card-', '').toUpperCase();
    const verifyCode = CryptoService.generateVerificationCode(6);
    
    let payoutDetails = '';
    if (order.cardDetails) {
      const cardData = order.cardDetails as any;
      payoutDetails = `
<b>💳 Данные карты:</b>
• Номер: <code>${cardData.number}</code>
• Банк: ${cardData.bankName}
• Владелец: ${cardData.holderName}`;
    } else if (order.recipientAddress) {
      payoutDetails = `
<b>💰 Кошелек получателя:</b>
<code>${order.recipientAddress}</code>`;
    }

    const contactInfo = order.contactEmail ? `
<b>📧 Контакт:</b> ${order.contactEmail}` : '';

    const lockInfo = order.rateType === 'fixed' && order.rateLockExpiry 
      ? `\n<b>⏰ Курс заблокирован до:</b> ${new Date(order.rateLockExpiry).toLocaleString('ru-RU')}`
      : '';

    return `🆕 <b>НОВЫЙ ЗАКАЗ #${order.id}</b>

<b>📊 Детали обмена:</b>
• Отдает: <b>${order.fromAmount} ${fromSymbol}</b>
• Получает: <b>${order.toAmount} ${toSymbol}</b>
• Курс: <b>1 ${fromSymbol} = ${order.exchangeRate} ${toSymbol}</b>
• Тип курса: <b>${order.rateType === 'fixed' ? 'Фиксированный' : 'Плавающий'}</b>${lockInfo}

<b>💰 Комиссии:</b>
• Платформа: ${order.platformFee} ${fromSymbol}
• Сеть: ${order.networkFee || '0'} ${fromSymbol}

<b>📍 Адрес депозита:</b>
<code>${order.depositAddress}</code>
${payoutDetails}${contactInfo}

<b>📅 Создан:</b> ${new Date(order.createdAt).toLocaleString('ru-RU')}
<b>🔄 Статус:</b> ${this.getStatusEmoji(order.status)} ${this.getStatusText(order.status)}

<b>🔒 Код верификации:</b> <code>${verifyCode}</code>`;
  }

  private createOrderKeyboard(order: Order): Array<Array<{ text: string; callback_data?: string; url?: string }>> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    const verifyCode = CryptoService.generateVerificationCode(6);
    
    return [
      [
        { text: '👀 Просмотр заказа', url: `${baseUrl}/order-status?id=${order.id}` },
        { text: '📋 Копировать адрес', callback_data: this.signCallbackData(`copy_address_${order.id}`) }
      ],
      [
        { text: '✅ Отметить оплаченным', callback_data: this.signCallbackData(`mark_paid_${order.id}`) },
        { text: '🔍 Запросить KYC', callback_data: this.signCallbackData(`request_kyc_${order.id}`) }
      ],
      [
        { text: '❌ Отменить заказ', callback_data: this.signCallbackData(`cancel_order_${order.id}`) }
      ]
    ];
  }

  private getStatusEmoji(status: string): string {
    const emojis: { [key: string]: string } = {
      'awaiting_deposit': '⏳',
      'confirmed': '✅',
      'processing': '🔄',
      'completed': '✅',
      'failed': '❌',
      'refunded': '↩️'
    };
    return emojis[status] || '❓';
  }

  private getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'awaiting_deposit': 'Ожидание депозита',
      'confirmed': 'Подтверждено',
      'processing': 'Обработка',
      'completed': 'Завершено',
      'failed': 'Неудачно',
      'refunded': 'Возврат средств'
    };
    return texts[status] || 'Неизвестно';
  }

  async sendDepositConfirmation(order: Order, txHash: string): Promise<boolean> {
    const message = `🔥 <b>ДЕПОЗИТ ПОДТВЕРЖДЕН</b>

<b>Заказ:</b> #${order.id}
<b>Сумма:</b> ${order.fromAmount} ${order.fromCurrency.toUpperCase()}
<b>Transaction Hash:</b>
<code>${txHash}</code>

<b>Следующий шаг:</b> Обработка выплаты
<b>Получатель получит:</b> ${order.toAmount} ${order.toCurrency.replace('card-', '').toUpperCase()}`;

    return await this.sendMessage(message);
  }

  async sendPayoutComplete(order: Order, payoutTxHash: string): Promise<boolean> {
    const message = `✅ <b>ВЫПЛАТА ЗАВЕРШЕНА</b>

<b>Заказ:</b> #${order.id}
<b>Выплачено:</b> ${order.toAmount} ${order.toCurrency.replace('card-', '').toUpperCase()}
<b>Payout Hash:</b>
<code>${payoutTxHash}</code>

<b>Статус:</b> Завершено ✅`;

    return await this.sendMessage(message);
  }

  isConfigured(): boolean {
    return this.configured;
  }

  // Security method to get sanitized configuration status
  getConfigStatus(): { configured: boolean; hasToken: boolean; hasChatId: boolean; hasSigningSecret: boolean } {
    return {
      configured: this.configured,
      hasToken: !!this.botToken,
      hasChatId: !!this.chatId,
      hasSigningSecret: !!this.signingSecret
    };
  }

  // Sign callback data for security
  private signCallbackData(data: string): string {
    const timestamp = Date.now().toString();
    const payload = `${data}:${timestamp}`;
    const signature = CryptoService.generateHMAC(payload, this.signingSecret);
    return `${payload}:${signature.substring(0, 8)}`; // Short signature for Telegram limits
  }

  // Verify callback data signature
  verifyCallbackData(callbackData: string): { valid: boolean; data?: string } {
    try {
      const parts = callbackData.split(':');
      if (parts.length !== 3) return { valid: false };
      
      const [data, timestamp, shortSignature] = parts;
      const payload = `${data}:${timestamp}`;
      const expectedSignature = CryptoService.generateHMAC(payload, this.signingSecret);
      
      // Check if signature matches (first 8 characters)
      if (expectedSignature.substring(0, 8) !== shortSignature) {
        return { valid: false };
      }
      
      // Check if timestamp is not too old (1 hour)
      const age = Date.now() - parseInt(timestamp);
      if (age > 60 * 60 * 1000) {
        return { valid: false };
      }
      
      return { valid: true, data };
    } catch {
      return { valid: false };
    }
  }

  // Send deposit monitoring alert
  async sendDepositAlert(currency: string, amount: string, txId: string, orderId?: string): Promise<boolean> {
    const orderInfo = orderId ? `\n<b>Связан с заказом:</b> #${orderId}` : '';
    
    const message = `🟢 <b>ДЕПОЗИТ ОБНАРУЖЕН</b>

<b>Монета:</b> ${currency.toUpperCase()}
<b>Сумма:</b> ${amount}
<b>TX ID:</b> <code>${txId}</code>${orderInfo}

<b>Время:</b> ${new Date().toLocaleString('ru-RU')}`;
    
    return await this.sendMessage(message);
  }
}

export const telegramService = new TelegramService();