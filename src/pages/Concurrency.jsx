import { useState, useEffect, useRef } from 'react';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Scenario runners ──────────────────────────────────────────
async function runLostUpdate(log, setAcc) {
  let balance = 10000;
  setAcc(balance);
  log('INFO', 'TX-A reads balance', balance, 'T1');
  await sleep(600);
  log('INFO', 'TX-B reads balance', balance, 'T2');
  await sleep(600);
  log('WARN', 'TX-A writes balance (deduct ₹3,000)', balance - 3000, 'T1');
  await sleep(600);
  log('WARN', 'TX-B writes balance (deduct ₹4,000) — overwrites TX-A!', balance - 4000, 'T2');
  balance = balance - 4000; setAcc(balance);
  await sleep(400);
  log('ERROR', '⚠️ Lost Update! TX-A\'s ₹3,000 deduction was lost. Balance should be ₹3,000.', balance, 'RESULT');
  await sleep(500);
  log('SUCCESS', '✅ FIX: With pessimistic lock, TX-B would wait until TX-A commits.', 10000 - 3000 - 4000, 'FIXED');
}

async function runDirtyRead(log, setAcc) {
  let balance = 50000;
  setAcc(balance);
  log('INFO', 'TX-A starts, credits ₹20,000 (uncommitted)', balance + 20000, 'T1');
  await sleep(600);
  log('WARN', 'TX-B reads balance (READ UNCOMMITTED)', balance + 20000, 'T2');
  setAcc(balance + 20000);
  await sleep(600);
  log('ERROR', 'TX-A rolls back! Credit reversed.', balance, 'T1');
  setAcc(balance);
  await sleep(400);
  log('ERROR', '⚠️ Dirty Read! TX-B acted on ₹70,000 which never actually existed.', balance, 'RESULT');
  await sleep(500);
  log('SUCCESS', '✅ FIX: READ COMMITTED isolation prevents TX-B from reading uncommitted data.', balance, 'FIXED');
}

async function runPhantomRead(log, setAcc) {
  log('INFO', 'TX-A queries accounts WHERE balance > 40,000 → gets 2 rows', 2, 'T1');
  await sleep(700);
  log('WARN', 'TX-B inserts new account with balance = ₹90,000 (committed)', 3, 'T2');
  await sleep(700);
  log('ERROR', 'TX-A re-runs same query → now gets 3 rows (phantom row appeared!)', 3, 'RESULT');
  setAcc(3);
  await sleep(500);
  log('SUCCESS', '✅ FIX: SERIALIZABLE isolation prevents phantom reads via range locks.', 2, 'FIXED');
}

async function runDeadlock(log, setAcc) {
  log('INFO', 'TX-A acquires lock on Account-1', null, 'T1');
  await sleep(600);
  log('INFO', 'TX-B acquires lock on Account-2', null, 'T2');
  await sleep(600);
  log('WARN', 'TX-A waits for lock on Account-2 (held by TX-B)…', null, 'T1');
  await sleep(600);
  log('WARN', 'TX-B waits for lock on Account-1 (held by TX-A)…', null, 'T2');
  await sleep(700);
  log('ERROR', '💀 DEADLOCK DETECTED! Cycle: TX-A → Account-2 → TX-B → Account-1 → TX-A', null, 'SYSTEM');
  await sleep(500);
  log('WARN', '🔄 Victim selected: TX-B rolled back (lower priority)', null, 'SYSTEM');
  await sleep(500);
  log('SUCCESS', '✅ TX-A acquires Account-2 lock and commits. TX-B retries.', null, 'FIXED');
  setAcc(1);
}

const SCENARIOS = [
  { id: 'lost',    label: '🔁 Lost Update',    desc: 'Two concurrent writes overwrite each other',         runner: runLostUpdate  },
  { id: 'dirty',   label: '🧹 Dirty Read',     desc: 'Reading uncommitted data from a rolled-back TX',    runner: runDirtyRead   },
  { id: 'phantom', label: '👻 Phantom Read',   desc: 'New rows appear mid-transaction in a range query',  runner: runPhantomRead },
  { id: 'deadlock',label: '💀 Deadlock',       desc: 'Two transactions wait on each other\'s locks',      runner: runDeadlock    },
];

const SEV_COLOR = { INFO:'var(--accent)', WARN:'var(--yellow)', ERROR:'var(--red)', SUCCESS:'var(--green)', SYSTEM:'var(--purple)' };

