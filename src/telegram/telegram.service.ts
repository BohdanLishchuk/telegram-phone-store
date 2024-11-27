import { Injectable } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { PhoneService } from '../phone/phone.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private readonly PAGE_SIZE = 5;
  private userStates: Map<
    number,
    {
      page?: number;
      activeFilters?: any;
      awaitingResponse?: string;
    }
  > = new Map();

  private readonly BUTTONS = {
    MAIN_MENU: {
      VIEW_PHONES: { text: '📱 View All Phones' },
      FILTER_PHONES: { text: '🔍 Filter Phones' },
      MY_ORDERS: { text: '📋 My Orders' },
      HELP: { text: '❓ Help' },
    },
    NAVIGATION: {
      BACK_TO_MAIN: { text: '🏠 Main Menu' },
      BACK: { text: '⬅️ Back' },
      NEXT_PAGE: { text: '➡️ Next' },
      PREV_PAGE: { text: '⬅️ Previous' },
    },
    FILTERS: {
      BY_BRAND: { text: '🏢 By Brand' },
      BY_PRICE: { text: '💰 By Price' },
      BY_STORAGE: { text: '💾 By Storage' },
      CLEAR_FILTERS: { text: '🔄 Clear Filters' },
    },
  };

  constructor(
    private phoneService: PhoneService,
    private paymentService: PaymentService,
  ) {
    this.bot = new TelegramBot(
      '7809024271:AAFrDtCZtoPIyxyIRz7rwkjzVU2Gng0fp5A',
      {
        polling: true,
      },
    );
    this.setupHandlers();
  }

  private setupHandlers() {
    this.bot.onText(/\/start/, this.showMainMenu.bind(this));
    this.bot.on('message', this.handleMessage.bind(this));
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
  }

  private async showMainMenu(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const keyboard = {
      reply_markup: {
        keyboard: [
          [this.BUTTONS.MAIN_MENU.VIEW_PHONES],
          [this.BUTTONS.MAIN_MENU.FILTER_PHONES],
          [this.BUTTONS.MAIN_MENU.MY_ORDERS],
        ],
        resize_keyboard: true,
      },
    };

    await this.bot.sendMessage(
      chatId,
      '🏪 Welcome to Phone Store!\nWhat would you like to do?',
      keyboard,
    );
  }

  private async handleMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const userState = this.getUserState(chatId);

    if (userState.awaitingResponse) {
      await this.handleAwaitingResponse(chatId, text, userState);
      return;
    }

    switch (text) {
      case this.BUTTONS.MAIN_MENU.VIEW_PHONES.text:
        await this.showPhones(chatId);
        break;
      case this.BUTTONS.MAIN_MENU.FILTER_PHONES.text:
        await this.showFilterOptions(chatId);
        break;
      case this.BUTTONS.MAIN_MENU.HELP.text:
        await this.showHelp(chatId);
        break;
      case this.BUTTONS.NAVIGATION.BACK_TO_MAIN.text:
        await this.showMainMenu(msg);
        break;
      case this.BUTTONS.MAIN_MENU.MY_ORDERS.text:
        await this.showOrders(chatId);
        break;
    }
  }

  private async showFilterOptions(chatId: number) {
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: this.BUTTONS.FILTERS.BY_BRAND.text,
            callback_data: 'filter_brand',
          },
        ],
        [
          {
            text: this.BUTTONS.FILTERS.BY_PRICE.text,
            callback_data: 'filter_price',
          },
        ],
        [
          {
            text: this.BUTTONS.FILTERS.BY_STORAGE.text,
            callback_data: 'filter_storage',
          },
        ],
        [
          {
            text: this.BUTTONS.FILTERS.CLEAR_FILTERS.text,
            callback_data: 'filter_clear',
          },
        ],
      ],
    };

    await this.bot.sendMessage(chatId, '🔍 Choose filter criteria:', {
      reply_markup: keyboard,
    });
  }

  private async handlePhoneDetails(chatId: number, phoneId: number) {
    const phone = await this.phoneService.findById(phoneId);
    if (!phone) {
      await this.bot.sendMessage(chatId, 'Phone not found');
      return;
    }

    const message = `
📱 ${phone.brand} ${phone.model}

💰 Price: $${phone.price}
💾 Storage: ${phone.storage}GB
🎮 RAM: ${phone.ram}GB

📝 Description:
${phone.description}
    `;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🛒 Buy Now',
            callback_data: `buy_${phone.id}`,
          },
        ],
        [
          {
            text: this.BUTTONS.NAVIGATION.BACK.text,
            callback_data: 'back_to_list',
          },
        ],
      ],
    };

    await this.bot.sendMessage(chatId, message, { reply_markup: keyboard });

    if (phone.imageUrl) {
      try {
        await this.bot.sendPhoto(chatId, phone.imageUrl);
      } catch (error) {
        console.error(
          `Failed to send image for ${phone.brand} ${phone.model}:`,
          error,
        );
        await this.bot.sendMessage(chatId, '❌ Failed to load image');
      }
    }
  }

  private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith('filter_') || data.startsWith('set_')) {
      await this.handleFilterCallback(chatId, data);
    } else if (data.startsWith('phone_')) {
      const phoneId = parseInt(data.split('_')[1]);
      await this.handlePhoneDetails(chatId, phoneId);
    } else if (data.startsWith('page_')) {
      const page = parseInt(data.split('_')[1]);
      await this.showPhones(chatId, page);
    } else if (data === 'back_to_list') {
      await this.showPhones(chatId, 0);
    } else if (data.startsWith('buy_')) {
      const phoneId = parseInt(data.split('_')[1]);
      await this.handleBuyPhone(chatId, phoneId);
    }

    await this.bot.answerCallbackQuery(query.id);
  }

  private async handleFilterCallback(chatId: number, data: string) {
    const userState = this.getUserState(chatId);

    if (data === 'filter_brand') {
      const brands = await this.phoneService.getBrands();

      const brandKeyboard = {
        inline_keyboard: brands.map((brand) => [
          {
            text: brand,
            callback_data: `set_brand_${brand}`,
          },
        ]),
      };

      await this.bot.sendMessage(chatId, 'Select brand:', {
        reply_markup: brandKeyboard,
      });
      return;
    }

    if (data === 'filter_storage') {
      const storageOptions = ['64', '128', '256', '512'];
      const storageKeyboard = {
        inline_keyboard: storageOptions.map((storage) => [
          {
            text: `${storage}GB`,
            callback_data: `set_storage_${storage}`,
          },
        ]),
      };

      await this.bot.sendMessage(chatId, 'Select minimum storage:', {
        reply_markup: storageKeyboard,
      });
      return;
    }

    if (data === 'filter_price') {
      userState.awaitingResponse = 'price_range';
      await this.bot.sendMessage(
        chatId,
        'Enter price range in format "min-max"\nExample: 500-1000',
      );
      return;
    }

    if (data.startsWith('set_brand_')) {
      const brand = data.replace('set_brand_', '');
      userState.activeFilters = {
        ...userState.activeFilters,
        brand,
      };

      await this.bot.sendMessage(
        chatId,
        `Brand filter set to: ${brand}\nShowing filtered results:`,
      );
      await this.showPhones(chatId, 0);
      return;
    }

    if (data.startsWith('set_storage_')) {
      const storage = parseInt(data.replace('set_storage_', ''));
      userState.activeFilters = {
        ...userState.activeFilters,
        minStorage: storage,
      };

      await this.bot.sendMessage(
        chatId,
        `Storage filter set to minimum ${storage}GB\nShowing filtered results:`,
      );
      await this.showPhones(chatId, 0);
      return;
    }

    if (data === 'filter_clear') {
      this.userStates.set(chatId, {});
      await this.bot.sendMessage(
        chatId,
        'Filters cleared! Showing all phones:',
      );
      await this.showPhones(chatId, 0);
      return;
    }
  }

  private async showPhones(chatId: number, page = 0) {
    const userState = this.getUserState(chatId);
    const filters = userState.activeFilters || {};

    const phones = await this.phoneService.filterPhones(filters);

    if (phones.length === 0) {
      await this.bot.sendMessage(
        chatId,
        'No phones found with selected filters.',
      );
      return;
    }

    const start = page * this.PAGE_SIZE;
    const end = start + this.PAGE_SIZE;
    const currentPagePhones = phones.slice(start, end);

    const inlineKeyboard = [];

    currentPagePhones.forEach((phone) => {
      inlineKeyboard.push([
        {
          text: `${phone.brand} ${phone.model} - $${phone.price}`,
          callback_data: `phone_${phone.id}`,
        },
      ]);
    });

    const navButtons = [];
    if (page > 0) {
      navButtons.push({
        text: '⬅️ Previous',
        callback_data: `page_${page - 1}`,
      });
    }
    if (end < phones.length) {
      navButtons.push({
        text: '➡️ Next',
        callback_data: `page_${page + 1}`,
      });
    }
    if (navButtons.length > 0) {
      inlineKeyboard.push(navButtons);
    }

    if (Object.keys(filters).length > 0) {
      inlineKeyboard.push([
        {
          text: '🔄 Clear Filters',
          callback_data: 'filter_clear',
        },
      ]);
    }

    await this.bot.sendMessage(chatId, '📱 Available Phones:', {
      reply_markup: { inline_keyboard: inlineKeyboard },
    });
  }

  private async handleAwaitingResponse(
    chatId: number,
    text: string,
    userState: any,
  ) {
    if (userState.awaitingResponse === 'price_range') {
      const match = text.match(/(\d+)-(\d+)/);
      if (match) {
        const [, min, max] = match;
        userState.activeFilters = {
          ...userState.activeFilters,
          minPrice: parseInt(min),
          maxPrice: parseInt(max),
        };

        await this.bot.sendMessage(
          chatId,
          `Price filter set: $${min}-$${max}\nShowing filtered results:`,
        );
        await this.showPhones(chatId, 0);
      } else {
        await this.bot.sendMessage(
          chatId,
          'Invalid format. Please use format "min-max" (e.g., 500-1000)',
        );
      }
      userState.awaitingResponse = null;
    }
  }

  private getUserState(chatId: number) {
    if (!this.userStates.has(chatId)) {
      this.userStates.set(chatId, {});
    }
    return this.userStates.get(chatId);
  }

  private async showHelp(chatId: number) {
    const helpMessage = `
🤖 Phone Store Bot Help

Available actions:
📱 View All Phones - Browse our phone catalog
🔍 Filter Phones - Search phones by brand, price, or storage
❓ Help - Show this help message

Tips:
- Use the main menu buttons to navigate
- You can filter phones by multiple criteria
- Click on any phone to see detailed information
- Use navigation buttons to move between pages
    `;

    await this.bot.sendMessage(chatId, helpMessage);
  }

  private async handleBuyPhone(chatId: number, phoneId: number) {
    try {
      const phone = await this.phoneService.findById(phoneId);
      if (!phone) {
        await this.bot.sendMessage(chatId, 'Phone not found');
        return;
      }

      const order = await this.paymentService.createOrder(
        phone.id,
        chatId,
        phone.price,
      );

      const description = `Payment for ${phone.brand} ${phone.model}`;
      const paymentForm = await this.paymentService.createPaymentLink(
        order,
        description,
      );

      await this.bot.sendMessage(
        chatId,
        `🛒 Order created!\n\n` +
          `Phone: ${phone.brand} ${phone.model}\n` +
          `Price: ${phone.price} UAH\n\n` +
          `Click the button below to proceed with payment:`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '💳 Pay now',
                  url: paymentForm.href,
                },
              ],
            ],
          },
        },
      );
    } catch (error) {
      console.error('Payment error:', error);
      await this.bot.sendMessage(
        chatId,
        'Sorry, there was an error processing your payment. Please try again later.',
      );
    }
  }

  private async showOrders(chatId: number) {
    try {
      const orders = await this.paymentService.getUserOrders(chatId);

      if (!orders || orders.length === 0) {
        await this.bot.sendMessage(chatId, 'You have no orders yet.');
        return;
      }

      for (const order of orders) {
        const phone = await this.phoneService.findById(order.phoneId);

        const message = `
🛍️ Order #${order.orderId}
📱 ${phone.brand} ${phone.model}
💰 Amount: ${order.amount} UAH
📅 Date: ${order.createdAt.toLocaleDateString()}
Status: ${this.getStatusEmoji(order.status)} ${order.status}
${order.paidAt ? `Paid at: ${order.paidAt.toLocaleDateString()}` : ''}
      `;

        await this.bot.sendMessage(chatId, message);
      }
    } catch (error) {
      console.error('Error showing orders:', error);
      await this.bot.sendMessage(chatId, 'Sorry, failed to load your orders.');
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'paid':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '❔';
    }
  }
}
