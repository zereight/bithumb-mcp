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
import { RSI } from 'technicalindicators'; // Import RSI

// Bithumb Public API URLs
const BITHUMB_TICKER_URL = 'https://api.bithumb.com/public/ticker';
const BITHUMB_CANDLESTICK_URL = 'https://api.bithumb.com/public/candlestick';

// Type guard for validating get_ticker arguments
const isValidTickerArgs = (
	args: any
): args is { order_currency: string; payment_currency?: string } =>
	typeof args === 'object' &&
	args !== null &&
	typeof args.order_currency === 'string' &&
	(args.payment_currency === undefined || typeof args.payment_currency === 'string');

// Type guard for validating find_lowest_rsi_among_top_traded arguments
const isValidRsiArgs = (
	args: any
): args is { interval?: string } =>
	typeof args === 'object' &&
	args !== null &&
	(args.interval === undefined || typeof args.interval === 'string');


// Interface for Candlestick data point
// [timestamp, open, close, high, low, volume]
type CandlestickData = [number, string, string, string, string, string];

// Allowed intervals for Bithumb Candlestick API
const ALLOWED_INTERVALS = ['1m', '3m', '5m', '10m', '30m', '1h', '6h', '12h', '24h'];


class BithumbServer {
	private server: Server;
	private axiosInstance;

	constructor() {
		this.server = new Server(
			{
				name: 'bithumb-mcp-server',
				version: '0.1.2', // Incremented version
			},
			{
				capabilities: {
					tools: {},
				},
			}
		);

		this.axiosInstance = axios.create({ timeout: 10000 }); // Added timeout

		this.setupToolHandlers();

		// Error handling
		this.server.onerror = (error) => console.error('[MCP Error]', error);
		process.on('SIGINT', async () => {
			await this.server.close();
			process.exit(0);
		});
	}

	// Function to fetch candlestick data
	private async getCandlestickData(orderCurrency: string, paymentCurrency: string, interval: string): Promise<CandlestickData[]> {
		if (!ALLOWED_INTERVALS.includes(interval)) {
			throw new Error(`Invalid interval: ${interval}. Allowed intervals are: ${ALLOWED_INTERVALS.join(', ')}`);
		}
		const path = `${orderCurrency}_${paymentCurrency}/${interval}`; // e.g., BTC_KRW/1h
		try {
			const response = await this.axiosInstance.get(`${BITHUMB_CANDLESTICK_URL}/${path}`);
			if (response.data.status !== '0000') {
				throw new Error(`Bithumb Candlestick API error: ${response.data.message || 'Unknown error'} (Status: ${response.data.status})`);
			}
			// Ensure data is an array before returning
			if (!Array.isArray(response.data.data)) {
				throw new Error('Invalid data format received from Bithumb Candlestick API');
			}
			return response.data.data as CandlestickData[];
		} catch (error) {
			if (axios.isAxiosError(error)) {
				const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
				throw new Error(`Bithumb Candlestick API request failed: ${errorMessage}`);
			}
			throw error; // Re-throw other errors
		}
	}

	// Function to calculate RSI
	private calculateRSI(data: CandlestickData[], period: number = 14): number | null {
		if (data.length < period + 1) { // Need at least period + 1 data points
			return null;
		}
		const closingPrices = data.map(candle => parseFloat(candle[2])).filter(price => !isNaN(price)); // Extract and validate closing prices
		if (closingPrices.length < period + 1) {
			return null; // Not enough valid closing prices
		}
		const rsiResult = RSI.calculate({ period, values: closingPrices });
		return rsiResult.length > 0 ? rsiResult[rsiResult.length - 1] : null; // Return the latest RSI value
	}


