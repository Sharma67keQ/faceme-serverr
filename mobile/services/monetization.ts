import { WalletSummaryResponse } from "@/types/api";
import { api } from "./api";

export const monetizationService = {
  async getWallet() {
    const { data } = await api.get<WalletSummaryResponse>("/monetization/wallet");
    return data;
  },
  async createTopUpIntent(payload: {
    provider?: "MANUAL_REVIEW" | "CARD" | "MOBILE_MONEY" | "APP_STORE";
    coinsAmount: number;
    currency?: string;
    fiatAmount?: number;
  }) {
    const { data } = await api.post("/monetization/payment-intents/top-up", payload);
    return data;
  },
};
