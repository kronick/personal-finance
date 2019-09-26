import { Decision } from "../shared-types";
import { getID } from "../utilities";

export default function constantCostDecision({
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
