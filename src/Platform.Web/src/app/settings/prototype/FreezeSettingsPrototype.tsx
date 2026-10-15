// PROTOTYPE — throwaway. Host for the Freeze tab variants.
// "Three variants of a Settings → Freeze tab, switchable via ?variant=, on /settings/freeze-prototype."
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, type PromotionPolicy } from '@/lib/api';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { PrototypeSwitcher } from '@/components/prototype/PrototypeSwitcher';
import type { ActiveFreeze, FreezeHistoryEntry, FreezePair } from './freezePrototypeTypes';
import { FreezeVariantA } from './FreezeVariantA';
import { FreezeVariantB } from './FreezeVariantB';
import { FreezeVariantC } from './FreezeVariantC';

const VARIANTS = [
  { key: 'A', name: FreezeVariantA.displayName ?? 'A' },
  { key: 'B', name: FreezeVariantB.displayName ?? 'B' },
  { key: 'C', name: FreezeVariantC.displayName ?? 'C' },
];

type PolicyLite = Pick<PromotionPolicy, 'product' | 'targetEnv'>;

// Fallback when the API is down or has no policies, so the prototype still renders.
const STUB_POLICIES: PolicyLite[] = [
  { product: 'checkout', targetEnv: 'staging' },
  { product: 'checkout', targetEnv: 'production' },
  { product: 'checkout', targetEnv: 'production' },
  { product: 'payments', targetEnv: 'staging' },
  { product: 'payments', targetEnv: 'production' },
  { product: 'identity', targetEnv: 'production' },
  { product: 'catalog-api', targetEnv: 'staging' },
];

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export function FreezeSettingsPrototype() {
  const [params] = useSearchParams();
  const variant = params.get('variant') ?? 'A';
  const envs = useSettingsStore((s) => s.environments);
  const currentUser = useAuthStore((s) => s.user?.name) ?? 'Dev User';

  const [policies, setPolicies] = useState<PolicyLite[] | null>(null);
  useEffect(() => {
    api
      .listPromotionPolicies()
      .then((d) => setPolicies(d.policies.length > 0 ? d.policies : STUB_POLICIES))
      .catch(() => setPolicies(STUB_POLICIES));
  }, []);

  const environments = useMemo(
    () => envs.map((e) => ({ key: e.key, label: e.displayName })),
    [envs],
  );

  const pairs: FreezePair[] = useMemo(() => {
    if (!policies) return [];
    const map = new Map<string, FreezePair>();
    for (const p of policies) {
      const k = `${p.product}|${p.targetEnv}`;
      const existing = map.get(k);
      if (existing) existing.policyCount += 1;
      else
        map.set(k, {
          product: p.product,
          targetEnv: p.targetEnv,
          envLabel: environments.find((e) => e.key === p.targetEnv)?.label ?? p.targetEnv,
          policyCount: 1,
        });
    }
    const envOrder = environments.map((e) => e.key);
    return [...map.values()].sort(
      (a, b) =>
        a.product.localeCompare(b.product) ||
        envOrder.indexOf(a.targetEnv) - envOrder.indexOf(b.targetEnv),
    );
  }, [policies, environments]);

  // In-memory stub state, seeded with one active freeze so every variant has something to show.
  const [freezes, setFreezes] = useState<ActiveFreeze[]>([
    {
      product: 'checkout',
      targetEnv: 'production',
      reason: 'Black Friday freeze — no releases until Monday',
      frozenBy: 'Dana Lee',
      frozenAt: hoursAgo(26),
      heldCandidates: 2,
    },
  ]);
  const [history, setHistory] = useState<FreezeHistoryEntry[]>([
    {
      id: 'h1',
      product: 'checkout',
      targetEnv: 'production',
      action: 'frozen',
      reason: 'Black Friday freeze — no releases until Monday',
      actor: 'Dana Lee',
      at: hoursAgo(26),
    },
    {
      id: 'h2',
      product: 'payments',
      targetEnv: 'production',
      action: 'unfrozen',
      reason: null,
      actor: 'Admin User',
      at: hoursAgo(70),
    },
    {
      id: 'h3',
      product: 'payments',
      targetEnv: 'production',
      action: 'frozen',
      reason: 'PCI audit window',
      actor: 'Admin User',
      at: hoursAgo(118),
    },
  ]);

  const onFreeze = (product: string, targetEnv: string, reason: string) => {
    const at = new Date().toISOString();
    setFreezes((prev) => [
      ...prev,
      { product, targetEnv, reason, frozenBy: currentUser, frozenAt: at, heldCandidates: 0 },
    ]);
    setHistory((prev) => [
      { id: `h${Date.now()}`, product, targetEnv, action: 'frozen', reason, actor: currentUser, at },
      ...prev,
    ]);
  };
  const onUnfreeze = (product: string, targetEnv: string) => {
    const at = new Date().toISOString();
    setFreezes((prev) => prev.filter((f) => !(f.product === product && f.targetEnv === targetEnv)));
    setHistory((prev) => [
      {
        id: `h${Date.now()}`,
        product,
        targetEnv,
        action: 'unfrozen',
        reason: null,
        actor: currentUser,
        at,
      },
      ...prev,
    ]);
  };

  const props = { pairs, environments, freezes, history, onFreeze, onUnfreeze, currentUser };

  if (!policies) {
    return (
      <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
        Loading…
      </p>
    );
  }

  return (
    <>
      {variant === 'A' && <FreezeVariantA {...props} />}
      {variant === 'B' && <FreezeVariantB {...props} />}
      {variant === 'C' && <FreezeVariantC {...props} />}
      <PrototypeSwitcher variants={VARIANTS} current={variant} />
    </>
  );
}
