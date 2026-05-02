// ============================================================
// IN-MEMORY DATABASE — Simulates PostgreSQL ACID behavior
// Tables: users, accounts, transactions, orders, trades, audit_logs
// ============================================================

let _nextId = 1000;
const nextId = () => String(++_nextId);
const now = () => new Date().toISOString();

// ── SEED DATA ────────────────────────────────────────────────
const db = {
  users: [
    { id: "u1", name: "Prasad Mahajan", email: "admin@fintech.io",  role: "Admin",  passwordHash: "admin123",   twoFASecret: "482910", suspended: false, createdAt: now() },
    { id: "u2", name: "Priya Sharma",  email: "trader@fintech.io", role: "Trader", passwordHash: "trader123",  twoFASecret: "739201", suspended: false, createdAt: now() },
    { id: "u3", name: "Rohan Das",     email: "viewer@fintech.io", role: "Viewer", passwordHash: "viewer123",  twoFASecret: "156734", suspended: false, createdAt: now() },
  ],
  accounts: [
    { id: "acc1", userId: "u1", type: "Savings",  balance: 250000, version: 1, currency: "INR" },
    { id: "acc2", userId: "u1", type: "Trading",  balance: 500000, version: 1, currency: "INR" },
    { id: "acc3", userId: "u1", type: "Wallet",   balance: 75000,  version: 1, currency: "INR" },
    { id: "acc4", userId: "u2", type: "Savings",  balance: 180000, version: 1, currency: "INR" },
    { id: "acc5", userId: "u2", type: "Trading",  balance: 320000, version: 1, currency: "INR" },
    { id: "acc6", userId: "u3", type: "Savings",  balance: 90000,  version: 1, currency: "INR" },
  ],
  transactions: [
    { id: "tx1", fromAccountId: "acc2", toAccountId: "acc1", amount: 50000,  status: "COMMITTED",    isolationLevel: "SERIALIZABLE",     type: "Transfer",  timestamp: new Date(Date.now()-86400000*2).toISOString(), description: "Portfolio rebalance" },
    { id: "tx2", fromAccountId: "acc1", toAccountId: "acc3", amount: 15000,  status: "COMMITTED",    isolationLevel: "READ_COMMITTED",   type: "Transfer",  timestamp: new Date(Date.now()-86400000).toISOString(),   description: "Wallet top-up" },
    { id: "tx3", fromAccountId: "acc4", toAccountId: "acc5", amount: 200000, status: "ROLLED_BACK",  isolationLevel: "SERIALIZABLE",     type: "Transfer",  timestamp: new Date(Date.now()-3600000*5).toISOString(),  description: "Insufficient balance check" },
    { id: "tx4", fromAccountId: "acc2", toAccountId: "acc5", amount: 10000,  status: "COMMITTED",    isolationLevel: "REPEATABLE_READ",  type: "Transfer",  timestamp: new Date(Date.now()-3600000).toISOString(),    description: "Inter-broker transfer" },
  ],
  orders: [
    { id: "ord1", userId: "u2", symbol: "RELIANCE", type: "Market", side: "BUY",  price: 2850, quantity: 10, status: "FILLED",   createdAt: new Date(Date.now()-7200000).toISOString() },
    { id: "ord2", userId: "u2", symbol: "TCS",      type: "Limit",  side: "SELL", price: 3900, quantity: 5,  status: "PENDING",  createdAt: new Date(Date.now()-3600000).toISOString() },
    { id: "ord3", userId: "u1", symbol: "INFY",     type: "Limit",  side: "BUY",  price: 1720, quantity: 20, status: "PARTIAL",  createdAt: new Date(Date.now()-1800000).toISOString() },
  ],
  trades: [
    { id: "trd1", buyOrderId: "ord1", sellOrderId: null, symbol: "RELIANCE", executedPrice: 2847, quantity: 10, executedAt: new Date(Date.now()-7100000).toISOString() },
  ],
  audit_logs: [
    { id: "al1", userId: "u1", action: "LOGIN",    entity: "auth",         details: "Admin login successful",    timestamp: new Date(Date.now()-86400000*3).toISOString(), severity: "INFO" },
    { id: "al2", userId: "u2", action: "TRANSFER", entity: "transactions", details: "Transfer ₹50,000 acc2→acc1", timestamp: new Date(Date.now()-86400000*2).toISOString(), severity: "INFO" },
    { id: "al3", userId: "u2", action: "ROLLBACK", entity: "transactions", details: "TX rolled back: constraint violation", timestamp: new Date(Date.now()-3600000*5).toISOString(), severity: "WARN" },
    { id: "al4", userId: "u2", action: "ORDER",    entity: "orders",       details: "Buy 10 RELIANCE @ Market",  timestamp: new Date(Date.now()-7200000).toISOString(),    severity: "INFO" },
  ],
};

// ── TRANSACTION ENGINE ───────────────────────────────────────
// Simulates BEGIN / COMMIT / ROLLBACK with version locking

export function getDB() { return db; }