export default function Concurrency() {
  const [tab,      setTab]     = useState('lost');
  const [logs,     setLogs]    = useState([]);
  const [running,  setRunning] = useState(false);
  const [acc,      setAcc]     = useState(null);
  const logRef = useRef(null);

  const scenario = SCENARIOS.find(s => s.id === tab);

  const addLog = (sev, msg, val, src) =>
    setLogs(prev => [...prev, { sev, msg, val, src, ts: new Date().toLocaleTimeString('en-IN', { hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits:3 }) }]);

  const run = async () => {
    setLogs([]); setRunning(true); setAcc(null);
    await scenario.runner(addLog, setAcc);
    setRunning(false);
  };

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  return (
    <div className="fade-in">
      <h2 className="section-title">Concurrency Demo</h2>
      <p className="section-sub">Visualize real database concurrency problems and how ACID properties solve them.</p>

      <div className="tabs">
        {SCENARIOS.map(s => (
          <button key={s.id} className={`tab ${tab===s.id?'active':''}`} onClick={() => { setTab(s.id); setLogs([]); setAcc(null); }}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
          <div>
            <h3 style={{ fontWeight:700, fontSize:'1rem', marginBottom:6 }}>{scenario.label}</h3>
            <p style={{ color:'var(--text-2)', fontSize:'0.85rem' }}>{scenario.desc}</p>
          </div>
          <button className="btn btn-primary" onClick={run} disabled={running} style={{ flexShrink:0 }}>
            {running ? '⏳ Running…' : '▶ Run Demo'}
          </button>
        </div>
      </div>

      <div className="grid-2">
        {/* Log Panel */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <span className="card-title">📟 Transaction Timeline</span>
            {running && <span style={{ fontSize:'0.75rem', color:'var(--yellow)', fontWeight:600, animation:'pulse 1s infinite' }}>● LIVE</span>}
          </div>

          {/* TX Columns */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
            {['TX-A (T1)', 'TX-B (T2)', 'SYSTEM/RESULT'].map((label,i) => {
              const srcs = [['T1'],['T2'],['SYSTEM','RESULT','FIXED']];
              const myLogs = logs.filter(l => srcs[i].includes(l.src));
              return (
                <div key={label} style={{ background:'var(--bg-3)', borderRadius:'var(--radius-sm)', padding:'12px', minHeight:120 }}>
                  <div style={{ fontSize:'0.72rem', fontWeight:700, color:['var(--accent)','var(--purple)','var(--yellow)'][i], marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {myLogs.map((l,j) => (
                      <div key={j} style={{ fontSize:'0.75rem', padding:'5px 8px', background:'var(--bg-2)', borderRadius:6, borderLeft:`3px solid ${SEV_COLOR[l.sev]||'var(--border)'}` }} className="slide-in">
                        <div style={{ color:SEV_COLOR[l.sev], fontWeight:600 }}>{l.msg}</div>
                        {l.val !== null && <div style={{ fontFamily:'var(--mono)', color:'var(--text-3)', fontSize:'0.68rem' }}>val = {typeof l.val === 'number' ? '₹'+l.val.toLocaleString('en-IN') : l.val}</div>}
                        <div style={{ color:'var(--text-3)', fontSize:'0.65rem' }}>{l.ts}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Raw log */}
          <div ref={logRef} style={{ background:'var(--bg-0)', borderRadius:'var(--radius-sm)', padding:'12px 16px', height:180, overflowY:'auto', fontFamily:'var(--mono)', fontSize:'0.75rem' }}>
            {logs.length === 0 && <span style={{ color:'var(--text-3)' }}>Press ▶ Run Demo to start the simulation…</span>}
            {logs.map((l, i) => (
              <div key={i} style={{ marginBottom:3 }}>
                <span style={{ color:'var(--text-3)' }}>[{l.ts}] </span>
                <span style={{ color:['T1'].includes(l.src)?'var(--accent)':['T2'].includes(l.src)?'var(--purple)':'var(--yellow)', fontWeight:600 }}>[{l.src}] </span>
                <span style={{ color:SEV_COLOR[l.sev] }}>{l.msg}</span>
                {l.val !== null && <span style={{ color:'var(--text-3)' }}> → {typeof l.val === 'number' ? '₹'+l.val.toLocaleString('en-IN') : l.val}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fix Summary */}
      <div className="grid-2" style={{ marginTop:20 }}>
        {[
          { title:'Isolation Levels', items:[
            { level:'READ UNCOMMITTED', fixes:'Nothing — allows dirty reads', color:'var(--red)' },
            { level:'READ COMMITTED',   fixes:'Prevents dirty reads', color:'var(--yellow)' },
            { level:'REPEATABLE READ',  fixes:'+ Prevents lost updates', color:'var(--accent)' },
            { level:'SERIALIZABLE',     fixes:'+ Prevents phantom reads', color:'var(--green)' },
          ]},
          { title:'Locking Strategies', items:[
            { level:'No Lock',          fixes:'Lost update, dirty read possible', color:'var(--red)' },
            { level:'Optimistic Lock',  fixes:'Detects conflict via version check', color:'var(--yellow)' },
            { level:'Shared Lock (S)',  fixes:'Allows concurrent reads', color:'var(--accent)' },
            { level:'Exclusive Lock (X)',fixes:'Full isolation, prevents all conflicts', color:'var(--green)' },
          ]},
        ].map(section => (
          <div key={section.title} className="card">
            <div className="card-header"><span className="card-title">{section.title}</span></div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {section.items.map(item => (
                <div key={item.level} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 12px', background:'var(--bg-3)', borderRadius:'var(--radius-sm)' }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:item.color, flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--text-1)' }}>{item.level}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-3)' }}>{item.fixes}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
