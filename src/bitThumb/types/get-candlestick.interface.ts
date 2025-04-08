import { IBithumbResponse } from './bithumb-response.interface.js';

export interface IGetCandlestick extends IBithumbResponse {
  /** [timestamp, opening amount, closing amount, max price, min price, volume] */
  data: [number, string, string, string, string, string][];
}
