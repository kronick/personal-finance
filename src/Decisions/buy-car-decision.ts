import { Decision } from "../shared-types";
import { getID, mapNumber } from "../utilities";

export default function buyCarDecision({
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
