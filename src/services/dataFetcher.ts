export interface DataFetcher {
  fetchData(input: string): Promise<string>;
  fetchDataWithProxy(
    url: string,
    proxy: string,
    cacheBust: boolean
  ): Promise<string>;
}
