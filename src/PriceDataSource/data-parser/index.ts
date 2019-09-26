import parse from "csv-parse/lib/sync";
import { MarketHistory } from "..";

export default function parseData(data: string): MarketHistory {
  const records = parse(data, { columns: true, skip_empty_lines: true });

  const out: MarketHistory = {};
  (records as Record<string, string>[]).forEach(r => {
    const date = r["Date"];
    const [year, month] = date.split("-");

    if (out[Number(year)] === undefined) {
      out[Number(year)] = {};
    }

    out[Number(year)][Number(month)] = {
      SP500: Number(r["SP500"]),
      CPI: Number(r["Consumer Price Index"]),
      USD: 1
    };
  });

  return out;
}
