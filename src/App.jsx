import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Banking from './pages/Banking';
import Trading from './pages/Trading';
import Concurrency from './pages/Concurrency';
import Admin from './pages/Admin';
import Concepts from './pages/Concepts';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <div className="page-body">
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/banking"    element={<Banking />} />
            <Route path="/trading"    element={<Trading />} />
            <Route path="/concurrency" element={<Concurrency />} />
            <Route path="/admin"      element={<Admin />} />
            <Route path="/concepts"   element={<Concepts />} />
            <Route path="*"           element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*"     element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
