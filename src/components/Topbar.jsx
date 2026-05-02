import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { tickPrices } from '../services/tradingService';

const PAGE_TITLES = {
  '/':            { title: 'Dashboard',       sub: 'Portfolio overview & key metrics' },
  '/banking':     { title: 'Banking Portal',  sub: 'ACID-compliant fund transfers' },
  '/trading':     { title: 'HFT Trading',     sub: 'Order book & real-time execution' },
  '/concurrency': { title: 'Concurrency Demo',sub: 'Locking, isolation & ACID scenarios' },
  '/admin':       { title: 'Admin Panel',     sub: 'User management & audit logs' },
  '/concepts':    { title: 'ACID Concepts',   sub: 'Interactive learning & reference' },
};

const TICKERS = ['RELIANCE','TCS','INFY','HDFC'];

export default function Topbar() {
  const location = useLocation();
  const { title, sub } = PAGE_TITLES[location.pathname] || PAGE_TITLES['/'];
  const [prices, setPrices]   = useState({});
  const [prevPrices, setPrev] = useState({});

  useEffect(() => {
    const tick = () => {
      setPrev(p => ({ ...p }));
      setPrices(tickPrices());
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      <div className="topbar-right">
        <div className="ticker-strip">
          {TICKERS.map(sym => {
            const p = prices[sym] || 0;
            const prev = prevPrices[sym] || p;
            const dir  = p >= prev ? 'up' : 'down';
            return (
              <div key={sym} className={`ticker-item ${dir}`}>
                <span className="sym">{sym}</span>
                <span className="price">₹{p.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            );
          })}
        </div>
        <span className="live-dot" title="Live" />
      </div>
    </header>
  );
}