export function getUserById(id) { return db.users.find(u => u.id === id) || null; }
export function getUserByEmail(email) { return db.users.find(u => u.email === email) || null; }
export function getAccountsByUserId(uid) { return db.accounts.filter(a => a.userId === uid); }
export function getAllAccounts() { return db.accounts; }
export function getTransactionsByUserId(uid) {
  const accs = getAccountsByUserId(uid).map(a => a.id);
  return db.transactions.filter(t => accs.includes(t.fromAccountId) || accs.includes(t.toAccountId))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
export function getAllTransactions() {
  return [...db.transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
export function getAuditLogs() {
  return [...db.audit_logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
export function getOrders(userId) {
  return db.orders.filter(o => !userId || o.userId === userId)
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
}
export function getTrades() { return [...db.trades].sort((a,b) => new Date(b.executedAt)-new Date(a.executedAt)); }

// ── ACID TRANSFER ────────────────────────────────────────────
export function executeTransfer({ fromId, toId, amount, isolationLevel = "SERIALIZABLE", description = "Transfer", userId }) {
  const txId = `tx${nextId()}`;
  const alId = `al${nextId()}`;
  const entry = {
    id: txId, fromAccountId: fromId, toAccountId: toId, amount,
    status: "PENDING", isolationLevel, type: "Transfer",
    timestamp: now(), description,
  };
  db.transactions.push(entry);

  // ── ATOMICITY: read both accounts first ──
  const from = db.accounts.find(a => a.id === fromId);
  const to   = db.accounts.find(a => a.id === toId);

  if (!from || !to) {
    entry.status = "ROLLED_BACK";
    entry.rollbackReason = "Account not found";
    addAuditLog(userId, "ROLLBACK", "transactions", `TX ${txId} rolled back: account not found`, "ERROR");
    return { success: false, txId, reason: "Account not found" };
  }

  // ── CONSISTENCY: balance constraint ──
  if (from.balance < amount) {
    entry.status = "ROLLED_BACK";
    entry.rollbackReason = "Insufficient balance";
    addAuditLog(userId, "ROLLBACK", "transactions", `TX ${txId} rolled back: insufficient balance`, "WARN");
    return { success: false, txId, reason: "Insufficient balance — constraint violation" };
  }
  if (amount <= 0) {
    entry.status = "ROLLED_BACK";
    entry.rollbackReason = "Invalid amount";
    addAuditLog(userId, "ROLLBACK", "transactions", `TX ${txId} rolled back: invalid amount`, "WARN");
    return { success: false, txId, reason: "Amount must be > 0" };
  }

  // ── ISOLATION (Optimistic Lock): version check ──
  const fromVersion = from.version;
  const toVersion   = to.version;

  // ── ATOMICITY: apply both debits/credits together ──
  from.balance -= amount;
  from.version += 1;
  to.balance   += amount;
  to.version   += 1;

  // ── DURABILITY: mark committed ──
  entry.status = "COMMITTED";
  entry.fromVersion = fromVersion;
  entry.toVersion   = toVersion;

  addAuditLog(userId, "TRANSFER", "transactions", `TX ${txId}: ₹${amount.toLocaleString('en-IN')} from ${fromId} → ${toId}`, "INFO");
  return { success: true, txId, from, to };
}

// ── OPTIMISTIC LOCK SIMULATION ───────────────────────────────
export function executeOptimisticTransfer({ fromId, toId, amount, expectedVersion, userId }) {
  const from = db.accounts.find(a => a.id === fromId);
  if (!from) return { success: false, conflict: true, reason: "Account not found" };
  if (from.version !== expectedVersion) {
    return { success: false, conflict: true, reason: `Version conflict! Expected v${expectedVersion}, found v${from.version}. Another transaction modified this account.` };
  }
  return executeTransfer({ fromId, toId, amount, isolationLevel: "OPTIMISTIC_LOCK", userId });
}

// ── ORDER ENGINE ─────────────────────────────────────────────
export function placeOrder({ userId, symbol, type, side, price, quantity }) {
  const orderId = `ord${nextId()}`;
  const order = { id: orderId, userId, symbol, type, side, price, quantity, status: "PENDING", createdAt: now() };
  db.orders.push(order);
  addAuditLog(userId, "ORDER", "orders", `${side} ${quantity} ${symbol} @ ${type === "Market" ? "Market" : price}`, "INFO");

  // Simple matching: find opposite side pending order
  const match = db.orders.find(o =>
    o.symbol === symbol && o.side !== side && o.status === "PENDING" && o.id !== orderId
  );
  if (match) {
    const execPrice = match.price || price;
    const qty       = Math.min(order.quantity, match.quantity);
    const trade = { id: `trd${nextId()}`, buyOrderId: side === "BUY" ? orderId : match.id, sellOrderId: side === "SELL" ? orderId : match.id, symbol, executedPrice: execPrice, quantity: qty, executedAt: now() };
    db.trades.push(trade);
    order.status = qty === order.quantity ? "FILLED" : "PARTIAL";
    match.status = qty === match.quantity ? "FILLED" : "PARTIAL";
    addAuditLog(userId, "TRADE", "trades", `Matched ${qty} ${symbol} @ ₹${execPrice}`, "INFO");
    return { success: true, orderId, matched: true, trade };
  }
  return { success: true, orderId, matched: false };
}

// ── AUDIT LOG ────────────────────────────────────────────────
export function addAuditLog(userId, action, entity, details, severity = "INFO") {
  db.audit_logs.push({ id: `al${nextId()}`, userId, action, entity, details, timestamp: now(), severity });
}

// ── ADMIN ────────────────────────────────────────────────────
export function toggleUserSuspend(userId, adminId) {
  const user = db.users.find(u => u.id === userId);
  if (!user) return false;
  user.suspended = !user.suspended;
  addAuditLog(adminId, user.suspended ? "SUSPEND" : "ACTIVATE", "users", `User ${user.email} ${user.suspended ? "suspended" : "activated"}`, "WARN");
  return true;
}

export function getAllUsers() { return db.users; }

export default db;
