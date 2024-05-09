import { BaseClientOption } from "@/server/client";
import { ITransactionChecker } from "@/producer";

export interface ProducerOptions extends BaseClientOption {
  topic?: string | string[];
  maxAttempts?: number;
  checker?: ITransactionChecker;
}
