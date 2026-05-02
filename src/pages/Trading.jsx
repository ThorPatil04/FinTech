import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { placeOrder, getOrders, getTrades } from '../db/inMemoryDB';
import { getAllSymbols, getStockPrice, tickPrices, generateCandlestickData } from '../services/tradingService';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const fmt  = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const fmtQ = (n) => Number(n).toLocaleString('en-IN');

function generateOrderBook(price) {
  const bids = [], asks = [];
  for (let i = 0; i < 8; i++) {
    bids.push({ price: +(price - (i+1)*0.5 - Math.random()*1).toFixed(2), qty: Math.floor(Math.random()*500+50) });
    asks.push({ price: +(price + (i+1)*0.5 + Math.random()*1).toFixed(2), qty: Math.floor(Math.random()*500+50) });
  }
  return { bids, asks };
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontSize:12 }}>
      <div style={{ color:'var(--text-3)' }}>{d?.time}</div>
      <div>O: <span style={{ color:'var(--text-1)' }}>{fmt(d?.open)}</span></div>
      <div>H: <span style={{ color:'var(--green)' }}>{fmt(d?.high)}</span></div>
      <div>L: <span style={{ color:'var(--red)'   }}>{fmt(d?.low)}</span></div>
      <div>C: <span style={{ color:'var(--accent)' }}>{fmt(d?.close)}</span></div>
    </div>
  );
};

