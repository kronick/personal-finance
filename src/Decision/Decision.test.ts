import {
  buyCarDecision,
  constantCostDecision,
  runSimulation,
  formatSimulationResult,
  startJobDecision,
  stopJobDecision
} from "./";

describe("Simulator", () => {
  describe("Constant cost decision", () => {
    const decision = constantCostDecision({
      name: "Constant Cost",
      annualCost: 2,
      yearCreated: 2003,
      yearsActive: 4
    });
    const result = runSimulation([decision], 2000, 2099);

    describe("Transactions", () => {
      it("should run for 100 years", () => {
        expect(result.years.length).toBe(100);
      });

      it("should have no transactions in inactive years", () => {
        expect(result.years[0].transactions.length).toBe(0);
        expect(result.years[7].transactions.length).toBe(0);
      });

      it("should have 1 transaction in active years", () => {
        expect(result.years[3].transactions.length).toBe(1);
        expect(result.years[6].transactions.length).toBe(1);
      });

      it("should be a spend transaction of amount 2", () => {
        const transaction = result.years[3].transactions[0];
        expect(transaction.type).toBe("spend");
        expect(transaction.amount).toBe(2);
      });
    });
  });

  describe("Buy car decision", () => {
    const decision = buyCarDecision({
      initialCost: 1000,
      expectedLife: 10,
      yearDecided: 2001
    });
    const result = runSimulation([decision], 2000, 2099);

    describe("Assets and Liabilities", () => {
      it("should have no assets or liabilities at the start", () => {
        expect(result.years[0].assetsAndLiabilities.length).toBe(0);
      });
      it("should still have a car in year 10", () => {
        expect(result.years[10].assetsAndLiabilities.length).toBe(2);
      });
      it("should have no assets or liabilities after the expected life", () => {
        expect(result.years[11].assetsAndLiabilities.length).toBe(0);
      });

      it("should gain a Car asset and Car Maintenance liability in purchase year", () => {
        const assetsAndLiabilities = result.years[1].assetsAndLiabilities;
        const carAsset = assetsAndLiabilities.find(
          item => item.type === "Asset"
        );
        const maintenanceLiability = assetsAndLiabilities.find(
          item => item.type === "Liability"
        );
        expect(carAsset).toBeTruthy();
        expect(maintenanceLiability).toBeTruthy();

        expect(carAsset!.name).toBe("Car");
        expect(maintenanceLiability!.name).toBe("Car Maintenance");
      });

      it("Car asset should depreciate in value over time", () => {
        const assetsAndLiabilitiesYear1 = result.years[1].assetsAndLiabilities;
        const carAssetYear1 = assetsAndLiabilitiesYear1.find(
          item => item.type === "Asset"
        );

        const assetsAndLiabilitiesYear2 = result.years[2].assetsAndLiabilities;
        const carAssetYear2 = assetsAndLiabilitiesYear2.find(
          item => item.type === "Asset"
        );

        const assetsAndLiabilitiesYear10 =
          result.years[10].assetsAndLiabilities;
        const carAssetYear10 = assetsAndLiabilitiesYear10.find(
          item => item.type === "Asset"
        );

        expect(carAssetYear1!.value).toBe(1000);
        expect(carAssetYear2!.value).toBe(900);
        expect(carAssetYear10!.value).toBe(100);
      });
    });

    describe("Transactions", () => {
      it("should be a spend transaction for amount of car and maintenance in first year", () => {
        const transactions = result.years[1].transactions;
        const buyTransaction = transactions.find(t => t.amount === 1000);
        const maintenanceTransaction = transactions.find(t => t.amount === 30);
        expect(buyTransaction).toBeTruthy();
        expect(maintenanceTransaction).toBeTruthy();
      });
      it("should be a spend transaction for maintenance in second year", () => {
        const transactions = result.years[2].transactions;
        const buyTransaction = transactions.find(t => t.amount === 1000);
        const maintenanceTransaction = transactions.find(t => t.amount === 30);
        expect(buyTransaction).toBeFalsy();
        expect(maintenanceTransaction).toBeTruthy();
      });
      it("should be no transactions after car has depreciated", () => {
        const transactions = result.years[11].transactions;
        expect(transactions.length).toBe(0);
      });
    });
  });

  describe("Job decisions", () => {
    const startJob = startJobDecision({
      startingIncome: 100000,
      annualRaisePercent: 0.02,
      yearDecided: 2001
    });

    const stopJob = stopJobDecision({
      yearDecided: 2010
    });

    const result = runSimulation([startJob, stopJob], 2000, 2099);
    //console.log(formatSimulationResult(result));

    it("Should create a new asset", () => {
      expect(
        result.years[1].assetsAndLiabilities.filter(
          item => item.type === "Asset"
        ).length
      ).toBe(1);
    });
    it("Job should persist until stopped", () => {
      expect(
        result.years[10].assetsAndLiabilities.filter(
          item => item.type === "Asset"
        ).length
      ).toBe(1);

      expect(
        result.years[11].assetsAndLiabilities.filter(
          item => item.type === "Asset"
        ).length
      ).toBe(0);
    });
    it("should earn a salary", () => {
      expect(
        result.years[1].transactions.find(
          t => t.type === "earn" && t.amount >= 100000
        )
      ).toBeTruthy();
    });

    //console.log(formatSimulationResult(result));
  });
});
