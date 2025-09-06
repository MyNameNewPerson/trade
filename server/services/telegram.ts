import type { Order } from "@shared/schema";

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

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
  }

  private async sendRequest(method: string, data: any): Promise<any> {
    if (!this.botToken) {
      console.warn('Telegram bot token not configured');
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
    
    let payoutDetails = '';
    if (order.cardDetails) {
      payoutDetails = `
<b>💳 Данные карты:</b>
• Номер: <code>${order.cardDetails.number}</code>
• Банк: ${order.cardDetails.bankName}
• Владелец: ${order.cardDetails.holderName}`;
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
<b>🔄 Статус:</b> ${this.getStatusEmoji(order.status)} ${this.getStatusText(order.status)}`;
  }

  private createOrderKeyboard(order: Order): Array<Array<{ text: string; callback_data?: string; url?: string }>> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
    
    return [
      [
        { text: '👀 Просмотр заказа', url: `${baseUrl}/order-status?id=${order.id}` },
        { text: '📋 Копировать адрес', callback_data: `copy_address_${order.id}` }
      ],
      [
        { text: '✅ Отметить оплаченным', callback_data: `mark_paid_${order.id}` },
        { text: '🔍 Запросить KYC', callback_data: `request_kyc_${order.id}` }
      ],
      [
        { text: '❌ Отменить заказ', callback_data: `cancel_order_${order.id}` }
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
    return !!(this.botToken && this.chatId);
  }
}

export const telegramService = new TelegramService();