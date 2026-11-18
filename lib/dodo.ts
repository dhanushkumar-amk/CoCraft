import DodoPayments from "dodopayments";

const apiKey = process.env.DODO_PAYMENTS_API_KEY;
const isLive = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode";

export const dodo = new DodoPayments({
  bearerToken: apiKey || "dummy_token_for_build",
  environment: isLive ? "live_mode" : "test_mode",
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
});

export function isDodoConfigured() {
  return !!process.env.DODO_PAYMENTS_API_KEY && process.env.DODO_PAYMENTS_API_KEY !== "test_your_api_key_here";
}
