import { IBithumbResponse } from './bithumb-response.interface.js';

export interface IPostMarketBuy extends IBithumbResponse {
  order_id: string;
}
