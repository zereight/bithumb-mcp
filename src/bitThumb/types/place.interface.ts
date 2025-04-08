import { IBithumbResponse } from './bithumb-response.interface.js';

export interface IPostPlace extends IBithumbResponse {
  order_id: string;
}