	private setupToolHandlers() {
		// Expose tools
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
				{ // Updated tool definition
					name: 'find_lowest_rsi_among_top_traded',
					description: `Finds the coin with the lowest RSI among the top 10 most traded coins (KRW market) in the last 24 hours for a given interval. Allowed intervals: ${ALLOWED_INTERVALS.join(', ')}.`,
					inputSchema: {
						type: 'object',
						properties: {
							interval: {
								type: 'string',
								description: `Candlestick interval (e.g., '1h', '4h', '24h'). Defaults to '4h'. Allowed: ${ALLOWED_INTERVALS.join(', ')}`,
								default: '4h',
								enum: ALLOWED_INTERVALS, // Add enum for validation
							},
						},
						required: [], // No required parameters
					},
				},
			],
		}));

		// Handle tool calls
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			// --- get_ticker handler ---
			if (request.params.name === 'get_ticker') {
				if (!isValidTickerArgs(request.params.arguments)) {
					throw new McpError(ErrorCode.InvalidParams, 'Invalid ticker arguments');
				}
				const orderCurrency = request.params.arguments.order_currency.toUpperCase();
				const paymentCurrency = (request.params.arguments.payment_currency || 'KRW').toUpperCase();
				const path = `${orderCurrency}_${paymentCurrency}`;

				try {
					const response = await this.axiosInstance.get(`${BITHUMB_TICKER_URL}/${path}`);
					if (response.data.status !== '0000') {
						return {
							content: [{ type: 'text', text: `Bithumb API error: ${response.data.message || 'Unknown error'} (Status: ${response.data.status})` }],
							isError: true,
						};
					}
					return { content: [{ type: 'text', text: JSON.stringify(response.data.data, null, 2) }] };
				} catch (error) {
					if (axios.isAxiosError(error)) {
						const errorMessage = error.response?.data ? JSON.stringify(error.response.data) : error.message;
						return { content: [{ type: 'text', text: `Bithumb API request failed: ${errorMessage}` }], isError: true };
					}
					console.error('Unexpected error calling Bithumb Ticker API:', error);
					throw new McpError(ErrorCode.InternalError, `Unexpected error: ${(error as Error).message}`);
				}
			}
			// --- find_lowest_rsi_among_top_traded handler ---
			else if (request.params.name === 'find_lowest_rsi_among_top_traded') {
				if (!isValidRsiArgs(request.params.arguments)) {
					throw new McpError(ErrorCode.InvalidParams, 'Invalid RSI arguments');
				}
				const interval = request.params.arguments.interval || '4h'; // Use provided interval or default to 4h

				try {
					// 1. Get all tickers
					const tickerResponse = await this.axiosInstance.get(`${BITHUMB_TICKER_URL}/ALL_KRW`);
					if (tickerResponse.data.status !== '0000') {
						throw new Error(`Bithumb Ticker API error: ${tickerResponse.data.message || 'Unknown error'} (Status: ${tickerResponse.data.status})`);
					}
					const tickers = tickerResponse.data.data;
					delete tickers.date; // Remove the date key

					// 2. Filter KRW market and find top 10 by 24h trade value
					const krwTickers = Object.entries(tickers)
						.map(([symbol, data]: [string, any]) => ({
							symbol,
							tradeValue24H: parseFloat(data.acc_trade_value_24H || '0'),
						}))
						.filter(ticker => !isNaN(ticker.tradeValue24H)) // Ensure tradeValue is a number
						.sort((a, b) => b.tradeValue24H - a.tradeValue24H)
						.slice(0, 10);

					if (krwTickers.length === 0) {
						return { content: [{ type: 'text', text: 'Could not find any KRW market tickers.' }], isError: true };
					}

					// 3. Get candlestick data and calculate RSI for each top coin
					let lowestRsi = Infinity;
					let coinWithLowestRsi = '';
					const rsiResults: { symbol: string; rsi: number | null }[] = [];

					for (const ticker of krwTickers) {
						try {
							const candlestickData = await this.getCandlestickData(ticker.symbol, 'KRW', interval); // Use the interval parameter
							const rsi = this.calculateRSI(candlestickData, 14);
							rsiResults.push({ symbol: ticker.symbol, rsi });

							if (rsi !== null && rsi < lowestRsi) {
								lowestRsi = rsi;
								coinWithLowestRsi = ticker.symbol;
							}
						} catch (candleError) {
							console.error(`Error fetching/calculating RSI for ${ticker.symbol} (${interval}):`, candleError);
							rsiResults.push({ symbol: ticker.symbol, rsi: null }); // Mark as error for this coin
						}
					}

					if (coinWithLowestRsi === '') {
						return { content: [{ type: 'text', text: `Could not calculate RSI (${interval}) for any of the top 10 traded coins.` }], isError: true };
					}

					// 4. Return the result
					const resultText = `Among the top 10 traded KRW market coins, ${coinWithLowestRsi} has the lowest ${interval} RSI: ${lowestRsi.toFixed(2)}.`;
					const detailedResults = rsiResults.map(r => `${r.symbol}: ${r.rsi !== null ? r.rsi.toFixed(2) : 'Error'}`).join('\n');

					return { content: [{ type: 'text', text: `${resultText}\n\nDetails:\n${detailedResults}` }] };

				} catch (error) {
					console.error(`Error in find_lowest_rsi_among_top_traded (${interval}):`, error);
					const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
					return { content: [{ type: 'text', text: `Error finding lowest RSI coin (${interval}): ${errorMessage}` }], isError: true };
				}
			}
			// --- Unknown tool handler ---
			else {
				throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
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
