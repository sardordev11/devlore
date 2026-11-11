"use client";

import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { useTransition } from "react";
import { toast } from "sonner";

import { getCustomerKey } from "@/actions/billing";
import { isCardWindowClosed } from "@/lib/billing-display";

interface CardWindowOptions {
  // Toss redirects here after the card is registered (/api/billing/confirm?…)
  successPath: string;
  // ...and here when it fails or is closed, with ?code=
  failPath: string;
  email: string | null;
}

function getErrorCode(error: unknown) {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" ? code : "";
}

async function openCardWindow(customerKey: string, options: CardWindowOptions) {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) throw new Error("NEXT_PUBLIC_TOSS_CLIENT_KEY is not set");

  const toss = await loadTossPayments(clientKey);
  const origin = window.location.origin;
  await toss.payment({ customerKey }).requestBillingAuth({
    method: "CARD",
    successUrl: `${origin}${options.successPath}`,
    failUrl: `${origin}${options.failPath}`,
    customerEmail: options.email,
  });
}

// Opens the Toss card registration window. Errors show as toasts.
export function useCardWindow() {
  const [isPending, startTransition] = useTransition();

  function open(options: CardWindowOptions) {
    startTransition(async () => {
      const result = await getCustomerKey();
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      try {
        await openCardWindow(result.data, options);
      } catch (error) {
        // In the iframe window, closing it rejects instead of redirecting
        if (isCardWindowClosed(getErrorCode(error))) {
          toast("Card registration cancelled");
          return;
        }
        console.error("Toss card window failed:", error);
        toast.error("Couldn't open the card window. Please try again.");
      }
    });
  }

  return { open, isPending };
}
