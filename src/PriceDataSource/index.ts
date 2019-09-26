import { readFileSync } from "fs";

import parseData from "./data-parser";

export type MarketHistory = Record<
  number,
  Record<number, Record<string, number>>
>;

const defaultData = readFileSync("./src/PriceDataSource/market-data.csv", {
  encoding: "utf8"
});
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default class PriceDataSource {
  data: MarketHistory;

  constructor(src: string = defaultData) {
    this.data = parseData(src);
  }

  getStockPrice(ticker: string, year: number) {
    if (this.data[year][1][ticker] === undefined) {
      throw Error(`Ticker ${ticker} does not exist for year ${year}`);
    }
    const monthData = this.data[year];
    return (
      MONTHS.reduce((accum, month) => monthData[month][ticker] + accum, 0) / 12
    );
  }

  adjustPrice({
    ticker,
    startingPrice,
    startingYear,
    endingYear
  }: {
    ticker: string;
    startingPrice: number;
    startingYear: number;
    endingYear: number;
  }) {
    return (
      (this.getStockPrice(ticker, endingYear) /
        this.getStockPrice(ticker, startingYear)) *
      startingPrice
    );
  }
}
