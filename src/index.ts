#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// Import the new ApiBithumb class
import ApiBithumb from './bitThumb/index.js';
// Import SDK types
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode
  // ToolDefinition removed as it's not exported from sdk/types.js
} from '@modelcontextprotocol/sdk/types.js';
// Import types specific to ApiBithumb from the local types file
import {
  currencyType,
  Time,
  tradeType,
  IPostOrdersParams
} from './bitThumb/types/index.js';

// 환경 변수 설정 확인 및 타입 강제
const API_KEY = process.env.BITHUMB_API_KEY as string;
const SECRET_KEY = process.env.BITHUMB_SECRET_KEY as string;
if (!API_KEY || !SECRET_KEY) {
  throw new Error('BITHUMB_API_KEY and BITHUMB_SECRET_KEY environment variables are required');
}

// MCP 서버 클래스
class BithumbMCPServer {
  private server: Server;
  private bithumbApi: ApiBithumb; // Use the imported ApiBithumb class

  constructor() {
    this.server = new Server(
      {
        name: 'bithumb-mcp',
        version: '1.0.0'
      },
      {
        capabilities: {
          resources: {},
          tools: {}
        }
      }
    );

    // Initialize the new ApiBithumb class, providing the paymentCurrency
    this.bithumbApi = new ApiBithumb(API_KEY, SECRET_KEY, 'KRW'); // Assuming KRW as default payment currency
    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[Bithumb MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // Define tools based on ApiBithumb methods
    // Use 'any[]' for the tools array type as ToolDefinition is not available
    const tools: any[] = [
      {
        name: 'get_ticker',
        description: 'Get cryptocurrency ticker information (Public)',
        inputSchema: {
          type: 'object',
          properties: {
            coinCode: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)' }
          },
          required: ['coinCode']
        }
      },
      {
        name: 'get_orderbook',
        description: 'Get order book information (Public)',
        inputSchema: {
          type: 'object',
          properties: {
            coinCode: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)' }
          },
          required: ['coinCode']
        }
      },
      {
        name: 'get_transaction_history',
        description: 'Get recent transaction history (Public)',
        inputSchema: {
          type: 'object',
          properties: {
            coinCode: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)' }
          },
          required: ['coinCode']
        }
      },
      {
        name: 'get_assets_status',
        description: 'Get asset deposit/withdrawal status (Public)',
        inputSchema: {
          type: 'object',
          properties: {
            orderCurrency: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)' }
          },
          required: ['orderCurrency']
        }
      },
      {
        name: 'get_btci',
        description: 'Get Bithumb Index (BTMI, BTAI) information (Public)',
        inputSchema: { type: 'object' } // No parameters
      },
      {
        name: 'get_candlestick',
        description: 'Get Candlestick data (Public)',
        inputSchema: {
          type: 'object',
          properties: {
            orderCurrency: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)' },
            paymentCurrency: { type: 'string', enum: ['KRW', 'BTC'], description: 'Payment currency (KRW or BTC)' }, // Assuming KRW/BTC based on standard usage
            chartIntervals: { type: 'string', enum: ['1m', '3m', '5m', '10m', '30m', '1h', '6h', '12h', '24h'], description: 'Chart interval' } // Assuming standard intervals
          },
          required: ['orderCurrency', 'paymentCurrency', 'chartIntervals']
        }
      },
      {
        name: 'post_account',
        description: 'Get member account information and fees (Private)',
        inputSchema: {
          type: 'object',
          properties: {
            coinCode: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)' }
          },
          required: ['coinCode']
        }
      },
      {
        name: 'get_balance', // Renamed from postBalance for clarity, as it retrieves data
        description: 'Get account balance (Private)',
        inputSchema: {
          type: 'object',
          properties: {
            coinCode: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH) or ALL', default: 'ALL' }
          }
        }
      },
      {
        name: 'post_wallet_address',
        description: 'Get member\'s coin deposit wallet address (Private)',
        inputSchema: {
          type: 'object',
          properties: {
            coinCode: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)', default: 'BTC' }
          }
        }
      },
      {
        name: 'post_ticker_user',
        description: 'Get member\'s recent virtual asset transaction information (Private)',
        inputSchema: {
          type: 'object',
          properties: {
            orderCurrency: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)' }
          },
          required: ['orderCurrency']
        }
      },
      {
        name: 'post_orders',
        description: 'Get member\'s order details (Private)',
        inputSchema: {
          type: 'object',
          properties: {
            order_currency: { type: 'string', description: 'Order currency symbol' },
            // payment_currency removed as it's not in IPostOrdersParams
            orderId: { type: 'string', description: 'Order ID (optional)' }, // Corrected name
            type: { type: 'string', enum: ['bid', 'ask'], description: 'Order type (bid or ask) (optional)' },
            count: { type: 'number', description: 'Number of orders to retrieve (optional, default: 100)' },
            after: { type: 'number', description: 'Retrieve orders after this timestamp (optional)' } // Corrected type and description
          },
          required: ['order_currency'] // Only require order_currency now
        }
      },
      {
        name: 'post_order_detail',
        description: 'Get details of a specific member order (Private)',
        inputSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'string', description: 'Order ID' },
            orderCurrency: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)' }
          },
          required: ['orderId', 'orderCurrency']
        }
      },
      {
        name: 'post_user_transactions',
        description: 'Get member\'s transaction completion history (Private)',
        inputSchema: {
          type: 'object',
          properties: {
            searchGb: { type: 'number', enum: [0, 1, 2, 3, 4, 5, 9], description: 'Search type (0: all, 1: buy complete, 2: sell complete, 3: withdrawal processing, 4: deposit, 5: withdrawal complete, 9: KRW deposit)' },
            orderCurrency: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)' },
            offset: { type: 'number', description: 'Start index for retrieval (optional)' },
            count: { type: 'number', description: 'Number of transactions to retrieve (optional, default: 20)' }
          },
          required: ['searchGb', 'orderCurrency']
        }
      },
      {
        name: 'post_place',
        description: 'Place a limit order (buy/sell) (Private)',
        inputSchema: {
          type: 'object',
          properties: {
            orderCurrency: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)' },
            units: { type: 'number', description: 'Order quantity' },
            price: { type: 'number', description: 'Order price' },
            type: { type: 'string', enum: ['bid', 'ask'], description: 'Order type (bid or ask)' }
          },
          required: ['orderCurrency', 'units', 'price', 'type']
        }
      },
      {
        name: 'post_cancel',
        description: 'Cancel an order (Private)',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['bid', 'ask'], description: 'Order type (bid or ask)' },
            orderId: { type: 'string', description: 'Order ID to cancel' },
            orderCurrency: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)' }
          },
          required: ['type', 'orderId', 'orderCurrency']
        }
      },
      {
        name: 'post_market_buy',
        description: 'Place a market buy order (Private)',
        inputSchema: {
          type: 'object',
          properties: {
            units: { type: 'number', description: 'Quantity to buy' },
            orderCurrency: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)' }
          },
          required: ['units', 'orderCurrency']
        }
      },
      {
        name: 'post_market_sell',
        description: 'Place a market sell order (Private)',
        inputSchema: {
          type: 'object',
          properties: {
            units: { type: 'number', description: 'Quantity to sell' },
            orderCurrency: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)' }
          },
          required: ['units', 'orderCurrency']
        }
      },
      {
        name: 'post_withdrawal_coin',
        description: 'Request a coin withdrawal (Private)',
        inputSchema: {
          type: 'object',
          properties: {
            units: { type: 'number', description: 'Withdrawal quantity' },
            address: { type: 'string', description: 'Withdrawal address' },
            currency: { type: 'string', description: 'Cryptocurrency symbol (e.g. BTC, ETH)', default: 'BTC' },
            destination: { type: 'string', description: 'Destination tag/memo (optional, if required)' }
          },
          required: ['units', 'address']
        }
      },
      {
        name: 'post_withdrawal_krw',
        description: 'Request a KRW withdrawal (Private, Deprecated by Bithumb)',
        inputSchema: {
          type: 'object',
          properties: {
            bank: { type: 'string', description: 'Bank code and name (e.g., 004_은행)' },
            account: { type: 'string', description: 'Account number' },
            price: { type: 'number', description: 'Withdrawal amount' }
          },
          required: ['bank', 'account', 'price']
        }
      }
    ];

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const args = request.params.arguments || {};
      let result: any; // To store the result from API call

      try {
        switch (request.params.name) {
          case 'get_ticker':
            result = await this.bithumbApi.getTicker(args.coinCode as string);
            break;
          case 'get_orderbook':
            result = await this.bithumbApi.getOrderBook(args.coinCode as string);
            break;
          case 'get_transaction_history':
            result = await this.bithumbApi.getTransactionHistory(args.coinCode as string);
            break;
          case 'get_assets_status':
            result = await this.bithumbApi.getAssetsStatus(args.orderCurrency as string);
            break;
          case 'get_btci':
            result = await this.bithumbApi.getBtci();
            break;
          case 'get_candlestick':
            result = await this.bithumbApi.GetCandlestick(
              args.orderCurrency as string,
              args.paymentCurrency as currencyType, // Cast to expected type
              args.chartIntervals as Time // Cast to expected type
            );
            break;
          case 'post_account':
            result = await this.bithumbApi.postAccount(args.coinCode as string);
            break;
          case 'get_balance':
            result = await this.bithumbApi.postBalance(args.coinCode as string || 'ALL');
            break;
          case 'post_wallet_address':
            result = await this.bithumbApi.postWalletAddress(args.coinCode as string);
            break;
          case 'post_ticker_user':
            result = await this.bithumbApi.postTickerUser(args.orderCurrency as string);
            break;
          case 'post_orders':
             // Construct params object safely using if checks
             const orderParams: IPostOrdersParams = {
                order_currency: args.order_currency as string,
                // payment_currency removed
             };
             if (args.orderId) orderParams.orderId = args.orderId as string; // Corrected name
             if (args.type) orderParams.type = args.type as tradeType;
             if (args.count) orderParams.count = args.count as number;
             // Correctly handle 'after' as a number
             if (args.after !== undefined && args.after !== null) {
                 const afterNum = Number(args.after); // Convert to number
                 if (!isNaN(afterNum)) {
                     orderParams.after = afterNum;
                 } else {
                     // Handle error: 'after' argument is not a valid number
                     throw new McpError(ErrorCode.InvalidParams, "'after' argument must be a number.");
                 }
             }
            result = await this.bithumbApi.postOrders(orderParams);
            break;
          case 'post_order_detail':
            result = await this.bithumbApi.postOrderDetail(args.orderId as string, args.orderCurrency as string);
            break;
          case 'post_user_transactions':
            result = await this.bithumbApi.postUserTransactions(
              args.searchGb as number,
              args.orderCurrency as string,
              args.offset as number | undefined,
              args.count as number | undefined
            );
            break;
          case 'post_place':
            result = await this.bithumbApi.postPlace(
              args.orderCurrency as string,
              args.units as number,
              args.price as number,
              args.type as tradeType // Cast to expected type
            );
            break;
          case 'post_cancel':
            result = await this.bithumbApi.postCancel(
              args.type as tradeType, // Cast to expected type
              args.orderId as string,
              args.orderCurrency as string
            );
            break;
          case 'post_market_buy':
            result = await this.bithumbApi.postMarketBuy(args.units as number, args.orderCurrency as string);
            break;
          case 'post_market_sell':
            result = await this.bithumbApi.postMarketSell(args.units as number, args.orderCurrency as string);
            break;
          case 'post_withdrawal_coin':
            result = await this.bithumbApi.postWithdrawalCoin(
              args.units as number,
              args.address as string,
              args.currency as string | undefined,
              args.destination as string | undefined
            );
            break;
          case 'post_withdrawal_krw':
            result = await this.bithumbApi.postWithdrawalKrw(
              args.bank as string,
              args.account as string,
              args.price as number
            );
            break;
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }

        // Return successful result
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };

      } catch (error: any) { // Explicitly type error as any
        // Handle potential errors from ApiBithumb which might not be Axios errors directly
        // The ApiBithumb class already stringifies the error, so we can use error.message
        throw new McpError(
          ErrorCode.InternalError,
          `Bithumb API error: ${error.message}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Bithumb MCP server running on stdio');
  }
}

const server = new BithumbMCPServer();
server.run().catch(console.error);