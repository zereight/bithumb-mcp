#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import axios from 'axios';
import CryptoJS from 'crypto-js';
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

// 빗썸 API 호출 유틸리티
class BithumbAPI {
  private apiKey: string;
  private secretKey: string;

  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  private generateSignature(endpoint: string, nonce: number): string {
    const message = `${endpoint}${nonce}`;
    return CryptoJS.HmacSHA512(message, this.secretKey).toString(CryptoJS.enc.Hex);
  }

  async publicApi(endpoint: string, params = {}) {
    const url = `https://api.bithumb.com/public${endpoint}`;
    const response = await axios.get(url, { params });
    return response.data;
  }

  async privateApi(endpoint: string, params = {}) {
    const nonce = Date.now();
    const signature = this.generateSignature(endpoint, nonce);
    
    const url = `https://api.bithumb.com${endpoint}`;
    const response = await axios.post(url, null, {
      headers: {
        'Api-Key': this.apiKey,
        'Api-Sign': signature,
        'Api-Nonce': nonce.toString(),
        'Content-Type': 'application/json'
      },
      params
    });
    return response.data;
  }
}

// MCP 서버 클래스
class BithumbMCPServer {
  private server: Server;
  private bithumbApi: BithumbAPI;

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

    this.bithumbApi = new BithumbAPI(API_KEY, SECRET_KEY);
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
          inputSchema: { type: 'object' }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case 'get_ticker':
            const ticker = await this.bithumbApi.publicApi('/ticker', {
              currency: request.params.arguments?.currency || 'BTC'
            });
            return {
              content: [{ type: 'text', text: JSON.stringify(ticker, null, 2) }]
            };
            
          case 'get_balance':
            const balance = await this.bithumbApi.privateApi('/info/balance');
            return {
              content: [{ type: 'text', text: JSON.stringify(balance, null, 2) }]
            };
            
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          throw new McpError(
            ErrorCode.InternalError,
            `Bithumb API error: ${error.response?.data?.message || error.message}`
          );
        }
        throw error;
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