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

export { Decision, Transaction, AssetLiabilityBase, Asset, Liability };
