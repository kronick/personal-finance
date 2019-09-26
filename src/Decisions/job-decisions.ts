import { Decision, Asset, Liability } from "../shared-types";
import { getID } from "../utilities";

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

export { startJobDecision, stopJobDecision };