export default function Trading() {
  const { user } = useAuth();
  const [symbol,   setSymbol]   = useState('RELIANCE');
  const [prices,   setPrices]   = useState({});
  const [prevPx,   setPrevPx]   = useState({});
  const [candles,  setCandles]  = useState([]);
  const [ob,       setOb]       = useState({ bids:[], asks:[] });
  const [orders,   setOrders]   = useState([]);
  const [trades,   setTrades]   = useState([]);
  const [side,     setSide]     = useState('BUY');
  const [type,     setType]     = useState('Market');
  const [qty,      setQty]      = useState('');
  const [price,    setPrice]    = useState('');
  const [msg,      setMsg]      = useState(null);

  const refresh = () => {
    setOrders(getOrders(user.id));
    setTrades(getTrades().slice(0, 10));
  };

  useEffect(() => {
    setCandles(generateCandlestickData(symbol));
    const tick = () => {
      setPrevPx(p => ({ ...p }));
      const np = tickPrices();
      setPrices(np);
      setOb(generateOrderBook(np[symbol] || 1000));
    };
    tick(); refresh();
    const id = setInterval(tick, 1800);
    return () => clearInterval(id);
  }, [symbol]);

  const handleOrder = (e) => {
    e.preventDefault();
    const res = placeOrder({ userId: user.id, symbol, type, side, price: Number(price) || prices[symbol], quantity: Number(qty) });
    setMsg(res.matched
      ? { type:'success', text:`✅ Order filled! Matched at ₹${res.trade?.executedPrice} × ${res.trade?.quantity}` }
      : { type:'info',    text:`📋 Order ${res.orderId} queued in order book` });
    refresh();
    setQty(''); setPrice('');
    setTimeout(() => setMsg(null), 4000);
  };

  const curPrice = prices[symbol] || 0;
  const prevPrice= prevPx[symbol] || curPrice;
  const priceDir = curPrice >= prevPrice ? 'pos' : 'neg';

  // Build candlestick bars: use open-close range as bar, full range as whisker
  const candleData = candles.map(c => ({
    ...c,
    bodyLow:  Math.min(c.open, c.close),
    bodyHigh: Math.max(c.open, c.close),
    bullish:  c.close >= c.open,
  }));

  const maxBidQty = Math.max(...ob.bids.map(b=>b.qty), 1);
  const maxAskQty = Math.max(...ob.asks.map(a=>a.qty), 1);

  return (
    <div className="fade-in">
      <h2 className="section-title">HFT Order Book</h2>
      <p className="section-sub">Real-time order matching engine with live price feeds.</p>

      {/* Symbol selector + price */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {getAllSymbols().slice(0,6).map(s => (
            <button key={s} className={`btn btn-sm ${symbol===s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSymbol(s)}>{s}</button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', textAlign:'right' }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:'1.8rem', fontWeight:800 }} className={priceDir}>{fmt(curPrice)}</div>
          <div style={{ fontSize:'0.72rem', color:'var(--text-3)' }}>{symbol} · NSE · Live <span className="live-dot" style={{ marginLeft:4 }} /></div>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="grid-2" style={{ marginBottom:24 }}>
        {/* Chart */}
        <div className="card" style={{ gridColumn:'1 / -1' }}>
          <div className="card-header">
            <span className="card-title">📊 {symbol} — OHLC Chart</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={candleData} margin={{ top:5, right:5, bottom:5, left:5 }}>
              <XAxis dataKey="time" tick={{ fill:'var(--text-3)', fontSize:10 }} tickLine={false} axisLine={false} interval={4} />
              <YAxis domain={['auto','auto']} tick={{ fill:'var(--text-3)', fontSize:10 }} tickLine={false} axisLine={false} tickFormatter={v=>`₹${v}`} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="bodyHigh" stackId="candle" fill="transparent" />
              <Bar dataKey="bodyLow" stackId="candle" radius={[2,2,0,0]}>
                {candleData.map((c,i) => <Cell key={i} fill={c.bullish ? 'var(--green)' : 'var(--red)'} />)}
              </Bar>
              <Line type="monotone" dataKey="close" stroke="var(--accent)" strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Order Book */}
        <div className="card">
          <div className="card-header"><span className="card-title">📖 Order Book — {symbol}</span><span className="live-dot" /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <div style={{ fontSize:'0.72rem', color:'var(--green)', fontWeight:700, marginBottom:6, textTransform:'uppercase' }}>Bids (Buy)</div>
              {ob.bids.map((b,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', fontFamily:'var(--mono)', padding:'3px 0', position:'relative' }}>
                  <div style={{ position:'absolute', right:0, top:0, height:'100%', width:`${(b.qty/maxBidQty)*100}%`, background:'var(--green)', opacity:0.08, pointerEvents:'none' }} />
                  <span style={{ color:'var(--green)' }}>{b.price}</span>
                  <span style={{ color:'var(--text-3)' }}>{fmtQ(b.qty)}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:'0.72rem', color:'var(--red)', fontWeight:700, marginBottom:6, textTransform:'uppercase' }}>Asks (Sell)</div>
              {ob.asks.map((a,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem', fontFamily:'var(--mono)', padding:'3px 0', position:'relative' }}>
                  <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${(a.qty/maxAskQty)*100}%`, background:'var(--red)', opacity:0.08, pointerEvents:'none' }} />
                  <span style={{ color:'var(--red)' }}>{a.price}</span>
                  <span style={{ color:'var(--text-3)' }}>{fmtQ(a.qty)}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign:'center', padding:'10px 0', borderTop:'1px solid var(--border)', marginTop:10 }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:'0.85rem', color:'var(--accent)', fontWeight:700 }}>Spread: ₹{ob.asks[0] && ob.bids[0] ? (ob.asks[0].price - ob.bids[0].price).toFixed(2) : '—'}</span>
          </div>
        </div>

        {/* Order Entry */}
        <div className="card">
          <div className="card-header"><span className="card-title">⚡ Place Order</span></div>
          <form onSubmit={handleOrder}>
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              <button type="button" className={`btn btn-sm ${side==='BUY'?'btn-success':'btn-secondary'}`} style={{ flex:1, justifyContent:'center' }} onClick={()=>setSide('BUY')}>▲ BUY</button>
              <button type="button" className={`btn btn-sm ${side==='SELL'?'btn-danger':'btn-secondary'}`} style={{ flex:1, justifyContent:'center' }} onClick={()=>setSide('SELL')}>▼ SELL</button>
            </div>
            <div className="form-group">
              <label className="form-label">Order Type</label>
              <select className="form-select" value={type} onChange={e=>setType(e.target.value)}>
                {['Market','Limit','Stop-Loss'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-input mono" type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="e.g. 10" min={1} required />
            </div>
            {type !== 'Market' && (
              <div className="form-group">
                <label className="form-label">Price (₹)</label>
                <input className="form-input mono" type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder={`Market: ${curPrice}`} />
              </div>
            )}
            <div style={{ background:'var(--bg-3)', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginBottom:16, fontSize:'0.78rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:'var(--text-3)' }}>Est. Value</span>
                <span style={{ fontFamily:'var(--mono)', color:'var(--text-1)', fontWeight:600 }}>{fmt((Number(qty)||0)*(Number(price)||curPrice))}</span>
              </div>
            </div>
            <button className={`btn ${side==='BUY'?'btn-success':'btn-danger'}`} style={{ width:'100%', justifyContent:'center' }}>
              {side} {qty||0} {symbol} {type==='Market'?'@ Market':'@ Limit'}
            </button>
          </form>
        </div>
      </div>

      {/* Order History */}
      <div className="card">
        <div className="card-header"><span className="card-title">📋 My Orders</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order ID</th><th>Symbol</th><th>Side</th><th>Type</th><th>Price</th><th>Qty</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ color:'var(--accent)' }}>{o.id}</td>
                  <td style={{ color:'var(--text-1)', fontWeight:600 }}>{o.symbol}</td>
                  <td><span style={{ color: o.side==='BUY'?'var(--green)':'var(--red)', fontWeight:700 }}>{o.side}</span></td>
                  <td>{o.type}</td>
                  <td>{o.price ? fmt(o.price) : 'Market'}</td>
                  <td>{o.quantity}</td>
                  <td><span className={`badge badge-${o.status==='FILLED'?'filled':o.status==='PENDING'?'pending':'warn'}`}>{o.status}</span></td>
                  <td style={{ color:'var(--text-3)', fontSize:'0.72rem' }}>{new Date(o.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
