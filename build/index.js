#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const axios_1 = __importDefault(require("axios"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
// 환경 변수 설정 확인 및 타입 강제
const API_KEY = process.env.BITHUMB_API_KEY;
const SECRET_KEY = process.env.BITHUMB_SECRET_KEY;
if (!API_KEY || !SECRET_KEY) {
    throw new Error('BITHUMB_API_KEY and BITHUMB_SECRET_KEY environment variables are required');
}
// 빗썸 API 호출 유틸리티
class BithumbAPI {
    constructor(apiKey, secretKey) {
        this.apiKey = apiKey;
        this.secretKey = secretKey;
    }
    generateSignature(endpoint, nonce) {
        const message = `${endpoint}${nonce}`;
        return crypto_js_1.default.HmacSHA512(message, this.secretKey).toString(crypto_js_1.default.enc.Hex);
    }
    async publicApi(endpoint, params = {}) {
        const url = `https://api.bithumb.com/public${endpoint}`;
        const response = await axios_1.default.get(url, { params });
        return response.data;
    }
    async privateApi(endpoint, params = {}) {
        const nonce = Date.now();
        const signature = this.generateSignature(endpoint, nonce);
        const url = `https://api.bithumb.com${endpoint}`;
        const response = await axios_1.default.post(url, null, {
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
    constructor() {
        this.server = new index_js_1.Server({
            name: 'bithumb-mcp',
            version: '1.0.0'
        }, {
            capabilities: {
                resources: {},
                tools: {}
            }
        });
        this.bithumbApi = new BithumbAPI(API_KEY, SECRET_KEY);
        this.setupToolHandlers();
        this.server.onerror = (error) => console.error('[Bithumb MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
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
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
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
                        throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
            }
            catch (error) {
                if (axios_1.default.isAxiosError(error)) {
                    throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Bithumb API error: ${error.response?.data?.message || error.message}`);
                }
                throw error;
            }
        });
    }
    async run() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.error('Bithumb MCP server running on stdio');
    }
}
const server = new BithumbMCPServer();
server.run().catch(console.error);
