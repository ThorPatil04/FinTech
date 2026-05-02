import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAccountsByUserId, getTransactionsByUserId } from '../db/inMemoryDB';
import { getAllPrices, tickPrices } from '../services/tradingService';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, ArrowRightLeft, ShieldCheck } from 'lucide-react';

function generatePortfolioHistory() {
  const data = []; let val = 820000;
  for (let i = 29; i >= 0; i--) {
    val += (Math.random() - 0.42) * 12000;
    val = Math.max(700000, val);
    const d = new Date(Date.now() - i * 86400000);
    data.push({ date: d.toLocaleDateString('en-IN', { month:'short', day:'numeric' }), value: Math.round(val) });
  }
  return data;
}

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts]   = useState([]);
  const [txns,     setTxns]       = useState([]);
  const [prices,   setPrices]     = useState({});
  const [history]                  = useState(generatePortfolioHistory);

  useEffect(() => {
    setAccounts(getAccountsByUserId(user.id));
    setTxns(getTransactionsByUserId(user.id).slice(0, 5));
    setPrices(getAllPrices());
    const id = setInterval(() => setPrices(tickPrices()), 2500);
    return () => clearInterval(id);
  }, [user.id]);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const tradingAcc   = accounts.find(a => a.type === 'Trading');
  const pnl          = tradingAcc ? (Math.random() * 40000 - 5000).toFixed(0) : 0;

  const stats = [
    { label: 'Total Balance',    value: fmt(totalBalance),   change: '+2.4%', pos: true,  icon: <Wallet size={18} />,       color: 'var(--accent)' },
    { label: 'Trading Account',  value: fmt(tradingAcc?.balance ?? 0), change: pnl > 0 ? `+${fmt(pnl)}` : fmt(pnl), pos: pnl > 0, icon: <TrendingUp size={18} />, color: 'var(--green)' },
    { label: 'Total Transactions', value: txns.length,      change: 'Last 30d', pos: null, icon: <ArrowRightLeft size={18} />, color: 'var(--purple)' },
    { label: 'Security Status',  value: '🔒 Secure',        change: '2FA Active', pos: true, icon: <ShieldCheck size={18} />, color: 'var(--yellow)' },
  ];

  const lastPt = history[history.length-1]?.value ?? 0;
  const firstPt = history[0]?.value ?? 0;
  const portfolioPct = (((lastPt - firstPt) / firstPt) * 100).toFixed(2);

  return (
    <div className="fade-in">
      <h2 className="section-title">Welcome back, {user.name.split(' ')[0]} 👋</h2>
      <p className="section-sub">Here's your financial overview for today.</p>

      {/* Stat Cards */}
      <div className="stat-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <span className="label">{s.label}</span>
              <div className="icon-wrap" style={{ background: `color-mix(in srgb, ${s.color} 15%, transparent)` }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
            </div>
            <div className="value" style={{ fontSize:'1.3rem' }}>{s.value}</div>
            <div className="change" style={{ color: s.pos === null ? 'var(--text-3)' : s.pos ? 'var(--green)' : 'var(--red)' }}>
              {s.pos !== null ? (s.pos ? '▲' : '▼') : ''} {s.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Portfolio Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📈 Portfolio Value (30D)</span>
            <span className={portfolioPct >= 0 ? 'pos' : 'neg'} style={{ fontFamily:'var(--mono)', fontSize:'0.85rem', fontWeight:700 }}>
              {portfolioPct >= 0 ? '+' : ''}{portfolioPct}%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill:'var(--text-3)', fontSize:10 }} tickLine={false} axisLine={false} interval={6} />
              <YAxis hide domain={['auto','auto']} />
              <Tooltip contentStyle={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}
                formatter={(v) => [fmt(v), 'Value']} labelStyle={{ color:'var(--text-3)' }} />
              <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill="url(#portGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Accounts */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🏦 My Accounts</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/banking')}>Manage →</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {accounts.map(a => (
              <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', background:'var(--bg-3)', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{a.type}</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:'0.78rem', color:'var(--text-3)' }}>{a.id}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:'1rem' }}>{fmt(a.balance)}</div>
                  <div style={{ fontSize:'0.68rem', color:'var(--text-3)' }}>v{a.version}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🔄 Recent Transactions</span>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/banking')}>View All →</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>TX ID</th><th>Description</th><th>Amount</th><th>Isolation</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              {txns.map(tx => (
                <tr key={tx.id}>
                  <td>{tx.id}</td>
                  <td style={{ color:'var(--text-1)' }}>{tx.description}</td>
                  <td>{fmt(tx.amount)}</td>
                  <td><span style={{ fontSize:'0.68rem', color:'var(--text-3)' }}>{tx.isolationLevel}</span></td>
                  <td>
                    <span className={`badge badge-${tx.status === 'COMMITTED' ? 'committed' : tx.status === 'PENDING' ? 'pending' : 'rolledback'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td>{new Date(tx.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
