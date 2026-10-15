// PROTOTYPE — throwaway. Variant C: active freezes first, then a freeze form and a journal.
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Snowflake, Sun } from 'lucide-react';
import type { ActiveFreeze, FreezeVariantProps } from './freezePrototypeTypes';
import { isFrozen } from './freezePrototypeTypes';

const JOURNAL_LIMIT = 10;

const inputClass = 'px-2.5 py-1.5 rounded-lg border text-[13px]';
const inputStyle = { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' };

function relative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

function ActiveFreezeCard({ freeze, envLabel, onUnfreeze }: { freeze: ActiveFreeze; envLabel: string; onUnfreeze: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      className="rounded-lg border p-3 flex items-start gap-3"
      style={{
        borderColor: 'var(--border-color)',
        borderLeft: '3px solid var(--warning)',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <Snowflake size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--warning)' }} />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            {freeze.product} → {envLabel}
          </span>
          <span
            className="text-[11px] px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}
          >
            {freeze.heldCandidates} held
          </span>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{freeze.reason}</p>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          frozen by {freeze.frozenBy} · since {relative(freeze.frozenAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => (confirming ? onUnfreeze() : setConfirming(true))}
        onBlur={() => setConfirming(false)}
        className="px-3 py-1.5 rounded-lg text-[13px] font-medium border shrink-0"
        style={{
          borderColor: confirming ? 'var(--border-strong)' : 'var(--border-color)',
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
        }}
      >
        {confirming ? 'Click again to confirm' : 'Lift freeze'}
      </button>
    </div>
  );
}

export function FreezeVariantC(props: FreezeVariantProps) {
  const { pairs, environments, freezes, history, onFreeze, onUnfreeze } = props;
  const [product, setProduct] = useState('');
  const [env, setEnv] = useState('');
  const [reason, setReason] = useState('');

  const envLabelOf = (key: string) => environments.find((e) => e.key === key)?.label ?? key;
  const products = Array.from(new Set(pairs.map((p) => p.product))).sort();
  const envOptions = environments.filter(
    (e) =>
      pairs.some((p) => p.product === product && p.targetEnv === e.key) &&
      !isFrozen(freezes, product, e.key),
  );
  const canFreeze = product !== '' && env !== '' && reason.trim() !== '';

  const submit = () => {
    if (!canFreeze) return;
    onFreeze(product, env, reason.trim());
    setProduct('');
    setEnv('');
    setReason('');
  };

  const journal = history.slice(0, JOURNAL_LIMIT);

  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div>
        <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>Freeze</h2>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Hold promotions for a product into an environment. Approvals keep being recorded; nothing becomes Approved until the freeze is lifted.
        </p>
      </div>

      {/* 1. Active freezes */}
      <section className="space-y-2">
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          Active freezes{freezes.length > 0 && <span style={{ color: 'var(--text-muted)' }}> · {freezes.length}</span>}
        </h3>
        {freezes.length === 0 ? (
          <div
            className="rounded-lg border p-3 flex items-center gap-2 text-[13px]"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--success-bg)', color: 'var(--text-secondary)' }}
          >
            <Sun size={14} style={{ color: 'var(--success)' }} />
            No active freezes. Promotions flow normally.
          </div>
        ) : (
          freezes.map((f) => (
            <ActiveFreezeCard
              key={`${f.product}:${f.targetEnv}`}
              freeze={f}
              envLabel={envLabelOf(f.targetEnv)}
              onUnfreeze={() => onUnfreeze(f.product, f.targetEnv)}
            />
          ))
        )}
      </section>

      {/* 2. Freeze a product */}
      <section className="space-y-2">
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Freeze a product</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={product}
            onChange={(e) => { setProduct(e.target.value); setEnv(''); }}
            className={inputClass}
            style={inputStyle}
          >
            <option value="">Product…</option>
            {products.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={env}
            onChange={(e) => setEnv(e.target.value)}
            disabled={product === ''}
            className={`${inputClass} disabled:opacity-50`}
            style={inputStyle}
          >
            <option value="">{product === '' ? 'Environment…' : envOptions.length === 0 ? 'All frozen' : 'Environment…'}</option>
            {envOptions.map((e) => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Reason (required)"
            className={`${inputClass} flex-1 min-w-[200px]`}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!canFreeze}
            className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Freeze
          </button>
        </div>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          Approvals keep being recorded while frozen; nothing is promoted until you lift it.
        </p>
      </section>

      {/* 3. Journal */}
      <section className="space-y-2">
        <h3 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Journal</h3>
        {journal.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No freeze activity yet.</p>
        ) : (
          <ol className="relative">
            {journal.map((entry, idx) => {
              const frozen = entry.action === 'frozen';
              const last = idx === journal.length - 1;
              return (
                <li key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center w-3 shrink-0">
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: frozen ? 'var(--warning)' : 'var(--success)' }}
                    />
                    {!last && <span className="flex-1 w-px" style={{ backgroundColor: 'var(--border-color)' }} />}
                  </div>
                  <div className={`flex-1 flex items-start justify-between gap-3 ${last ? '' : 'pb-3'}`}>
                    <p className="text-[13px]" style={{ color: 'var(--text-primary)' }}>
                      <span className="font-medium">{entry.actor}</span> {frozen ? 'froze' : 'lifted'}{' '}
                      {entry.product} → {envLabelOf(entry.targetEnv)}
                      {entry.reason && (
                        <span style={{ color: 'var(--text-secondary)' }}> — “{entry.reason}”</span>
                      )}
                    </p>
                    <span className="text-[11px] whitespace-nowrap mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {relative(entry.at)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {history.length > JOURNAL_LIMIT && (
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Showing latest {JOURNAL_LIMIT}</p>
        )}
      </section>
    </div>
  );
}

FreezeVariantC.displayName = 'Active freezes + journal';
