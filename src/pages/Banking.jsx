import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAccountsByUserId, getAllAccounts, getTransactionsByUserId, executeTransfer, executeOptimisticTransfer
} from '../db/inMemoryDB';

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');
const ISOLATION_LEVELS = ['READ_UNCOMMITTED','READ_COMMITTED','REPEATABLE_READ','SERIALIZABLE'];

export default function Banking() {
  const { user } = useAuth();
  const [accounts,   setAccounts]   = useState([]);
  const [allAccounts, setAll]       = useState([]);
  const [txns,       setTxns]       = useState([]);
  const [selected,   setSelected]   = useState('');
  const [toAcc,      setToAcc]      = useState('');
  const [amount,     setAmount]     = useState('');
  const [isolation,  setIsolation]  = useState('SERIALIZABLE');
  const [desc,       setDesc]       = useState('');
  const [lockMode,   setLockMode]   = useState('pessimistic');
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);

  const refresh = () => {
    setAccounts(getAccountsByUserId(user.id));
    setAll(getAllAccounts());
    setTxns(getTransactionsByUserId(user.id));
  };

  useEffect(() => { refresh(); }, [user.id]);

  const handleTransfer = (e) => {
    e.preventDefault();
    if (!selected || !toAcc || !amount) return;
    setLoading(true); setResult(null);

    setTimeout(() => {
      let res;
      const fromAcc = accounts.find(a => a.id === selected);
      if (lockMode === 'optimistic') {
        res = executeOptimisticTransfer({ fromId: selected, toId: toAcc, amount: Number(amount), expectedVersion: fromAcc?.version, userId: user.id });
      } else {
        res = executeTransfer({ fromId: selected, toId: toAcc, amount: Number(amount), isolationLevel: isolation, description: desc || 'Fund transfer', userId: user.id });
      }
      setResult(res);
      setLoading(false);
      refresh();
    }, 800);
  };

  const myAccIds = accounts.map(a => a.id);
  const otherAccounts = allAccounts.filter(a => a.id !== selected);

  return (
    <div className="fade-in">
      <h2 className="section-title">Banking Portal</h2>
      <p className="section-sub">ACID-compliant fund transfers with isolation level control.</p>

      {/* Account Cards */}
      <div className="account-cards">
        {accounts.map(a => (
          <div key={a.id} className={`account-card ${selected === a.id ? 'selected' : ''}`} onClick={() => setSelected(a.id)}>
            <div className="acc-type">{a.type} Account</div>
            <div className="acc-balance">{fmt(a.balance)}</div>
            <div className="acc-id">{a.id} · v{a.version}</div>
            <div style={{ marginTop: 8, fontSize:'0.68rem', color:'var(--text-3)' }}>Click to select as source</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Transfer Form */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">💸 New Transfer</span>
          </div>

          {result && (
            <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 16 }}>
              {result.success
                ? `✅ TX ${result.txId} committed successfully (ACID compliant)`
                : `❌ Rolled back: ${result.reason}`}
              {result.conflict && <div style={{ marginTop:4, fontSize:'0.78rem' }}>⚠️ {result.reason}</div>}
            </div>
          )}

          <form onSubmit={handleTransfer}>
            <div className="form-group">
              <label className="form-label">From Account</label>
              <select className="form-select" value={selected} onChange={e => setSelected(e.target.value)} required>
                <option value="">-- Select source --</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.type} — {fmt(a.balance)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">To Account</label>
              <select className="form-select" value={toAcc} onChange={e => setToAcc(e.target.value)} required>
                <option value="">-- Select destination --</option>
                {otherAccounts.map(a => <option key={a.id} value={a.id}>{a.id} ({a.type})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-input mono" type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Enter amount" min={1} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" type="text" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="e.g. Portfolio rebalance" />
            </div>
            <div className="form-group">
              <label className="form-label">Isolation Level</label>
              <select className="form-select" value={isolation} onChange={e=>setIsolation(e.target.value)}>
                {ISOLATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Locking Strategy</label>
              <div style={{ display:'flex', gap:8 }}>
                {['pessimistic','optimistic'].map(m => (
                  <button key={m} type="button"
                    className={`btn btn-sm ${lockMode === m ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setLockMode(m)} style={{ flex:1, justifyContent:'center' }}>
                    {m === 'pessimistic' ? '🔒 Pessimistic' : '🔓 Optimistic'}
                  </button>
                ))}
              </div>
            </div>

            {/* ACID indicators */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
              {[['A','Atomicity','var(--accent)'],['C','Consistency','var(--green)'],['I','Isolation','var(--purple)'],['D','Durability','var(--yellow)']].map(([k,v,c]) => (
                <span key={k} style={{ background:`color-mix(in srgb, ${c} 15%, transparent)`, color:c, padding:'3px 10px', borderRadius:99, fontSize:'0.72rem', fontWeight:700 }}>
                  {k}: {v}
                </span>
              ))}
            </div>

            <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={loading}>
              {loading ? '⏳ Processing Transaction…' : '⚡ Execute Transfer'}
            </button>
          </form>
        </div>

        {/* ACID Explanation Panel */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔬 Transaction Properties</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              { k:'Atomicity',    c:'var(--accent)', desc:'Both debit and credit occur together — or not at all. If credit fails, debit is rolled back instantly.' },
              { k:'Consistency',  c:'var(--green)',  desc:'Balance constraint (≥ 0) is enforced before commit. Violations trigger automatic rollback.' },
              { k:'Isolation',    c:'var(--purple)', desc:`Current level: ${isolation}. Controls whether concurrent transactions can see each other's uncommitted data.` },
              { k:'Durability',   c:'var(--yellow)', desc:'Once committed, the transaction is permanently recorded and survives any future failure.' },
            ].map(({ k, c, desc }) => (
              <div key={k} style={{ padding:'12px 16px', background:'var(--bg-3)', borderRadius:'var(--radius-sm)', borderLeft:`3px solid ${c}` }}>
                <div style={{ fontWeight:700, color:c, fontSize:'0.82rem', marginBottom:4 }}>{k}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-2)', lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
            <div style={{ padding:'12px 16px', background:'var(--bg-3)', borderRadius:'var(--radius-sm)', borderLeft:`3px solid ${lockMode==='optimistic'?'var(--yellow)':'var(--red)'}` }}>
              <div style={{ fontWeight:700, color: lockMode==='optimistic'?'var(--yellow)':'var(--red)', fontSize:'0.82rem', marginBottom:4 }}>
                {lockMode === 'optimistic' ? '🔓 Optimistic Lock' : '🔒 Pessimistic Lock'}
              </div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-2)', lineHeight:1.7 }}>
                {lockMode === 'optimistic'
                  ? 'Uses version field. If another TX modified the row since you read it, your TX is aborted and retried.'
                  : 'Acquires row-level lock before read. Other transactions wait. Prevents dirty reads and lost updates.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📋 Transaction History</span>
          <span style={{ fontSize:'0.75rem', color:'var(--text-3)' }}>{txns.length} records</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>TX ID</th><th>From</th><th>To</th><th>Amount</th><th>Isolation</th><th>Status</th><th>Description</th><th>Timestamp</th></tr>
            </thead>
            <tbody>
              {txns.map(tx => (
                <tr key={tx.id}>
                  <td style={{ color:'var(--accent)' }}>{tx.id}</td>
                  <td>{tx.fromAccountId}</td>
                  <td>{tx.toAccountId}</td>
                  <td style={{ color:'var(--text-1)', fontWeight:600 }}>{fmt(tx.amount)}</td>
                  <td><span style={{ fontSize:'0.68rem', color:'var(--text-3)' }}>{tx.isolationLevel}</span></td>
                  <td>
                    <span className={`badge badge-${tx.status==='COMMITTED'?'committed':tx.status==='PENDING'?'pending':'rolledback'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ color:'var(--text-2)' }}>{tx.description}</td>
                  <td style={{ color:'var(--text-3)', fontSize:'0.72rem' }}>{new Date(tx.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
