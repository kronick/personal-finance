import { getID } from "../utilities";
import { Decision, Transaction, Asset, Liability } from "../shared-types";

import buyCarDecision from "./buy-car-decision";
import constantCostDecision from "./constant-cost-decision";
import { startJobDecision, stopJobDecision } from "./job-decisions";

export {
  buyCarDecision,
  constantCostDecision,
  startJobDecision,
  stopJobDecision
};

/*
Decisions result in new assets and new liabilities
Assets and liabilities result in new transactions each year
*/
