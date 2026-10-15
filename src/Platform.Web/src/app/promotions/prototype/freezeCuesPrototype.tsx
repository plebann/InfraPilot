/* eslint-disable react-refresh/only-export-components -- PROTOTYPE: constants and components share one throwaway file */
// PROTOTYPE — throwaway. Freeze cues on the Promotions list.
// Question: "How should frozen promotions be shown on the Promotions page?"
// Three variants on the existing /promotions route, switchable via ?variant=A|B|C:
//   A — inline "Frozen · reason" badge on the card, info-coloured left border
//   B — frozen cards pulled out of the pending list into their own group, reasons in the group header
//   C — page-level banner listing active freezes affecting the list + a ribbon across each frozen card
// Candidates and freezes are stubs when the API is unreachable. Nothing is persisted.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Snowflake, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { PromotionCandidate } from '@/lib/api';

export type FreezeVariant = 'A' | 'B' | 'C' | 'D';

export const FREEZE_VARIANTS = [
  { key: 'A', name: 'Inline badge' },
  { key: 'B', name: 'Frozen group' },
  { key: 'C', name: 'Banner + ribbon' },
  { key: 'D', name: 'Banner + group' },
];

/** D = C's page banner on top + B's frozen group (identical to B) below. */
export const groupsFrozen = (v: FreezeVariant) => v === 'B' || v === 'D';
export const showsRibbon = (v: FreezeVariant) => v === 'C';
export const showsBanner = (v: FreezeVariant) => v === 'C' || v === 'D';

export interface ActiveFreezeStub {
  product: string;
  targetEnv: string;
  reason: string;
  frozenBy: string;
  frozenAt: string;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const PROTO_FREEZES: ActiveFreezeStub[] = [
  {
    product: 'checkout',
    targetEnv: 'production',
    reason: 'Black Friday freeze — no releases until Monday',
    frozenBy: 'Dana Lee',
    frozenAt: hoursAgo(26),
  },
  {
    product: 'identity',
    targetEnv: 'staging',
    reason: 'Load test window on staging',
    frozenBy: 'Admin User',
    frozenAt: hoursAgo(3),
  },
];

interface StubSpec {
  id: string;
  product: string;
  service: string;
  sourceEnv: string;
  targetEnv: string;
  version: string;
  targetCurrentVersion: string | null;
  canApprove: boolean;
  ageHours: number;
  tickets: { key: string; title: string }[];
}

function cand(s: StubSpec): PromotionCandidate {
  return {
    id: s.id,
    product: s.product,
    service: s.service,
    sourceEnv: s.sourceEnv,
    targetEnv: s.targetEnv,
    version: s.version,
    targetCurrentVersion: s.targetCurrentVersion,
    status: 'Pending',
    externalRunUrl: null,
    createdAt: hoursAgo(s.ageHours),
    approvedAt: null,
    deployedAt: null,
    supersededById: null,
    participants: [{ role: 'release-manager', displayName: 'Dana Lee', email: 'dana@example.com' }],
    sourceEventParticipants: [],
    sourceEventReferences: s.tickets.map((t) => ({
      type: 'work-item',
      provider: 'jira',
      key: t.key,
      title: t.title,
      url: `https://jira.example.com/browse/${t.key}`,
      participants: [{ role: 'qa', displayName: 'Sam Qureshi', email: 'sam@example.com' }],
    })),
    canApprove: s.canApprove,
  };
}

export const PROTO_CANDIDATES: PromotionCandidate[] = [
  cand({
    id: 'proto-1', product: 'checkout', service: 'checkout-api', sourceEnv: 'staging', targetEnv: 'production',
    version: '1.3.0', targetCurrentVersion: '1.2.4', canApprove: true, ageHours: 5,
    tickets: [{ key: 'CHK-451', title: 'Add express checkout' }, { key: 'CHK-460', title: 'Fix cart totals rounding' }],
  }),
  cand({
    id: 'proto-2', product: 'payments', service: 'payments-api', sourceEnv: 'staging', targetEnv: 'production',
    version: '2.1.0', targetCurrentVersion: '2.0.9', canApprove: true, ageHours: 2,
    tickets: [{ key: 'PAY-120', title: 'Retry failed webhooks' }],
  }),
  cand({
    id: 'proto-3', product: 'checkout', service: 'checkout-web', sourceEnv: 'staging', targetEnv: 'production',
    version: '4.8.1', targetCurrentVersion: '4.8.0', canApprove: false, ageHours: 20,
    tickets: [{ key: 'CHK-455', title: 'New promo banner' }],
  }),
  cand({
    id: 'proto-4', product: 'identity', service: 'auth-api', sourceEnv: 'development', targetEnv: 'staging',
    version: '0.9.3', targetCurrentVersion: '0.9.2', canApprove: false, ageHours: 1, tickets: [],
  }),
  cand({
    id: 'proto-5', product: 'catalog-api', service: 'catalog', sourceEnv: 'staging', targetEnv: 'production',
    version: '3.0.0', targetCurrentVersion: '2.14.1', canApprove: true, ageHours: 30,
    tickets: [{ key: 'CAT-9', title: 'Bulk import of catalog items' }],
  }),
];

export function applyStubFilters(
  list: PromotionCandidate[],
  f: { product?: string; service?: string; targetEnv?: string },
): PromotionCandidate[] {
  return list.filter(
    (c) =>
      (!f.product || c.product === f.product) &&
      (!f.targetEnv || c.targetEnv === f.targetEnv) &&
      (!f.service || c.service.toLowerCase().includes(f.service.toLowerCase())),
  );
}

export function findFreeze(freezes: ActiveFreezeStub[], c: PromotionCandidate): ActiveFreezeStub | undefined {
  return freezes.find((f) => f.product === c.product && f.targetEnv === c.targetEnv);
}

const since = (iso: string) => formatDistanceToNow(new Date(iso), { addSuffix: true });

// ── Variant A: inline badge ──────────────────────────────────────────────────

export function FrozenBadge({ freeze }: { freeze: ActiveFreezeStub }) {
  return (
    <span
      className="badge"
      style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)', maxWidth: 320 }}
      title={`Frozen by ${freeze.frozenBy} ${since(freeze.frozenAt)} — ${freeze.reason}`}
    >
      <Snowflake size={10} style={{ flexShrink: 0 }} />
      <span className="truncate">Frozen · {freeze.reason}</span>
    </span>
  );
}

