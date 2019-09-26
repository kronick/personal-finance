import clone from "clone-deep";

import { Asset, Liability, Transaction, Decision } from "../shared-types";

import { getID } from "../utilities";

interface SimulationResult {
  years: Readonly<YearlySummary[]>;
}

interface YearlySummary {
  year: number;
  assetsAndLiabilities: Readonly<Array<Asset | Liability>>;
  transactions: Readonly<Transaction[]>;
  totals: {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  };
}

function runSimulation(
  decisions: Decision[],
  startingYear: number,
  endingYear: number
): SimulationResult {
  const result: SimulationResult = {
    years: []
  };
  const cashAsset: Asset = {
    id: getID(),
    type: "Asset",
    name: "Cash",
    yearCreated: startingYear,
    value: 0,
    annualTransactions: () => []
  };

  let assetsAndLiabilities: Array<Asset | Liability> = [cashAsset];
  for (let y = startingYear; y <= endingYear; y++) {
    const newDecisions = decisions.filter(d => d.yearDecided === y);
    newDecisions.forEach(d => {
      assetsAndLiabilities = [
        ...assetsAndLiabilities,
        ...(d.newAssetsAndLiabilities ? d.newAssetsAndLiabilities : [])
      ];
    });

    // Process transactions for each asset
    let thisYearsTransactions: Transaction[] = [];
    const assetsLost: string[] = [];

    assetsAndLiabilities.forEach(item => {
      const thisAssetTransactions = item.annualTransactions(y);
      // Tag transactions with their reason for easier debugging
      thisAssetTransactions.forEach(t => (t.memo = `Reason: ${item.name}`));

      thisYearsTransactions = [
        ...thisYearsTransactions,
        ...thisAssetTransactions
      ];

      // Can't remove assets while iterating over them, so store which ones
      // should be removed later
      thisAssetTransactions.forEach(t => {
        if (t.assetsLost) {
          t.assetsLost.forEach(lost => {
            assetsLost.push(lost);
          });
        }
      });
    });

    // Move money in and out of the cash asset account
    const thisYearsCash = assetsAndLiabilities.find(
      item => item.type === "Asset" && item.name === "Cash"
    ) as Asset;
    thisYearsTransactions.forEach(transaction => {
      if (typeof thisYearsCash.value === "number") {
        thisYearsCash.value +=
          (transaction.type === "earn" ? 1 : -1) * transaction.amount;
      } else {
        throw Error(
          `Cash value should be a number, found: ${typeof thisYearsCash.value}`
        );
      }
    });

    // Calculate asset and liability values
    let valuedItems = clone(assetsAndLiabilities).map(item => ({
      ...clone(item),
      value:
        typeof item.value === "function"
          ? (item.value as Function)(y)
          : item.value
    }));

    // Append this year's results to the simulation result
    result.years = [
      ...result.years,
      {
        year: y,
        assetsAndLiabilities: [...valuedItems],
        transactions: thisYearsTransactions,
        totals: {
          netWorth: 0,
          totalAssets: 0,
          totalLiabilities: 0
        }
      }
    ];

    // Decisions can also directly result in lost assets. Figure those out now.
    newDecisions
      .filter(d => d.loseAssets)
      .forEach(d => {
        assetsLost.push(
          ...valuedItems.filter(d.loseAssets!).map(item => item.id)
        );
      });

    // Don't carry over lost assets to next year
    assetsLost.forEach(lost => {
      assetsAndLiabilities = assetsAndLiabilities.filter(
        item => item.id !== lost
      );
    });
  }

  return result;
}

function formatSimulationResult(result: SimulationResult): string {
  let out: string = "";

  const separator =
    "--------------------------------------------------------------------------------";
  out += `Simulation Result\n${separator}\n\n`;
  result.years.forEach(year => {
    out += `Year: ${year.year}\n`;
    out += " > Assets:\n";
    year.assetsAndLiabilities
      .filter(item => item.type === "Asset")
      .forEach(asset => {
        out += `\t\t[${asset.id}] ${asset.name} ${
          asset.value !== undefined
            ? `\$${
                typeof asset.value === "number"
                  ? asset.value.toFixed(0)
                  : asset.value
              }`
            : ""
        }\n`;
      });

    out += " > Liabilities:\n";
    year.assetsAndLiabilities
      .filter(item => item.type === "Liability")
      .forEach(liability => {
        out += `\t\t[${liability.id}] ${liability.name}\n`;
      });

    out += " > Transactions:\n";
    year.transactions.forEach(t => {
      out += `\t\t${t.type}: \$${t.amount.toFixed(0)} ${
        t.memo ? `(${t.memo})` : ""
      }\n`;
    });

    out += "\n\n";
  });

  return out;
}

export { runSimulation, formatSimulationResult };
