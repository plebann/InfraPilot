// PROTOTYPE — throwaway. Variant A: dense register table.
import { Fragment, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Check, Lock, Search, Snowflake, Unlock, X } from 'lucide-react';
import { isFrozen, type FreezeVariantProps } from './freezePrototypeTypes';

const primaryBtn = 'px-3 py-1.5 rounded-lg text-[13px] font-medium text-white inline-flex items-center gap-1.5';
const secondaryBtn = 'px-3 py-1.5 rounded-lg text-[13px] font-medium border inline-flex items-center gap-1.5';
const inputCls = 'px-2.5 py-1.5 rounded-lg border text-[13px]';
const inputStyle = { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' };
const thCls = 'text-[11px] font-medium uppercase tracking-wider text-left py-2 pr-3';

function pairKey(product: string, targetEnv: string) {
  return `${product}::${targetEnv}`;
}

export function FreezeVariantA(props: FreezeVariantProps) {
  const { pairs, freezes, onFreeze, onUnfreeze } = props;
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState<string | null>(null); // pair key with the inline reason row open
  const [reason, setReason] = useState('');
  const [confirmUnfreeze, setConfirmUnfreeze] = useState<string | null>(null);

  const frozenCount = pairs.filter((p) => isFrozen(freezes, p.product, p.targetEnv)).length;
  const q = filter.trim().toLowerCase();
  const rows = q ? pairs.filter((p) => p.product.toLowerCase().includes(q)) : pairs;

  const openEditor = (key: string) => {
    setEditing(key);
    setReason('');
    setConfirmUnfreeze(null);
  };
  const closeEditor = () => {
    setEditing(null);
    setReason('');
  };

  return (
    <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Snowflake size={14} />
            Freeze
          </h2>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            While a pair is frozen, no promotion for that product into that environment can become Approved. Approvals are
            still recorded and wait until the freeze is lifted.
          </p>
        </div>
        <div className="relative shrink-0">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className={`${inputCls} pl-8 w-48`}
            style={inputStyle}
            placeholder="Filter by product"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>
        {frozenCount} of {pairs.length} pairs frozen
      </div>

      <table className="w-full text-[13px] border-collapse" style={{ color: 'var(--text-primary)' }}>
        <thead>
          <tr style={{ color: 'var(--text-muted)' }}>
            <th className={thCls}>Product</th>
            <th className={thCls}>Environment</th>
            <th className={thCls}>Status</th>
            <th className={thCls}>Reason</th>
            <th className={thCls}>Frozen by / since</th>
            <th className={`${thCls} text-right`}>Held</th>
            <th className={`${thCls} text-right pr-0`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr className="border-t" style={{ borderColor: 'var(--border-color)' }}>
              <td colSpan={7} className="py-6 text-center" style={{ color: 'var(--text-muted)' }}>
                No pairs match "{filter}".
              </td>
            </tr>
          )}
          {rows.map((p) => {
            const key = pairKey(p.product, p.targetEnv);
            const freeze = isFrozen(freezes, p.product, p.targetEnv);
            const isEditing = editing === key;
            const awaitingConfirm = confirmUnfreeze === key;
            return (
              <Fragment key={key}>
                <tr className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <td className="py-2 pr-3 font-medium">{p.product}</td>
                  <td className="py-2 pr-3">{p.envLabel}</td>
                  <td className="py-2 pr-3">
                    {freeze ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
                        style={{ color: 'var(--warning)', backgroundColor: 'var(--warning-bg)' }}
                      >
                        <Lock size={11} /> Frozen
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
                        style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                      >
                        Open
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 max-w-[280px] truncate" style={{ color: freeze ? 'var(--text-primary)' : 'var(--text-muted)' }} title={freeze?.reason}>
                    {freeze ? freeze.reason : '—'}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap" style={{ color: freeze ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {freeze ? (
                      <>
                        {freeze.frozenBy}
                        <span style={{ color: 'var(--text-muted)' }}> · {formatDistanceToNow(new Date(freeze.frozenAt), { addSuffix: true })}</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums" style={{ color: freeze ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {freeze ? freeze.heldCandidates : ''}
                  </td>
                  <td className="py-2 pr-0 text-right whitespace-nowrap">
                    {freeze ? (
                      <button
                        type="button"
                        className={secondaryBtn}
                        style={{
                          borderColor: awaitingConfirm ? 'var(--danger)' : 'var(--border-color)',
                          color: awaitingConfirm ? 'var(--danger)' : 'var(--text-primary)',
                          backgroundColor: 'transparent',
                        }}
                        onClick={() => {
                          if (awaitingConfirm) {
                            onUnfreeze(p.product, p.targetEnv);
                            setConfirmUnfreeze(null);
                          } else {
                            setConfirmUnfreeze(key);
                            closeEditor();
                          }
                        }}
                        onBlur={() => awaitingConfirm && setConfirmUnfreeze(null)}
                      >
                        <Unlock size={14} />
                        {awaitingConfirm ? 'Click again to confirm' : 'Unfreeze'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={secondaryBtn}
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'transparent' }}
                        onClick={() => (isEditing ? closeEditor() : openEditor(key))}
                      >
                        <Snowflake size={14} />
                        Freeze
                      </button>
                    )}
                  </td>
                </tr>
                {isEditing && !freeze && (
                  <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <td colSpan={7} className="py-2 px-3">
                      <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!reason.trim()) return;
                          onFreeze(p.product, p.targetEnv, reason.trim());
                          closeEditor();
                        }}
                      >
                        <span className="text-[13px] shrink-0" style={{ color: 'var(--text-secondary)' }}>
                          Freeze <strong style={{ color: 'var(--text-primary)' }}>{p.product}</strong> → {p.envLabel}. Reason
                        </span>
                        <input
                          autoFocus
                          className={`${inputCls} flex-1`}
                          style={inputStyle}
                          placeholder="e.g. Change freeze until Q4 close (required)"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          onKeyDown={(e) => e.key === 'Escape' && closeEditor()}
                        />
                        <button
                          type="submit"
                          disabled={!reason.trim()}
                          className={`${primaryBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
                          style={{ backgroundColor: 'var(--accent)' }}
                        >
                          <Check size={14} /> Confirm
                        </button>
                        <button
                          type="button"
                          className={secondaryBtn}
                          style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', backgroundColor: 'transparent' }}
                          onClick={closeEditor}
                        >
                          <X size={14} /> Cancel
                        </button>
                      </form>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

FreezeVariantA.displayName = 'Register table';
