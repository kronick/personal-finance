import PriceDataSource from "./";

describe("PriceDataSource", () => {
  let source: PriceDataSource;
  beforeEach(() => {
    source = new PriceDataSource();
  });

  describe("getStockPrice", () => {
    it("Throws an error if ticker is invalid", () => {
      expect(() => source.getStockPrice("INVALID", 1900)).toThrow();
    });
    it("Gets average stock price for a year", () => {
      expect(source.getStockPrice("SP500", 1900)).toBeCloseTo(6.1475, 4);
    });
  });

  describe("adjustPrice", () => {
    it("Adjusts price given start and end year", () => {
      expect(
        source.adjustPrice({
          ticker: "SP500",
          startingPrice: 100,
          startingYear: 1900,
          endingYear: 1901
        })
      ).toBeCloseTo(127.5721838);
    });
  });
});
