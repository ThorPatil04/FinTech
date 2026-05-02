const ACID = [
  {
    letter:'A', name:'Atomicity', color:'var(--accent)',
    tagline:'"All or Nothing"',
    desc:'A transaction is treated as a single, indivisible unit. Either ALL operations within it succeed and are committed, or NONE of them are applied — the database rolls back to its previous state.',
    example:'When transferring ₹10,000 from Account A to Account B:\n• Debit ₹10,000 from A  ✓\n• Credit ₹10,000 to B  ✗ (system crash)\n→ Rollback: A is restored to original balance.',
    impl:'In PostgreSQL: BEGIN ... COMMIT / ROLLBACK. In code: @Transactional annotation in Spring Boot wraps the entire method.',
    pills:['BEGIN','COMMIT','ROLLBACK','@Transactional'],
  },
  {
    letter:'C', name:'Consistency', color:'var(--green)',
    tagline:'"Rules Are Never Broken"',
    desc:'A transaction brings the database from one valid state to another valid state. All defined rules (constraints, cascades, triggers) must be satisfied before the commit is accepted.',
    example:'Constraint: account.balance >= 0\n• Transfer ₹50,000 from an account with ₹20,000\n→ Constraint violated → Transaction rejected automatically.',
    impl:'Enforced via CHECK constraints, NOT NULL, FOREIGN KEY, and application-level validation before commit.',
    pills:['CHECK constraint','NOT NULL','FOREIGN KEY','Cascades'],
  },
  {
    letter:'I', name:'Isolation', color:'var(--purple)',
    tagline:'"Transactions Don\'t Interfere"',
    desc:'Concurrent transactions execute as if they were serial (one after another). The intermediate state of a transaction is invisible to other transactions depending on the isolation level configured.',
    example:'Without isolation:\n• TX-A reads ₹1,00,000\n• TX-B writes ₹50,000 (uncommitted)\n• TX-A reads ₹50,000 → DIRTY READ!\nWith READ COMMITTED: TX-A only sees committed values.',
    impl:'Controlled via isolation levels. PostgreSQL default: READ COMMITTED. Highest: SERIALIZABLE (uses predicate locking).',
    pills:['READ UNCOMMITTED','READ COMMITTED','REPEATABLE READ','SERIALIZABLE'],
  },
  {
    letter:'D', name:'Durability', color:'var(--yellow)',
    tagline:'"Committed = Permanent"',
    desc:'Once a transaction is committed, it is permanently recorded even in the event of system failures, power loss, or crashes. The data survives using Write-Ahead Logging (WAL).',
    example:'TX commits at 14:23:05.442\n→ Power failure at 14:23:05.500\n→ Database restarts\n→ Transaction data is still present (WAL replayed).',
    impl:'PostgreSQL uses WAL (Write-Ahead Log). Changes are written to the log before the actual data pages are modified.',
    pills:['WAL','fsync','Checkpoint','Redo Log'],
  },
];

const ISOLATION_TABLE = [
  { level:'READ UNCOMMITTED', dirty:'❌ Yes', nonRepeatable:'❌ Yes', phantom:'❌ Yes', use:'Rarely used — reports only' },
  { level:'READ COMMITTED',   dirty:'✅ No',  nonRepeatable:'❌ Yes', phantom:'❌ Yes', use:'Default in PostgreSQL, MySQL' },
  { level:'REPEATABLE READ',  dirty:'✅ No',  nonRepeatable:'✅ No',  phantom:'❌ Yes', use:'Default in MySQL InnoDB' },
  { level:'SERIALIZABLE',     dirty:'✅ No',  nonRepeatable:'✅ No',  phantom:'✅ No',  use:'Highest safety — banking, HFT' },
];

const LOCKING = [
  { name:'Optimistic Locking', icon:'🔓', color:'var(--yellow)',
    desc:'Read data, do work, then check if anyone else changed it before committing. Uses a version column.',
    pros:'No lock held during computation. High throughput for low-conflict scenarios.',
    cons:'Conflict detected late — requires retry. Bad for high-conflict workloads.',
    sql:'UPDATE accounts SET balance=?, version=version+1 WHERE id=? AND version=?',
  },
  { name:'Pessimistic Locking', icon:'🔒', color:'var(--red)',
    desc:'Acquire lock before reading or writing. Other transactions must wait until the lock is released.',
    pros:'No conflicts possible. Safe for high-conflict scenarios like HFT order matching.',
    cons:'Lower throughput. Risk of deadlocks if multiple locks acquired in different orders.',
    sql:'SELECT * FROM accounts WHERE id=? FOR UPDATE;',
  },
];

