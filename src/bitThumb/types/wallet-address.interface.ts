import { IBithumbResponse } from './bithumb-response.interface.js';

interface IWallerAddress {
  wallet_address: string;
  currency: string;
}

export interface IPostWalletAddress extends IBithumbResponse {
  data: IWallerAddress;
}
