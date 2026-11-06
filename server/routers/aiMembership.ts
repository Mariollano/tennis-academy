import { router } from "../_core/trpc";
import { aiMembershipAccountRouter } from "./aiMembershipAccount";
import { aiMembershipBillingRouter } from "./aiMembershipBilling";
import { aiMembershipLibraryRouter } from "./aiMembershipLibrary";

export const aiMembershipRouter = router({
  account: aiMembershipAccountRouter,
  billing: aiMembershipBillingRouter,
  library: aiMembershipLibraryRouter,
});