export default function Concepts() {
  return (
    <div className="fade-in">
      <h2 className="section-title">ACID Concepts</h2>
      <p className="section-sub">Interactive reference for ACID properties, isolation levels, and concurrency control.</p>

      {/* ACID Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:20, marginBottom:32 }}>
        {ACID.map(a => (
          <div key={a.letter} className="card" style={{ borderTop:`3px solid ${a.color}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:`color-mix(in srgb, ${a.color} 20%, transparent)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', fontWeight:900, color:a.color, fontFamily:'var(--mono)' }}>
                {a.letter}
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:'1rem', color:'var(--text-1)' }}>{a.name}</div>
                <div style={{ fontSize:'0.75rem', color:a.color, fontStyle:'italic' }}>{a.tagline}</div>
              </div>
            </div>

            <p style={{ fontSize:'0.82rem', color:'var(--text-2)', lineHeight:1.8, marginBottom:12 }}>{a.desc}</p>

            <div style={{ background:'var(--bg-0)', borderRadius:'var(--radius-sm)', padding:'10px 12px', marginBottom:12, fontFamily:'var(--mono)', fontSize:'0.72rem', color:'var(--text-2)', whiteSpace:'pre-line', lineHeight:1.8 }}>
              {a.example}
            </div>

            <div style={{ fontSize:'0.75rem', color:'var(--text-3)', marginBottom:10, lineHeight:1.7 }}>
              <strong style={{ color:'var(--text-2)' }}>Implementation: </strong>{a.impl}
            </div>

            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {a.pills.map(p => (
                <span key={p} style={{ background:`color-mix(in srgb, ${a.color} 12%, transparent)`, color:a.color, padding:'2px 8px', borderRadius:99, fontSize:'0.67rem', fontWeight:600, fontFamily:'var(--mono)' }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Isolation Levels Table */}
      <div className="card" style={{ marginBottom:28 }}>
        <div className="card-header">
          <span className="card-title">📊 Isolation Level Comparison</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Isolation Level</th>
                <th>Dirty Read</th>
                <th>Non-Repeatable Read</th>
                <th>Phantom Read</th>
                <th>Typical Use</th>
              </tr>
            </thead>
            <tbody>
              {ISOLATION_TABLE.map(row => (
                <tr key={row.level}>
                  <td style={{ color:'var(--text-1)', fontWeight:600 }}>{row.level}</td>
                  <td style={{ fontSize:'0.85rem' }}>{row.dirty}</td>
                  <td style={{ fontSize:'0.85rem' }}>{row.nonRepeatable}</td>
                  <td style={{ fontSize:'0.85rem' }}>{row.phantom}</td>
                  <td style={{ color:'var(--text-3)', fontSize:'0.75rem' }}>{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Locking */}
      <div className="grid-2" style={{ marginBottom:28 }}>
        {LOCKING.map(l => (
          <div key={l.name} className="card" style={{ borderLeft:`3px solid ${l.color}` }}>
            <h3 style={{ fontWeight:800, fontSize:'1rem', marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
              <span>{l.icon}</span> {l.name}
            </h3>
            <p style={{ fontSize:'0.82rem', color:'var(--text-2)', lineHeight:1.7, marginBottom:12 }}>{l.desc}</p>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:'0.72rem', color:'var(--green)', fontWeight:700, marginBottom:4 }}>✅ PROS</div>
              <p style={{ fontSize:'0.78rem', color:'var(--text-2)' }}>{l.pros}</p>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:'0.72rem', color:'var(--red)', fontWeight:700, marginBottom:4 }}>❌ CONS</div>
              <p style={{ fontSize:'0.78rem', color:'var(--text-2)' }}>{l.cons}</p>
            </div>
            <div style={{ background:'var(--bg-0)', borderRadius:'var(--radius-sm)', padding:'8px 12px', fontFamily:'var(--mono)', fontSize:'0.72rem', color:'var(--accent)' }}>
              {l.sql}
            </div>
          </div>
        ))}
      </div>

      {/* SQL Cheatsheet */}
      <div className="card">
        <div className="card-header"><span className="card-title">💻 SQL Transaction Cheatsheet</span></div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:12 }}>
          {[
            { title:'Basic Transaction', code:`BEGIN;\nUPDATE accounts SET balance = balance - 10000 WHERE id = 'acc1';\nUPDATE accounts SET balance = balance + 10000 WHERE id = 'acc2';\nCOMMIT;` },
            { title:'Rollback on Error', code:`BEGIN;\nUPDATE accounts SET balance = balance - 50000\nWHERE id = 'acc1' AND balance >= 50000;\nIF ROW_COUNT() = 0 THEN\n  ROLLBACK;\nELSE\n  COMMIT;\nEND IF;` },
            { title:'Set Isolation Level', code:`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nBEGIN;\n-- Your queries here\nCOMMIT;` },
            { title:'Pessimistic Lock', code:`BEGIN;\nSELECT * FROM accounts\nWHERE id = 'acc1'\nFOR UPDATE; -- row locked!\n-- safe to modify\nCOMMIT;` },
          ].map(({ title, code }) => (
            <div key={title} style={{ background:'var(--bg-3)', borderRadius:'var(--radius-sm)', padding:'14px' }}>
              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>{title}</div>
              <pre style={{ fontFamily:'var(--mono)', fontSize:'0.72rem', color:'var(--accent)', whiteSpace:'pre-wrap', lineHeight:1.7 }}>{code}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
