// PROTOTYPE — throwaway. Shared data shape for the Freeze tab variants.
// Question: "What should the Settings → Freeze tab look like?"
// Three variants on /settings/freeze-prototype, switchable via ?variant=A|B|C.

export interface FreezePair {
  /** Product key, e.g. "checkout" */
  product: string;
  /** Target environment key, e.g. "production" */
  targetEnv: string;
  /** Display name for the environment (from app settings) */
  envLabel: string;
  /** How many approval policies target this pair (informational) */
  policyCount: number;
}

export interface ActiveFreeze {
  product: string;
  targetEnv: string;
  reason: string;
  frozenBy: string;
  frozenAt: string; // ISO
  /** Pending promotion candidates currently held by this freeze (stub) */
  heldCandidates: number;
}

export interface FreezeHistoryEntry {
  id: string;
  product: string;
  targetEnv: string;
  action: 'frozen' | 'unfrozen';
  reason: string | null;
  actor: string;
  at: string; // ISO
}

export interface FreezeVariantProps {
  /** Every (product, targetEnv) pair that has at least one approval policy. */
  pairs: FreezePair[];
  /** Ordered environment keys + labels (from app settings), for column/row ordering. */
  environments: { key: string; label: string }[];
  /** Currently active freezes. */
  freezes: ActiveFreeze[];
  /** Recent freeze/unfreeze events, newest first. */
  history: FreezeHistoryEntry[];
  /** Stub mutations — in-memory only. */
  onFreeze: (product: string, targetEnv: string, reason: string) => void;
  onUnfreeze: (product: string, targetEnv: string) => void;
  /** Current user (for "frozen by" display). */
  currentUser: string;
}

export function isFrozen(
  freezes: ActiveFreeze[],
  product: string,
  targetEnv: string,
): ActiveFreeze | undefined {
  return freezes.find((f) => f.product === product && f.targetEnv === targetEnv);
}
