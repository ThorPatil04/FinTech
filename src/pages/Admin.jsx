import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllUsers, getAuditLogs, getAllTransactions, toggleUserSuspend } from '../db/inMemoryDB';

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

export default function Admin() {
  const { user } = useAuth();
  const [tab,    setTab]    = useState('users');
  const [users,  setUsers]  = useState(getAllUsers);
  const [logs,   setLogs]   = useState(getAuditLogs);
  const [txns,   setTxns]   = useState(getAllTransactions);
  const [filter, setFilter] = useState('');

  if (user.role !== 'Admin') {
    return (
      <div className="fade-in" style={{ textAlign:'center', padding:'80px 20px' }}>
        <div style={{ fontSize:'3rem', marginBottom:16 }}>🔒</div>
        <h2 style={{ color:'var(--red)' }}>Access Denied</h2>
        <p style={{ color:'var(--text-2)', marginTop:8 }}>You need Admin role to view this page.</p>
      </div>
    );
  }

  const handleToggle = (uid) => {
    toggleUserSuspend(uid, user.id);
    setUsers(getAllUsers());
    setLogs(getAuditLogs());
  };

  const filteredLogs = logs.filter(l =>
    !filter || l.action.includes(filter.toUpperCase()) || l.details.toLowerCase().includes(filter.toLowerCase())
  );

  const stats = {
    totalTx: txns.length,
    committed: txns.filter(t=>t.status==='COMMITTED').length,
    rolledBack: txns.filter(t=>t.status==='ROLLED_BACK').length,
    activeUsers: users.filter(u=>!u.suspended).length,
  };

  return (
    <div className="fade-in">
      <h2 className="section-title">Admin Panel</h2>
      <p className="section-sub">User management, audit trails, and system health monitoring.</p>

      {/* System stats */}
      <div className="stat-grid" style={{ marginBottom:24 }}>
        {[
          { label:'Total Transactions', value: stats.totalTx,   color:'var(--accent)' },
          { label:'Committed',          value: stats.committed, color:'var(--green)' },
          { label:'Rolled Back',        value: stats.rolledBack,color:'var(--red)' },
          { label:'Active Users',       value: stats.activeUsers,color:'var(--purple)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="label">{s.label}</span>
            <span className="value" style={{ color:s.color }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="tabs">
        {[['users','👥 Users'],['audit','📋 Audit Log'],['txns','🔄 All Transactions']].map(([id,label]) => (
          <button key={id} className={`tab ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="card fade-in">
          <div className="card-header"><span className="card-title">👥 User Management</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color:'var(--text-1)', fontWeight:600 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="avatar" style={{ width:28, height:28, fontSize:'0.7rem' }}>{u.name[0]}</div>
                        {u.name}
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                    <td>
                      <span className={`badge ${u.suspended ? 'badge-rolledback' : 'badge-committed'}`}>
                        {u.suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td>
                      {u.id !== user.id && (
                        <button className={`btn btn-sm ${u.suspended ? 'btn-success' : 'btn-danger'}`} onClick={() => handleToggle(u.id)}>
                          {u.suspended ? 'Activate' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="card fade-in">
          <div className="card-header">
            <span className="card-title">📋 Audit Log</span>
            <input className="form-input" style={{ width:220 }} placeholder="Filter by action or detail…" value={filter} onChange={e=>setFilter(e.target.value)} />
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>Details</th><th>Severity</th></tr></thead>
              <tbody>
                {filteredLogs.slice(0,50).map(l => {
                  const u = users.find(x => x.id === l.userId);
                  return (
                    <tr key={l.id}>
                      <td style={{ color:'var(--text-3)', fontSize:'0.7rem' }}>{new Date(l.timestamp).toLocaleString()}</td>
                      <td style={{ color:'var(--text-1)' }}>{u?.name ?? l.userId}</td>
                      <td style={{ fontWeight:700, color:'var(--accent)' }}>{l.action}</td>
                      <td style={{ color:'var(--text-3)' }}>{l.entity}</td>
                      <td style={{ color:'var(--text-2)', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.details}</td>
                      <td><span className={`badge badge-${l.severity==='INFO'?'info':l.severity==='WARN'?'warn':'error'}`}>{l.severity}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'txns' && (
        <div className="card fade-in">
          <div className="card-header">
            <span className="card-title">🔄 All Transactions</span>
            <span style={{ fontSize:'0.75rem', color:'var(--text-3)' }}>{txns.length} total</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>TX ID</th><th>From</th><th>To</th><th>Amount</th><th>Isolation</th><th>Status</th><th>Time</th></tr></thead>
              <tbody>
                {txns.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ color:'var(--accent)' }}>{tx.id}</td>
                    <td>{tx.fromAccountId}</td>
                    <td>{tx.toAccountId}</td>
                    <td style={{ fontWeight:600, color:'var(--text-1)' }}>{fmt(tx.amount)}</td>
                    <td style={{ fontSize:'0.68rem', color:'var(--text-3)' }}>{tx.isolationLevel}</td>
                    <td><span className={`badge badge-${tx.status==='COMMITTED'?'committed':tx.status==='PENDING'?'pending':'rolledback'}`}>{tx.status}</span></td>
                    <td style={{ color:'var(--text-3)', fontSize:'0.7rem' }}>{new Date(tx.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
