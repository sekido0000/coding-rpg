"use client";

import { useActionState } from "react";

import {
  purchaseItemAction,
  type PurchaseState,
} from "@/app/actions/shop-actions";
import type { ItemId } from "@/lib/items/catalog";

type PurchaseButtonProps = {
  itemId: ItemId;
  price: number;
  canAfford: boolean;
};

const INITIAL_STATE: PurchaseState = {
  status: "idle",
  message: "",
};

/*
 * 装飾を1個買うボタン．
 * 買っている間は押せないようにして，続けて押しても1回だけ買うようにする．
 */
export function PurchaseButton({
  itemId,
  price,
  canAfford,
}: PurchaseButtonProps) {
  const [state, formAction, isPending] = useActionState(
    purchaseItemAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="space-y-1.5">
      <input type="hidden" name="itemId" value={itemId} />

      <button
        type="submit"
        disabled={!canAfford || isPending}
        className="w-full rounded-xl bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {isPending
          ? "買っています..."
          : canAfford
            ? `💰 ${price} G で買う`
            : `ゴールドが足りません（${price} G）`}
      </button>

      <p
        role="status"
        className={`min-h-4 text-center text-xs ${
          state.status === "error"
            ? "text-red-300"
            : "text-emerald-300"
        }`}
      >
        {state.message}
      </p>
    </form>
  );
}
