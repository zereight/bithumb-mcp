export interface IPostOrdersParams {
  orderId?: string;
  type?: 'bid' | 'ask';
  count?: number;
  after?: number;
  order_currency: string;
}
