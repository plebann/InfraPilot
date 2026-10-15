// PROTOTYPE — throwaway. Variant B: product × environment matrix with a detail drawer.
import { useState, type ReactNode } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Snowflake, Lock, Unlock, X, Clock } from 'lucide-react';
import { isFrozen, type FreezeVariantProps } from './freezePrototypeTypes';

type Selected = { product: string; targetEnv: string };

const labelCls = 'text-[11px] font-medium uppercase tracking-wider';
const muted = { color: 'var(--text-muted)' };
const secondary = { color: 'var(--text-secondary)' };

export function FreezeVariantB(props: FreezeVariantProps) {
  const { pairs, environments, freezes, history, onFreeze, onUnfreeze } = props;
  const [selected, setSelected] = useState<Selected | null>(null);
  const [reason, setReason] = useState('');

  const products = [...new Set(pairs.map((p) => p.product))].sort();
  const envs = environments.filter((e) => pairs.some((p) => p.targetEnv === e.key));
  const pairFor = (product: string, env: string) =>
    pairs.find((p) => p.product === product && p.targetEnv === env);

  const select = (product: string, targetEnv: string) => {
    setSelected({ product, targetEnv });
    setReason('');
  };

  const selectedFreeze = selected ? isFrozen(freezes, selected.product, selected.targetEnv) : undefined;
  const selectedPair = selected ? pairFor(selected.product, selected.targetEnv) : undefined;
  const pairHistory = selected
    ? history.filter((h) => h.product === selected.product && h.targetEnv === selected.targetEnv)
    : [];

  return (
    <div
      className="rounded-xl border p-5 space-y-4"
      style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
    >
      <div>
        <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Freeze
        </h2>
        <p className="text-[13px]" style={muted}>
          Block promotions into an environment per product. Approvals are still recorded and wait until unfrozen.
        </p>
      </div>

      <div className={`flex items-center gap-4 ${labelCls}`} style={muted}>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--success)' }} /> Open
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: 'var(--warning)' }} /> Frozen
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm border" style={{ borderColor: 'var(--border-strong)' }} /> No policy
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Matrix */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          <div
            className="grid gap-2 items-center"
            style={{ gridTemplateColumns: `minmax(120px, auto) repeat(${envs.length}, minmax(110px, 1fr))` }}
          >
            <div />
            {envs.map((e) => (
              <div key={e.key} className={`${labelCls} text-center truncate`} style={muted}>
                {e.label}
              </div>
            ))}
            {products.map((product) => (
              <MatrixRow
                key={product}
                product={product}
                envs={envs}
                hasPair={(env) => Boolean(pairFor(product, env))}
                frozen={(env) => isFrozen(freezes, product, env)}
                isSelected={(env) => selected?.product === product && selected.targetEnv === env}
                onSelect={(env) => select(product, env)}
              />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div
            className="w-full lg:w-[300px] lg:shrink-0 rounded-lg border p-4 space-y-4"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {selected.product}
                </div>
                <div className="text-[13px]" style={secondary}>
                  → {selectedPair?.envLabel ?? selected.targetEnv}
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="p-1 rounded" style={muted} aria-label="Close">
                <X size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-[13px]">
              <span className={labelCls} style={muted}>Status</span>
              {selectedFreeze ? (
                <span className="flex items-center gap-1 font-medium" style={{ color: 'var(--warning)' }}>
                  <Lock size={14} /> Frozen
                </span>
              ) : (
                <span className="flex items-center gap-1 font-medium" style={{ color: 'var(--success)' }}>
                  <Unlock size={14} /> Open
                </span>
              )}
            </div>

            {selectedFreeze ? (
              <div className="space-y-2 text-[13px]" style={{ color: 'var(--text-primary)' }}>
                <Field label="Reason">{selectedFreeze.reason}</Field>
                <Field label="Frozen by">{selectedFreeze.frozenBy}</Field>
                <Field label="Since">
                  {formatDistanceToNow(new Date(selectedFreeze.frozenAt), { addSuffix: true })}
                </Field>
                <Field label="Held candidates">{selectedFreeze.heldCandidates}</Field>
                <button
                  type="button"
                  onClick={() => onUnfreeze(selected.product, selected.targetEnv)}
                  className="px-3 py-1.5 rounded-lg text-[13px] font-medium border bg-transparent"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                >
                  Unfreeze
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className={`${labelCls} block`} style={muted}>Reason (required)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Why are promotions being held?"
                  className="px-2.5 py-1.5 rounded-lg border text-[13px] w-full"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                />
                <button
                  type="button"
                  disabled={!reason.trim()}
                  onClick={() => { onFreeze(selected.product, selected.targetEnv, reason.trim()); setReason(''); }}
                  className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  Freeze
                </button>
              </div>
            )}

            <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className={labelCls} style={muted}>History</div>
              {pairHistory.length === 0 && <div className="text-[13px]" style={muted}>No events yet.</div>}
              {pairHistory.map((h) => (
                <div key={h.id} className="text-[13px] flex gap-2">
                  <Clock size={14} className="mt-0.5 shrink-0" style={muted} />
                  <div className="min-w-0">
                    <span className="font-medium" style={{ color: h.action === 'frozen' ? 'var(--warning)' : 'var(--success)' }}>
                      {h.action === 'frozen' ? 'Frozen' : 'Unfrozen'}
                    </span>
                    <span style={secondary}> by {h.actor} · {formatDistanceToNow(new Date(h.at), { addSuffix: true })}</span>
                    {h.reason && <div className="truncate" style={muted}>{h.reason}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

FreezeVariantB.displayName = 'Matrix + drawer';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className={labelCls} style={muted}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function MatrixRow(props: {
  product: string;
  envs: { key: string; label: string }[];
  hasPair: (env: string) => boolean;
  frozen: (env: string) => { heldCandidates: number } | undefined;
  isSelected: (env: string) => boolean;
  onSelect: (env: string) => void;
}) {
  const { product, envs, hasPair, frozen, isSelected, onSelect } = props;
  return (
    <>
      <div className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{product}</div>
      {envs.map((e) => {
        if (!hasPair(e.key)) {
          return <div key={e.key} className="text-[13px] text-center" style={muted}>—</div>;
        }
        const f = frozen(e.key);
        const sel = isSelected(e.key);
        return (
          <button
            key={e.key}
            type="button"
            onClick={() => onSelect(e.key)}
            className="rounded-lg border px-3 py-2 text-[13px] flex items-center justify-center gap-1.5 w-full"
            style={{
              borderColor: sel ? 'var(--accent)' : 'var(--border-color)',
              backgroundColor: f ? 'var(--warning-bg)' : 'var(--success-bg)',
              color: f ? 'var(--warning)' : 'var(--success)',
            }}
          >
            {f ? (<><Snowflake size={14} /> {f.heldCandidates} held</>) : 'Open'}
          </button>
        );
      })}
    </>
  );
}
