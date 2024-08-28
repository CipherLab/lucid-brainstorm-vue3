import axios from 'axios';
import { DataFetcher } from './dataFetcher';

export class WebDataFetcher implements DataFetcher {
  private corsProxy: string;

  constructor(corsProxy = 'https://api.allorigins.win/get?url=') {
    this.corsProxy = corsProxy;
  }

  async fetchDataWithProxy(url: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.corsProxy}${encodeURIComponent(url)}`
      );
      return response.data.contents; // Extract from CORS proxy response
    } catch (error: any) {
      console.error('Error fetching webpage:', error);
      throw new Error(`Failed to fetch data from URL: ${error.message}`); // Re-throw to handle in calling code
    }
  }

  async fetchData(url: string): Promise<string> {
    try {
      const decodedUrl = decodeURIComponent(url);
      //console.log('decodedUrl', decodedUrl);

      const response = await axios.get(decodedUrl);
      //console.log('response', response);

      return response.data;
    } catch (error: any) {
      console.error('Error fetching webpage:', error);
      throw new Error(`Failed to fetch data from URL: ${error.message}`);
    }
  }
}
