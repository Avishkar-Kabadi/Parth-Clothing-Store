import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './store/useStore';
import { getDatabase } from './lib/database';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Ledger from './pages/Ledger';
import Users from './pages/Users';
import Products from './pages/Products';
import EditLedgerRecord from './pages/EditLedgerRecord';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  useEffect(() => {
    getDatabase().then(() => setDbReady(true));

    window.electronAPI?.onTriggerBackup?.(async () => {
      try {
        const db = await getDatabase();
        const data = {
          users: await db.users.find().exec().then(ds => ds.map(d => d.toJSON())),
          products: await db.products.find().exec().then(ds => ds.map(d => d.toJSON())),
          sales: await db.sales.find().exec().then(ds => ds.map(d => d.toJSON())),
        };
        window.electronAPI?.saveBackup?.({ data, isManual: false });
      } catch (e) {
        console.error('Backup generation failed', e);
        window.electronAPI?.saveBackup?.({ data: { error: 'Failed' }, isManual: false });
      }
    });
  }, []);

  if (!dbReady) return <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-white">Loading Database...</div>;

  return (
    <HashRouter>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-50 font-sans">
        {/* Custom Titlebar */}
        <div className="h-10 w-full bg-zinc-900 border-b border-zinc-800 flex justify-between items-center select-none" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
          <div className="pl-4 text-xs font-semibold tracking-wider text-zinc-400">PARTH CLOTHING STORE</div>
          <div className="flex pl-4" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button onClick={() => window.electronAPI?.windowControls('minimize')} className="h-10 px-4 hover:bg-zinc-800 transition-colors text-zinc-400 cursor-pointer">—</button>
            <button onClick={() => window.electronAPI?.windowControls('maximize')} className="h-10 px-4 hover:bg-zinc-800 transition-colors text-zinc-400 cursor-pointer">□</button>
            <button onClick={() => window.electronAPI?.windowControls('close')} className="h-10 px-4 hover:bg-red-600 hover:text-white transition-colors text-zinc-400 cursor-pointer">x</button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />

            <Route path="/" element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />}>
              <Route index element={<Dashboard />} />
              <Route path="billing" element={<Billing />} />
              <Route path="ledger" element={<Ledger />} />
              <Route path="edit-ledger/:id" element={<EditLedgerRecord />} />

              <Route path="users" element={<Users />} />
              <Route path="products" element={<Products />} />
            </Route>
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}
