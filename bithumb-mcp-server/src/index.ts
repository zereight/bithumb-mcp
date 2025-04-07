#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ErrorCode,
	ListToolsRequestSchema,
	McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Bithumb Public API URL
const BITHUMB_API_URL = 'https://api.bithumb.com/public/ticker';

// Type guard for validating get_ticker arguments
const isValidTickerArgs = (
	args: any
): args is { order_currency: string; payment_currency?: string } =>
	typeof args === 'object' &&
	args !== null &&
	typeof args.order_currency === 'string' &&
	(args.payment_currency === undefined || typeof args.payment_currency === 'string');

class BithumbServer {
	private server: Server;
	private axiosInstance;

	constructor() {
		this.server = new Server(
			{
				name: 'bithumb-mcp-server',
				version: '0.1.0',
			},
			{
				capabilities: {
					tools: {},
				},
			}
		);

		this.axiosInstance = axios.create();

		this.setupToolHandlers();

		// Error handling
		this.server.onerror = (error) => console.error('[MCP Error]', error);
		process.on('SIGINT', async () => {
			await this.server.close();
			process.exit(0);
		});
	}

	private setupToolHandlers() {
		// Expose the get_ticker tool
		this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
			tools: [
				{
					name: 'get_ticker',
					description: 'Get ticker information for a specific cryptocurrency on Bithumb.',
					inputSchema: {
						type: 'object',
						properties: {
							order_currency: {
								type: 'string',
								description: 'Order currency symbol (e.g., BTC, ETH). Use ALL for all tickers.',
							},
							payment_currency: {
								type: 'string',
								description: 'Payment currency (e.g., KRW). Defaults to KRW.',
								default: 'KRW',
							},
						},
						required: ['order_currency'],
					},
				},
			],
		}));

		// Handle calls to the get_ticker tool
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			if (request.params.name !== 'get_ticker') {
				throw new McpError(
					ErrorCode.MethodNotFound,
					`Unknown tool: ${request.params.name}`
				);
			}

			if (!isValidTickerArgs(request.params.arguments)) {
				throw new McpError(
					ErrorCode.InvalidParams,
					'Invalid ticker arguments'
				);
			}

			const orderCurrency = request.params.arguments.order_currency.toUpperCase();
			const paymentCurrency = (request.params.arguments.payment_currency || 'KRW').toUpperCase();
			const path = `${orderCurrency}_${paymentCurrency}`; // e.g., BTC_KRW or ALL_KRW

			try {
				const response = await this.axiosInstance.get(`${BITHUMB_API_URL}/${path}`);

				// Check Bithumb API status
				if (response.data.status !== '0000') {
					return {
						content: [
							{
								type: 'text',
								text: `Bithumb API error: ${response.data.message || 'Unknown error'} (Status: ${response.data.status})`,
							},
						],
						isError: true,
					};
				}

				return {
					content: [
						{
							type: 'text',
							text: JSON.stringify(response.data.data, null, 2),
						},
					],
				};
			} catch (error) {
				if (axios.isAxiosError(error)) {
					// Handle network or other axios errors
					const errorMessage = error.response?.data
						? JSON.stringify(error.response.data)
						: error.message;
					return {
						content: [
							{
								type: 'text',
								text: `Bithumb API request failed: ${errorMessage}`,
							},
						],
						isError: true,
					};
				}
				// Handle unexpected errors
				console.error('Unexpected error calling Bithumb API:', error);
				throw new McpError(
					ErrorCode.InternalError,
					`Unexpected error: ${(error as Error).message}`
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

const server = new BithumbServer();
server.run().catch(console.error);
