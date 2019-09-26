import { readFileSync } from "fs";

import parseData from "./";

const path = "./src/PriceDataSource/market-data.csv";
const data = readFileSync(path, { encoding: "utf8" });

describe("data parser", () => {
  it("parses data without error", () => {
    expect(parseData(data)).toBeTruthy();
  });

  it("produces market history with correct tickers", () => {
    const parsed = parseData(data);
    expect(parsed[1900][1]["SP500"]).toBeTruthy();
    expect(parsed[1900][1]["CPI"]).toBeTruthy();
    expect(parsed[1926][10]["SP500"]).toBeTruthy();
    expect(parsed[1999][12]["CPI"]).toBeTruthy();
  });

  it("produces market history with correct values", () => {
    const parsed = parseData(data);
    expect(parsed[1900][1]["SP500"]).toEqual(6.1);
    expect(parsed[1900][1]["CPI"]).toEqual(7.9);
    expect(parsed[1900][2]["SP500"]).toEqual(6.21);
    expect(parsed[1900][2]["CPI"]).toEqual(7.99);
  });
});