// ── Variant B: frozen group ──────────────────────────────────────────────────

export function FrozenGroup({
  freezes,
  candidates,
  children,
  showReasons = true,
}: {
  freezes: ActiveFreezeStub[];
  candidates: PromotionCandidate[];
  children: ReactNode;
  /** false ⇒ the cards carry the reason themselves (ribbon), so the header stays minimal. */
  showReasons?: boolean;
}) {
  if (candidates.length === 0) return null;
  const pairs = freezes.filter((f) => candidates.some((c) => c.product === f.product && c.targetEnv === f.targetEnv));
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--info)' }}
        >
          <Snowflake size={11} />
          Frozen ({candidates.length})
        </h2>
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Approvals are still recorded; nothing is promoted until the freeze is lifted
        </span>
      </div>
      <div
        className="rounded-xl border p-3 space-y-2"
        style={{ borderColor: 'var(--info)', backgroundColor: 'var(--info-bg)' }}
      >
        {showReasons && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          {pairs.map((f) => (
            <span key={`${f.product}|${f.targetEnv}`} className="flex items-center gap-1.5">
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {f.product} → {f.targetEnv}
              </span>
              <span>— {f.reason}</span>
              <span style={{ color: 'var(--text-muted)' }}>
                · {f.frozenBy}, {since(f.frozenAt)}
              </span>
            </span>
          ))}
        </div>
        )}
        <div className="space-y-2" style={{ opacity: 0.85 }}>{children}</div>
      </div>
    </div>
  );
}

// ── Variant C: banner + ribbon ───────────────────────────────────────────────

export function FreezeBanner({
  freezes,
  candidates,
  productFilter,
  targetEnvFilter,
}: {
  freezes: ActiveFreezeStub[];
  candidates: PromotionCandidate[];
  productFilter: string;
  targetEnvFilter: string;
}) {
  const visible = freezes.filter(
    (f) => (!productFilter || f.product === productFilter) && (!targetEnvFilter || f.targetEnv === targetEnvFilter),
  );
  if (visible.length === 0) return null;
  return (
    <div
      className="rounded-xl border p-3 flex items-start gap-3"
      style={{ borderColor: 'var(--info)', backgroundColor: 'var(--info-bg)', borderLeft: '3px solid var(--info)' }}
    >
      <Snowflake size={16} style={{ color: 'var(--info)', marginTop: 2, flexShrink: 0 }} />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {visible.length === 1 ? '1 active freeze' : `${visible.length} active freezes`} affecting this list
          </p>
          <Link
            to="/settings/freeze-prototype"
            className="inline-flex items-center gap-1 text-[12px] font-medium hover:opacity-80"
            style={{ color: 'var(--info)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Settings size={12} />
            Manage freezes
          </Link>
        </div>
        <ul className="space-y-1 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          {visible.map((f) => {
            const held = candidates.filter((c) => c.product === f.product && c.targetEnv === f.targetEnv).length;
            return (
              <li key={`${f.product}|${f.targetEnv}`} className="flex flex-wrap items-center gap-x-2">
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {f.product} → {f.targetEnv}
                </span>
                <span>{f.reason}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  · frozen by {f.frozenBy} {since(f.frozenAt)} · {held} {held === 1 ? 'promotion' : 'promotions'} held
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function FrozenRibbon({ freeze }: { freeze: ActiveFreezeStub }) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-lg px-2 py-1 mb-2 text-[11px]"
      style={{ backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        <Snowflake size={11} style={{ flexShrink: 0 }} />
        <span className="font-medium whitespace-nowrap">Promotions to {freeze.targetEnv} are frozen</span>
        <span className="truncate" style={{ color: 'var(--text-secondary)' }}>
          — {freeze.reason}
        </span>
      </span>
      <span className="shrink-0" style={{ color: 'var(--text-muted)' }}>
        {freeze.frozenBy} · {since(freeze.frozenAt)}
      </span>
    </div>
  );
}
