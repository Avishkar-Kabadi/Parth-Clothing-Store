import { useEffect, useState } from 'react';
import type { SaleDocType } from '../lib/database';
import { getDatabase } from '../lib/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IndianRupee, ReceiptText, Banknote, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [sales, setSales] = useState<SaleDocType[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  useEffect(() => {
    let sub: any;
    getDatabase().then(db => {
      sub = db.sales.find().sort({ timestamp: 'desc' }).$.subscribe(allSales => {
        setSales(allSales.map(s => s.toJSON() as SaleDocType));
        setLoading(false);
      });
    });
    return () => sub?.unsubscribe();
  }, []);

  if (loading) return <div className="text-zinc-400">Loading metrics...</div>;

  const today = new Date();
  today.setHours(0,0,0,0);
  
  const todaySales = sales.filter(s => new Date(s.timestamp) >= today);
  const totalRevenue = todaySales.reduce((sum, s) => sum + s.grand_total, 0);
  const totalBills = todaySales.length;
  const cashSales = todaySales.filter(s => s.payment_mode === 'Cash').reduce((sum, s) => sum + s.grand_total, 0);
  const upiSales = todaySales.filter(s => s.payment_mode === 'UPI').reduce((sum, s) => sum + s.grand_total, 0);

  let chartData: { name: string; revenue: number }[] = [];

  if (timeFilter === 'weekly') {
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      return d;
    }).reverse();

    chartData = last7Days.map(date => {
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      const daySales = sales.filter(s => {
        const d = new Date(s.timestamp);
        return d >= date && d < nextDate;
      });
      return {
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: daySales.reduce((sum, s) => sum + s.grand_total, 0)
      };
    });
  } else if (timeFilter === 'monthly') {
    const last4Weeks = Array.from({length: 4}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - ((i + 1) * 7));
      d.setHours(0,0,0,0);
      return d;
    }).reverse();

    chartData = last4Weeks.map((startDate, index) => {
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 7);
      const weekSales = sales.filter(s => {
        const d = new Date(s.timestamp);
        return d >= startDate && d < endDate;
      });
      return {
        name: `Week ${index + 1}`,
        revenue: weekSales.reduce((sum, s) => sum + s.grand_total, 0)
      };
    });
  } else if (timeFilter === 'yearly') {
    const last12Months = Array.from({length: 12}, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      d.setDate(1);
      d.setHours(0,0,0,0);
      return d;
    }).reverse();

    chartData = last12Months.map(date => {
      const nextMonth = new Date(date);
      nextMonth.setMonth(date.getMonth() + 1);
      const monthSales = sales.filter(s => {
        const d = new Date(s.timestamp);
        return d >= date && d < nextMonth;
      });
      return {
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthSales.reduce((sum, s) => sum + s.grand_total, 0)
      };
    });
  }

  return (
    <div className="flex flex-col h-full space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Link to="/billing" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
          <ReceiptText className="w-5 h-5" />
          Quick Bill
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center justify-between shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Today's Revenue</p>
            <p className="text-3xl font-bold text-zinc-50 tracking-tight">₹{totalRevenue.toFixed(2)}</p>
          </div>
          <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
            <IndianRupee className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center justify-between shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Total Bills Today</p>
            <p className="text-3xl font-bold text-zinc-50 tracking-tight">{totalBills}</p>
          </div>
          <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
            <ReceiptText className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center justify-between shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div>
            <p className="text-zinc-400 text-sm font-medium mb-1">Cash Collection</p>
            <p className="text-3xl font-bold text-zinc-50 tracking-tight">₹{cashSales.toFixed(2)}</p>
          </div>
          <div className="h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
            <Banknote className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center justify-between shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div>
            <p className="text-zinc-400 text-sm font-medium mb-1">UPI Collection</p>
            <p className="text-3xl font-bold text-zinc-50 tracking-tight">₹{upiSales.toFixed(2)}</p>
          </div>
          <div className="h-12 w-12 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500">
            <Wallet className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6 min-h-[400px] flex flex-col shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-zinc-100">Sales Trends</h2>
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 4 Weeks</option>
            <option value="yearly">Last 12 Months</option>
          </select>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
              <Tooltip 
                cursor={{fill: '#27272a'}}
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
