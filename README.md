# 빗썸 MCP 서버

## @zereight/bithumb-mcp

빗썸 MCP (모델 컨텍스트 프로토콜) 서버. 빗썸 API와 상호작용하여 암호화폐 정보를 가져오고 거래를 관리할 수 있습니다.

## 사용법

### Claude, Roo Code, Cline 등과 함께 사용하기

다음 구성을 MCP 설정 파일(예: `mcp_settings.json`)에 추가하세요:

```json
{
  "mcpServers": {
    "bithumb-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@zereight/bithumb-mcp"
      ],
      "env": {
        "BITHUMB_API_KEY": "YOUR_BITHUMB_API_KEY", // 필수
        "BITHUMB_SECRET_KEY": "YOUR_BITHUMB_SECRET_KEY" // 필수
      },
      "disabled": false
    }
  }
}
```

`"YOUR_BITHUMB_API_KEY"`와 `"YOUR_BITHUMB_SECRET_KEY"`를 실제 빗썸 API 자격 증명으로 교체하세요.

### Cursor(또는 직접 CLI)와 함께 사용하기

Cursor와 함께 사용하거나 직접 실행할 때는 환경 변수를 설정하고 서버를 다음과 같이 실행할 수 있습니다:

```bash
env BITHUMB_API_KEY=YOUR_BITHUMB_API_KEY \
    BITHUMB_SECRET_KEY=YOUR_BITHUMB_SECRET_KEY \
    npx @zereight/bithumb-mcp
```

- `BITHUMB_API_KEY` (필수): 빗썸 API 키.
- `BITHUMB_SECRET_KEY` (필수): 빗썸 비밀 키.

## 도구 목록 🛠️

1. **`get_ticker`**
   - 암호화폐 시세 정보를 가져옵니다.
   - 입력:
     - `coinCode` (문자열, 필수): 암호화폐 심볼 (예: BTC, ETH).
   - 반환: 시세 정보 (JSON 문자열).

2. **`get_orderbook`**
   - 주문서 정보를 가져옵니다.
   - 입력:
     - `coinCode` (문자열, 필수): 암호화폐 심볼 (예: BTC, ETH).
   - 반환: 주문서 세부정보 (JSON 문자열).

3. **`get_transaction_history`**
   - 최근 거래 내역을 가져옵니다.
   - 입력:
     - `coinCode` (문자열, 필수): 암호화폐 심볼 (예: BTC, ETH).
   - 반환: 거래 내역 (JSON 문자열).

4. **`get_assets_status`**
   - 자산 입출금 상태를 가져옵니다.
   - 입력:
     - `orderCurrency` (문자열, 필수): 암호화폐 심볼 (예: BTC, ETH).
   - 반환: 입출금 상태 (JSON 문자열).

5. **`get_candlestick`**
   - 캔들스틱 데이터를 가져옵니다.
   - 입력:
     - `orderCurrency` (문자열, 필수): 암호화폐 심볼 (예: BTC, ETH).
     - `paymentCurrency` (문자열, 필수): 결제 통화 (예: KRW, BTC).
     - `chartIntervals` (문자열, 필수): 차트 간격 (예: '1m', '3m').
   - 반환: 캔들스틱 데이터 (JSON 문자열).

6. **`post_account`**
   - 회원 계좌 정보 및 수수료를 가져옵니다.
   - 입력:
     - `coinCode` (문자열, 필수): 암호화폐 심볼 (예: BTC, ETH).
   - 반환: 계좌 정보 (JSON 문자열).

7. **`get_balance`**
   - 계좌 잔액을 가져옵니다.
   - 입력:
     - `coinCode` (문자열, 선택적): 암호화폐 심볼 (예: BTC, ETH) 또는 ALL.
   - 반환: 잔액 정보 (JSON 문자열).

8. **`post_wallet_address`**
   - 회원의 암호화폐 입금 지갑 주소를 가져옵니다.
   - 입력:
     - `coinCode` (문자열, 선택적): 암호화폐 심볼 (예: BTC, ETH).
   - 반환: 지갑 주소 (JSON 문자열).

9. **`post_ticker_user`**
   - 회원의 최근 가상자산 거래 정보를 가져옵니다.
   - 입력:
     - `orderCurrency` (문자열, 필수): 암호화폐 심볼 (예: BTC, ETH).
   - 반환: 거래 정보 (JSON 문자열).

