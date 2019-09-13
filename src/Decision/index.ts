import clone from "clone-deep";

interface Decision {
  id: string;
  name: string;
  /** A decision can result in any number of new assets or liabilities */
  newAssetsAndLiabilities?: Array<Asset | Liability>;

  /** A decision can also result in losing an asset */
  loseAssets?: AssetFilterFunction;
  yearDecided: number;
}

type AssetFilterFunction = (asset: Asset | Liability) => boolean;

interface Transaction {
  type: "spend" | "earn";
  amount: number;
  assetsGained?: string[];
  assetsLost?: string[];
  memo?: string;
}

interface AssetLiabilityBase {
  id: string;
  type: "Asset" | "Liability";
  name: string;
  value?: number | ((year: number, oldValue: number) => number);
  yearCreated: number;
  createdByDecision?: string;
  annualTransactions: (year: number) => Transaction[];
}

interface Asset extends AssetLiabilityBase {
  type: "Asset";
}

interface Liability extends AssetLiabilityBase {
  type: "Liability";
}

function buyCarDecision({
  initialCost,
  expectedLife,
  yearDecided
}: {
  initialCost: number;
  expectedLife: number;
  yearDecided: number;
}): Decision {
  const decisionID = getID();
  const carID = getID();
  const maintenanceID = getID();
  return {
    id: decisionID,
    name: "Buy a car",
    yearDecided,
    newAssetsAndLiabilities: [
      {
        id: carID,
        name: "Car",
        createdByDecision: decisionID,
        value: year =>
          // Value goes from initial value to 0 over the expected lifetime
          mapNumber(
            year,
            yearDecided,
            yearDecided + expectedLife,
            initialCost,
            0
          ),
        type: "Asset",
        yearCreated: yearDecided,
        annualTransactions: year =>
          year === yearDecided
            ? [
                {
                  type: "spend",
                  amount: initialCost,
                  assetsGained: [carID]
                }
              ]
            : []
      },
      {
        id: maintenanceID,
        name: "Car Maintenance",
        value: 0,
        type: "Liability",
        yearCreated: yearDecided,
        annualTransactions: year => [
          {
            type: "spend",
            amount: initialCost * 0.03,
            assetsLost:
              year === yearDecided + expectedLife - 1
                ? [carID, maintenanceID]
                : []
          }
        ]
      }
    ]
  };
}

function constantCostDecision({
  name,
  annualCost,
  yearCreated,
  yearsActive
}: {
  name: string;
  annualCost: number;
  yearCreated: number;
  yearsActive: number;
}): Decision {
  const decisionID = getID();
  return {
    id: decisionID,
    name,
    yearDecided: yearCreated,
    newAssetsAndLiabilities: [
      {
        id: getID(),
        type: "Liability",
        name,
        createdByDecision: decisionID,
        yearCreated,
        annualTransactions: year =>
          year < yearCreated + yearsActive
            ? [
                {
                  type: "spend",
                  amount: annualCost
                }
              ]
            : []
      }
    ]
  };
}

function startJobDecision({
  name = "Job",
  startingIncome,
  annualRaisePercent = 0,
  yearDecided
}: {
  name?: string;
  startingIncome: number;
  annualRaisePercent?: number;
  yearDecided: number;
}): Decision {
  const decisionID = getID();
  return {
    id: decisionID,
    name,
    yearDecided,
    newAssetsAndLiabilities: [
      {
        id: getID(),
        type: "Asset",
        name,
        createdByDecision: decisionID,
        yearCreated: yearDecided,
        annualTransactions: year => [
          {
            type: "earn",
            amount:
              startingIncome *
              Math.pow(1 + annualRaisePercent, year - yearDecided)
          }
        ]
      }
    ]
  };
}

function stopJobDecision({
  name = "Job",
  yearDecided
}: {
  name?: string;
  yearDecided: number;
}): Decision {
  const decisionID = getID();
  return {
    id: decisionID,
    name,
    yearDecided,
    loseAssets: (asset: Asset | Liability) => asset.name === name
  };
}

interface SimulationResult {
  years: Readonly<YearlySummary[]>;
}

interface YearlySummary {
  year: number;
  assetsAndLiabilities: Readonly<Array<Asset | Liability>>;
  transactions: Readonly<Transaction[]>;
}

function runSimulation(
  decisions: Decision[],
  startingYear: number,
  endingYear: number
): SimulationResult {
  const result: SimulationResult = {
    years: []
  };
  let assetsAndLiabilities: Readonly<Array<Asset | Liability>> = [];
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
        transactions: thisYearsTransactions
      }
    ];

    //Decisions can also directly result in lost assets
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
          asset.value !== undefined ? `\$${asset.value}` : ""
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

// Helpers --------------------------------------------------------------------
let id = 0;
function getID() {
  return String(id++);
}

function mapNumber(
  value: number,
  lowA: number,
  highA: number,
  lowB: number,
  highB: number
) {
  return ((value - lowA) / (highA - lowA)) * (highB - lowB) + lowB;
}

export {
  buyCarDecision,
  constantCostDecision,
  runSimulation,
  formatSimulationResult,
  startJobDecision,
  stopJobDecision
};

/*
Decisions result in new assets and new liabilities
Assets and liabilities result in new transactions each year


TODO:
[ ] Income
[ ] Stocks/shares (assets that accumulate?)
[ ] Cost-of-living lookups for transactions/values (???)
[ ] Value lookup for stocks
[ ] Conditional decisions? (buy if...)
*/
