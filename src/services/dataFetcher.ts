export interface DataFetcher {
  fetchData(input: string): Promise<string>;
  fetchDataWithProxy(url: string): Promise<string>;
}
