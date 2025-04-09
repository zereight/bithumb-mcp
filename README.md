# Bithumb MCP Server
[![smithery badge](https://smithery.ai/badge/@zereight/bithumb-mcp)](https://smithery.ai/server/@zereight/bithumb-mcp)

[Korean version available here](README_ko.md)

## @zereight/bithumb-mcp

Bithumb MCP (Model Context Protocol) Server. Allows interaction with the Bithumb API to fetch cryptocurrency information and manage transactions.

## Usage

### Installing via Smithery

To install bithumb-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@zereight/bithumb-mcp):

```bash
npx -y @smithery/cli install @zereight/bithumb-mcp --client claude
```

### Using with Claude, Roo Code, Cline, etc.

Add the following configuration to your MCP settings file (e.g., `mcp_settings.json`):

```json
{
  "mcpServers": {
    "bithumb-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@zereight/bithumb-mcp@latest"
      ],
      "env": {
        "BITHUMB_API_KEY": "YOUR_BITHUMB_API_KEY", // Required
        "BITHUMB_SECRET_KEY": "YOUR_BITHUMB_SECRET_KEY" // Required
      },
      "disabled": false
    }
  }
}
```

> **Note**: Always use `@latest` tag to ensure you are using the most recent version with all bug fixes and improvements.

### Using with Cursor (or direct CLI)

When using with Cursor or running directly, you can set up environment variables and run the server as follows:

```bash
env BITHUMB_API_KEY=YOUR_BITHUMB_API_KEY \
    BITHUMB_SECRET_KEY=YOUR_BITHUMB_SECRET_KEY \
    npx @zereight/bithumb-mcp
```

- `BITHUMB_API_KEY` (Required): Your Bithumb API key.
- `BITHUMB_SECRET_KEY` (Required): Your Bithumb secret key.

## Tools 🛠️

1. **`get_ticker`**
   - Fetches cryptocurrency ticker information.
   - Inputs:
     - `coinCode` (string, required): The cryptocurrency symbol (e.g., BTC, ETH).
   - Returns: Ticker information (JSON string).

2. **`get_orderbook`**
   - Fetches order book information.
   - Inputs:
     - `coinCode` (string, required): The cryptocurrency symbol (e.g., BTC, ETH).
   - Returns: Order book details (JSON string).

3. **`get_transaction_history`**
   - Fetches recent transaction history.
   - Inputs:
     - `coinCode` (string, required): The cryptocurrency symbol (e.g., BTC, ETH).
   - Returns: Transaction history (JSON string).

4. **`get_assets_status`**
   - Fetches asset deposit/withdrawal status.
   - Inputs:
     - `orderCurrency` (string, required): The cryptocurrency symbol (e.g., BTC, ETH).
   - Returns: Deposit/withdrawal status (JSON string).

5. **`get_candlestick`**
   - Fetches candlestick data.
   - Inputs:
     - `orderCurrency` (string, required): The cryptocurrency symbol (e.g., BTC, ETH).
     - `paymentCurrency` (string, required): Payment currency (e.g., KRW, BTC).
     - `chartIntervals` (string, required): Chart interval (e.g., '1m', '3m').
   - Returns: Candlestick data (JSON string).

6. **`post_account`**
   - Fetches member account information and fees.
   - Inputs:
     - `coinCode` (string, required): The cryptocurrency symbol (e.g., BTC, ETH).
   - Returns: Account information (JSON string).

7. **`get_balance`**
   - Fetches account balance.
   - Inputs:
     - `coinCode` (string, optional): The cryptocurrency symbol (e.g., BTC, ETH) or ALL.
   - Returns: Balance information (JSON string).

8. **`post_wallet_address`**
   - Fetches member's coin deposit wallet address.
   - Inputs:
     - `coinCode` (string, optional): The cryptocurrency symbol (e.g., BTC, ETH).
   - Returns: Wallet address (JSON string).

9. **`post_ticker_user`**
   - Fetches member's recent virtual asset transaction information.
   - Inputs:
     - `orderCurrency` (string, required): The cryptocurrency symbol (e.g., BTC, ETH).
   - Returns: Transaction information (JSON string).

10. **`post_orders`**
    - Fetches member's order details.
    - Inputs:
      - `order_currency` (string, required): Order currency symbol.
      - `orderId` (string, optional): Order ID.
      - `type` (string, optional): Order type (bid or ask).
      - `count` (number, optional): Number of orders to retrieve.
      - `after` (number, optional): Retrieve orders after this timestamp.
    - Returns: Order details (JSON string).

11. **`post_order_detail`**
    - Fetches details of a specific member order.
    - Inputs:
      - `orderId` (string, required): Order ID.
      - `orderCurrency` (string, required): Cryptocurrency symbol (e.g., BTC, ETH).
    - Returns: Order details (JSON string).

12. **`post_user_transactions`**
    - Fetches member's transaction completion history.
    - Inputs:
      - `searchGb` (number, required): Search type (0: all, 1: buy complete, etc.).
      - `orderCurrency` (string, required): Cryptocurrency symbol (e.g., BTC, ETH).
      - `offset` (number, optional): Start index for retrieval.
      - `count» (number, optional): Number of transactions to retrieve.
    - Returns: Transaction history (JSON string).

13. **`post_place`**
    - Places a limit order (buy/sell).
    - Inputs:
      - `orderCurrency» (string, required): Cryptocurrency symbol (e.g., BTC, ETH).
      - `units» (number, required): Order quantity.
      - `price» (number, required): Order price.
      - `type» (string, required): Order type (bid or ask).
    - Returns: Order placement confirmation (JSON string).

14. **`post_cancel`**
    - Cancels an order.
    - Inputs:
      - `type» (string, required): Order type (bid or ask).
      - `orderId» (string, required): Order ID to cancel.
      - `orderCurrency» (string, required): Cryptocurrency symbol (e.g., BTC, ETH).
    - Returns: Cancellation confirmation (JSON string).

15. **`post_market_buy`**
    - Places a market buy order.
    - Inputs:
      - `units» (number, required): Quantity to buy.
      - `orderCurrency» (string, required): Cryptocurrency symbol (e.g., BTC, ETH).
    - Returns: Order placement confirmation (JSON string).

16. **`post_market_sell`**
    - Places a market sell order.
    - Inputs:
      - `units» (number, required): Quantity to sell.
      - `orderCurrency» (string, required): Cryptocurrency symbol (e.g., BTC, ETH).
    - Returns: Order placement confirmation (JSON string).

17. **`post_withdrawal_coin`**
    - Requests a coin withdrawal.
    - Inputs:
      - `units» (number, required): Withdrawal quantity.
      - `address» (string, required): Withdrawal address.
      - `currency» (string, optional): Cryptocurrency symbol (e.g., BTC, ETH).
      - `destination» (string, optional): Destination tag/memo (if required).
    - Returns: Withdrawal request confirmation (JSON string).

18. **`post_withdrawal_krw`**
    - Requests a KRW withdrawal (Deprecated by Bithumb).
    - Inputs:
      - `bank» (string, required): Bank code and name.
      - `account» (string, required): Account number.
      - `price» (number, required): Withdrawal amount.
    - Returns: Withdrawal request confirmation (JSON string).

## Environment Variables

Before running the server, you **must** set the following environment variables:

```
BITHUMB_API_KEY=YOUR_BITHUMB_API_KEY
BITHUMB_SECRET_KEY=YOUR_BITHUMB_SECRET_KEY
```

## License

MIT License
