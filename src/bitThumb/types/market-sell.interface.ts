import { IBithumbResponse } from './bithumb-response.interface.js';

export interface IPostMarketSell extends IBithumbResponse {
  order_id: string;
}
