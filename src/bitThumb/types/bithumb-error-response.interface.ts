import { IBithumbResponse } from './bithumb-response.interface.js';

export interface IBithumbErrorResponse extends IBithumbResponse {
  status: string;
  message: string;
}