10. **`post_orders`**
    - 회원의 주문 세부정보를 가져옵니다.
    - 입력:
      - `order_currency` (문자열, 필수): 주문 통화 심볼.
      - `orderId` (문자열, 선택적): 주문 ID.
      - `type` (문자열, 선택적): 주문 유형 (bid 또는 ask).
      - `count` (숫자, 선택적): 가져올 주문 수.
      - `after` (숫자, 선택적): 이 타임스탬프 이후의 주문을 가져옵니다.
    - 반환: 주문 세부정보 (JSON 문자열).

11. **`post_order_detail`**
    - 특정 회원 주문의 세부정보를 가져옵니다.
    - 입력:
      - `orderId` (문자열, 필수): 주문 ID.
      - `orderCurrency` (문자열, 필수): 암호화폐 심볼 (예: BTC, ETH).
    - 반환: 주문 세부정보 (JSON 문자열).

12. **`post_user_transactions`**
    - 회원의 거래 완료 내역을 가져옵니다.
    - 입력:
      - `searchGb` (숫자, 필수): 검색 유형 (0: 전체, 1: 매수 완료 등).
      - `orderCurrency` (문자열, 필수): 암호화폐 심볼 (예: BTC, ETH).
      - `offset` (숫자, 선택적): 검색 시작 인덱스.
      - `count` (숫자, 선택적): 가져올 거래 수.
    - 반환: 거래 내역 (JSON 문자열).

13. **`post_place`**
    - 지정가 주문(매수/매도)을 합니다.
    - 입력:
      - `orderCurrency` (문자열, 필수): 암호화폐 심볼 (예: BTC, ETH).
      - `units` (숫자, 필수): 주문 수량.
      - `price` (숫자, 필수): 주문 가격.
      - `type` (문자열, 필수): 주문 유형 (bid 또는 ask).
    - 반환: 주문 확인 (JSON 문자열).

14. **`post_cancel`**
    - 주문을 취소합니다.
    - 입력:
      - `type` (문자열, 필수): 주문 유형 (bid 또는 ask).
      - `orderId` (문자열, 필수): 취소할 주문 ID.
      - `orderCurrency` (문자열, 필수): 암호화폐 심볼 (예: BTC, ETH).
    - 반환: 취소 확인 (JSON 문자열).

15. **`post_market_buy`**
    - 시장 매수 주문을 합니다.
    - 입력:
      - `units` (숫자, 필수): 매수 수량.
      - `orderCurrency` (문자열, 필수): 암호화폐 심볼 (예: BTC, ETH).
    - 반환: 주문 확인 (JSON 문자열).

16. **`post_market_sell`**
    - 시장 매도 주문을 합니다.
    - 입력:
      - `units` (숫자, 필수): 매도 수량.
      - `orderCurrency` (문자열, 필수): 암호화폐 심볼 (예: BTC, ETH).
    - 반환: 주문 확인 (JSON 문자열).

17. **`post_withdrawal_coin`**
    - 암호화폐 출금을 요청합니다.
    - 입력:
      - `units` (숫자, 필수): 출금 수량.
      - `address` (문자열, 필수): 출금 주소.
      - `currency` (문자열, 선택적): 암호화폐 심볼 (예: BTC, ETH).
      - `destination` (문자열, 선택적): 목적지 태그/메모 (필요한 경우).
    - 반환: 출금 요청 확인 (JSON 문자열).

18. **`post_withdrawal_krw`**
    - KRW 출금을 요청합니다 (빗썸에서 더 이상 사용되지 않음).
    - 입력:
      - `bank` (문자열, 필수): 은행 코드 및 이름.
      - `account` (문자열, 필수): 계좌 번호.
      - `price` (숫자, 필수): 출금 금액.
    - 반환: 출금 요청 확인 (JSON 문자열).

## 환경 변수 설정

서버를 실행하기 전에 다음 환경 변수를 **설정해야** 합니다:

```
BITHUMB_API_KEY=YOUR_BITHUMB_API_KEY
BITHUMB_SECRET_KEY=YOUR_BITHUMB_SECRET_KEY
```

## 라이센스

MIT 라이센스
