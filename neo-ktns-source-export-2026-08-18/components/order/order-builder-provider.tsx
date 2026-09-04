"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  ORDER_BUILDER_STORAGE_KEY,
  parseStoredOrderItems,
  type OrderBuilderDraft,
  type OrderBuilderItem,
} from "@/lib/order-builder";

type OrderBuilderContextValue = {
  hydrated: boolean;
  lines: OrderBuilderItem[];
  addLine: (draft: OrderBuilderDraft) => void;
  updateLine: (id: string, draft: OrderBuilderDraft) => void;
  removeLine: (id: string) => void;
};

const OrderBuilderContext = createContext<OrderBuilderContextValue | null>(null);
const serverSnapshot: OrderBuilderItem[] = [];
const listeners = new Set<() => void>();
let clientSnapshot: OrderBuilderItem[] | null = null;

function getClientSnapshot() {
  if (clientSnapshot == null) {
    clientSnapshot = parseStoredOrderItems(window.localStorage.getItem(ORDER_BUILDER_STORAGE_KEY));
  }
  return clientSnapshot;
}

function getServerSnapshot() {
  return serverSnapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key !== ORDER_BUILDER_STORAGE_KEY) return;
    clientSnapshot = parseStoredOrderItems(event.newValue);
    listeners.forEach((currentListener) => currentListener());
  }

  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function updateStoredLines(
  update: (current: OrderBuilderItem[]) => OrderBuilderItem[],
) {
  const next = update(getClientSnapshot());
  clientSnapshot = next;
  window.localStorage.setItem(ORDER_BUILDER_STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

function createLineId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `line-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function OrderBuilderProvider({ children }: React.PropsWithChildren) {
  const lines = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const hydrated = typeof window !== "undefined" && clientSnapshot != null;

  const addLine = useCallback((draft: OrderBuilderDraft) => {
    updateStoredLines((current) => [...current, { ...draft, id: createLineId() }]);
  }, []);

  const updateLine = useCallback((id: string, draft: OrderBuilderDraft) => {
    updateStoredLines((current) => current.map((line) => (line.id === id ? { ...draft, id } : line)));
  }, []);

  const removeLine = useCallback((id: string) => {
    updateStoredLines((current) => current.filter((line) => line.id !== id));
  }, []);

  const value = useMemo(
    () => ({ hydrated, lines, addLine, updateLine, removeLine }),
    [addLine, hydrated, lines, removeLine, updateLine],
  );

  return <OrderBuilderContext.Provider value={value}>{children}</OrderBuilderContext.Provider>;
}

export function useOrderBuilder() {
  const context = useContext(OrderBuilderContext);
  if (!context) throw new Error("useOrderBuilder must be used inside OrderBuilderProvider");
  return context;
}
