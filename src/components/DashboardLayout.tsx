import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import { getDatabase } from '../lib/database';
import { LayoutDashboard, Receipt, BookText, Users, Pen, LogOut, DatabaseBackup, Package } from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/billing', icon: Receipt, label: 'Quick Bill' },
    { to: '/ledger', icon: BookText, label: 'Sales Ledger' },

  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/products', icon: Package, label: 'Product Catalog' });
    navItems.push({ to: '/users', icon: Users, label: 'Staff Management' });
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= String(navItems.length)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        navigate(navItems[index].to);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navItems, navigate]);

  const handleBackup = async () => {
    try {
      const db = await getDatabase();
      const data = {
        users: await db.users.find().exec().then(ds => ds.map(d => d.toJSON())),
        products: await db.products.find().exec().then(ds => ds.map(d => d.toJSON())),
        sales: await db.sales.find().exec().then(ds => ds.map(d => d.toJSON())),
      };
      window.electronAPI?.saveBackup?.({ data, isManual: true });
    } catch (e) {
      console.error('Backup generation failed', e);
    }
  };

  return (
    <div className="flex h-full w-full bg-zinc-950 text-zinc-50 overflow-hidden">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="flex-1 py-6 space-y-2 px-4">
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              <span className="ml-auto text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">Alt+{index + 1}</span>
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <button
              onClick={handleBackup}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 mt-6 cursor-pointer text-left"
            >
              <DatabaseBackup className="h-5 w-5" />
              Backup Database
            </button>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                <span className="font-semibold text-zinc-300">{user?.username.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">{user?.username}</span>
                <span className="text-xs text-zinc-500 mt-1 capitalize">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto bg-zinc-950 p-8">
        <Outlet />
      </main>
    </div>
  );
}
