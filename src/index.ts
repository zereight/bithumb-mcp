#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// Import the new ApiBithumb class
import ApiBithumb from './bitThumb/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';

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

    // console.log('Bithumb API Key:', API_KEY); // Keep keys hidden for security
    // console.log('Bithumb Secret Key:', SECRET_KEY);
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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_ticker',
          description: 'Get cryptocurrency ticker information',
          inputSchema: {
            type: 'object',
            properties: {
              currency: {
                type: 'string',
                description: 'Cryptocurrency symbol (e.g. BTC, ETH)',
                default: 'BTC'
              }
            }
          }
        },
        {
          name: 'get_balance',
          description: 'Get account balance',
          inputSchema: { type: 'object' } // No arguments needed for balance
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'get_ticker':
            // Call the specific getTicker method from ApiBithumb
            // Explicitly cast currency argument to string
            const ticker = await this.bithumbApi.getTicker(
              (request.params.arguments?.currency as string) || 'BTC'
            );
            return {
              content: [{ type: 'text', text: JSON.stringify(ticker, null, 2) }]
            };

          case 'get_balance':
            // Call postBalance method from the new ApiBithumb class
            // Pass 'ALL' to get balance for all currencies, or specify like 'BTC'
            // The postBalance method expects the coin code as argument
            const balance = await this.bithumbApi.postBalance('ALL');
            return {
              content: [{ type: 'text', text: JSON.stringify(balance, null, 2) }]
            };

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
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