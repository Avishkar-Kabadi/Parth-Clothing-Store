import { useState, useEffect } from 'react';
import type { SaleDocType } from '../lib/database';
import { getDatabase } from '../lib/database';
import { Search, Download, Calendar, Pen, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@base-ui/react/button';
import { useAuthStore } from '@/store/useStore';
export default function Ledger() {
  const [sales, setSales] = useState<SaleDocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'This Month' | 'This Year'>('All');
  const { user } = useAuthStore();


  useEffect(() => {
    let sub: any;
    getDatabase().then(db => {
      sub = db.sales.find().sort({ timestamp: 'desc' }).$.subscribe(docs => {
        setSales(docs.map(d => d.toJSON() as SaleDocType));
        setLoading(false);
      });
    });
    return () => sub?.unsubscribe();
  }, []);

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      s.customer_phone.includes(search);

    if (!matchesSearch) return false;

    const saleDate = new Date(s.timestamp);
    const today = new Date();

    if (dateFilter === 'Today') {
      return saleDate.toDateString() === today.toDateString();
    }
    if (dateFilter === 'This Month') {
      return saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
    }
    if (dateFilter === 'This Year') {
      return saleDate.getFullYear() === today.getFullYear();
    }

    return true;
  });


  const deleteLedgerRecord = async (id: string): Promise<boolean> => {
    try {
      const db = await getDatabase();

      const doc = await db.sales.findOne(id).exec();

      if (doc) {
        await doc.remove();
        console.log(`Record ${id} deleted successfully.`);
        return true;
      } else {
        console.warn("Record not found.");
        return false;
      }
    } catch (error) {
      console.error("Failed to delete record:", error);
      return false;
    }
  };

  const aggregateTotal = filteredSales.reduce((sum, s) => sum + s.grand_total, 0);

  const exportCSV = () => {
    const headers = ['Receipt ID', 'Date', 'Customer Name', 'Phone', 'Payment Mode', 'Items Count', 'Grand Total', 'Created By'];
    const rows = filteredSales.map(s => [
      s.id,
      new Date(s.timestamp).toLocaleString(),
      `"${s.customer_name}"`,
      s.customer_phone,
      s.payment_mode,
      s.items.reduce((sum, i) => sum + i.quantity, 0),
      s.grand_total,
      s.created_by
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Parth_Sales_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) return <div className="text-zinc-400">Loading ledger...</div>;

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Sales Ledger</h1>
        <button onClick={exportCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50" disabled={filteredSales.length === 0}>
          <Download className="w-4 h-4" />
          Export to CSV
        </button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100 placeholder-zinc-500 transition-colors shadow-sm"
          />
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as any)}
            className="pl-10 pr-8 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100 appearance-none shadow-sm cursor-pointer"
          >
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
          </select>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm whitespace-nowrap border-separate border-spacing-0">
            <thead className="bg-zinc-950 text-zinc-400 sticky top-0 border-b border-zinc-800 z-10">
              <tr>
                <th className="px-6 py-4 font-medium border-b border-zinc-800">Date & Time</th>
                <th className="px-6 py-4 font-medium border-b border-zinc-800">Receipt ID</th>
                <th className="px-6 py-4 font-medium border-b border-zinc-800">Customer</th>
                <th className="px-6 py-4 font-medium border-b border-zinc-800">Payment</th>
                <th className="px-6 py-4 font-medium text-right border-b border-zinc-800">Amount</th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-4 font-medium text-center border-b border-zinc-800">Edit</th>
                )}

                {user?.role === 'admin' && (
                  <th className="px-6 py-4 font-medium text-center border-b border-zinc-800">Delete</th>
                )}

              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4 text-zinc-300">
                    <div className="flex flex-col">
                      <span className="font-medium">{new Date(sale.timestamp).toLocaleDateString()}</span>
                      <span className="text-xs text-zinc-500">{new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 font-mono text-xs">#{sale.id.slice(-8)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-zinc-200 font-medium">{sale.customer_name}</span>
                      <span className="text-xs text-zinc-500">{sale.customer_phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${sale.payment_mode === 'Cash'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sale.payment_mode === 'Cash' ? 'bg-amber-500' : 'bg-indigo-500'}`}></span>
                      {sale.payment_mode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-zinc-100">
                    ₹{sale.grand_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  {user?.role === 'admin' && <td className="px-6 py-4 text-center">
                    <Link
                      to={`/edit-ledger/${sale.id}`}
                      className="p-2 inline-block hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-200 transition-all cursor-pointer"
                    >
                      <Pen size={16} />
                    </Link>
                  </td>
                  }
                  {user?.role === 'admin' &&
                    <td className="px-6 py-4 text-center">
                      <Button
                        className="p-2 inline-block hover:bg-zinc-700 rounded-lg text-zinc-500 hover:text-zinc-200 transition-all cursor-pointer"
                      >
                        <Trash size={16} onClick={() => deleteLedgerRecord(sale.id)} />
                      </Button>
                    </td>
                  }
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-zinc-500 bg-zinc-950/20">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-lg">No sales found</span>
                      <span className="text-xs">Try adjusting your search or filters</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


        <div className="bg-zinc-950 p-6 border-t border-zinc-800 flex justify-between items-center text-lg">
          <span className="text-zinc-400 text-sm">Showing {filteredSales.length} records</span>
          <div className="font-bold flex items-center gap-4">
            <span className="text-zinc-500">Total Selection Value:</span>
            <span className="text-blue-500 text-2xl tracking-tight">₹{aggregateTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div >
  );
}
