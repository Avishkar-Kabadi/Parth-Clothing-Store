import { useState, useEffect } from 'react';
import { useCartStore, useAuthStore } from '../store/useStore';
import { getDatabase } from '../lib/database';
import type { ProductDocType, SaleDocType } from '../lib/database';
import { Plus, Trash2, Printer } from 'lucide-react';

export default function Billing() {
  const { user } = useAuthStore();
  const {
    items, customerName, customerPhone, paymentMode, taxPercentage,
    setCustomerInfo, setPaymentMode, setTaxPercentage, addItem, removeItem, updateQuantity, clearCart,
    getSubtotal, getTax, getGrandTotal
  } = useCartStore();

  const [products, setProducts] = useState<ProductDocType[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let sub: any;
    getDatabase().then(db => {
      sub = db.products.find().$.subscribe(docs => {
        setProducts(docs.map(d => d.toJSON() as ProductDocType));
      });
    });
    return () => sub?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!customerPhone || customerPhone.length < 5) return;
    const fetchCustomerName = async () => {
      try {
        const db = await getDatabase();
        const existingSale = await db.sales.findOne({ selector: { customer_phone: customerPhone } }).exec();
        if (existingSale?.customer_name) setCustomerInfo(existingSale.customer_name, customerPhone);
      } catch (err) { console.error('Error fetching customer by phone', err); }
    };
    const t = setTimeout(fetchCustomerName, 500);
    return () => clearTimeout(t);
  }, [customerPhone]);

  const isFormValid = customerName.trim().length >= 2 && customerPhone.trim().length >= 7 && items.length > 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (!isSubmitting && isFormValid) handleSave();
      }
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        if (!isSubmitting && isFormValid) handlePrintAndSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, customerName, customerPhone, paymentMode, taxPercentage, isSubmitting, isFormValid]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(pr => pr.id === selectedProductId);
    if (!product) return;

    const p = parseFloat(manualPrice);
    const q = parseInt(quantity);
    if (isNaN(p) || p < 0 || isNaN(q) || q <= 0) return;

    addItem({ product_id: product.id, name: product.name, price: p, quantity: q, total: p * q });
    setSelectedProductId(''); setManualPrice(''); setQuantity('1');
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const db = await getDatabase();
      const newSale: SaleDocType = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        items: [...items],
        subtotal: getSubtotal(), tax: getTax(), grand_total: getGrandTotal(),
        payment_mode: paymentMode,
        created_by: user?.username || 'unknown',
      };
      await db.sales.insert(newSale);
      clearCart();
    } catch (err) {
      console.error('Failed to save sale', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintAndSave = async () => {
    setIsSubmitting(true);
    try {
      const db = await getDatabase();
      const newSale: SaleDocType = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        items: [...items],
        subtotal: getSubtotal(), tax: getTax(), grand_total: getGrandTotal(),
        payment_mode: paymentMode,
        created_by: user?.username || 'unknown',
      };
      await db.sales.insert(newSale);
      await window.electronAPI?.printReceipt(newSale);
      clearCart();
    } catch (err) {
      console.error('Failed to save sale', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls = "w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100 transition-colors";

  return (
    <div className="flex flex-col h-full space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Quick Bill</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-zinc-100">Customer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Customer Name *"
                  value={customerName}
                  onChange={e => setCustomerInfo(e.target.value, customerPhone)}
                  className={inputCls}
                  required
                  minLength={2}
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Phone Number *"
                  value={customerPhone}
                  onChange={e => setCustomerInfo(customerName, e.target.value)}
                  className={inputCls}
                  required
                  minLength={7}
                  maxLength={15}
                />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex-1 flex flex-col shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-zinc-100">Add Items</h2>

            <form onSubmit={handleAddItem} className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className={inputCls}
                  required
                >
                  <option value="">Select Product... *</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>
              <div className="md:w-32">
                <input
                  type="number"
                  placeholder="Price *"
                  value={manualPrice}
                  onChange={e => setManualPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                  className={inputCls}
                />
              </div>
              <div className="md:w-24">
                <input
                  type="number"
                  placeholder="Qty *"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  min="1"
                  required
                  className={inputCls}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors flex justify-center items-center cursor-pointer border border-zinc-700 h-[42px]"
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <div className="flex-1 overflow-auto border border-zinc-800 rounded-lg bg-zinc-950 relative">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-900/90 text-zinc-400 sticky top-0 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 font-medium">Item Name</th>
                    <th className="px-4 py-3 font-medium text-right">Price</th>
                    <th className="px-4 py-3 font-medium text-center">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {items.map(item => (
                    <tr key={item.product_id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-200">{item.name}</td>
                      <td className="px-4 py-3 text-zinc-300 text-right">₹{item.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                          className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 focus:outline-none focus:border-blue-500 text-center text-zinc-200"
                          min="1"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-100 text-right">₹{item.total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeItem(item.product_id)} className="text-zinc-500 hover:text-red-400 cursor-pointer p-1 rounded hover:bg-zinc-800 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-zinc-500 bg-zinc-950">
                        <p>No items added to bill yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit flex flex-col sticky top-0 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-zinc-100 border-b border-zinc-800 pb-4">Bill Summary</h2>

          <div className="space-y-4 text-sm mb-8 flex-1">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span className="text-zinc-200">₹{getSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Tax (%)</span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={taxPercentage === 0 ? '' : taxPercentage}
                  onChange={(e) => setTaxPercentage(Number(e.target.value) || 0)}
                  className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-center text-zinc-200 transition-all"
                  placeholder="0"
                  min="0"
                />
                <span className="text-zinc-200 min-w-[4rem] text-right">₹{getTax().toFixed(2)}</span>
              </div>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Items Total</span>
              <span className="text-zinc-200">{items.reduce((s, i) => s + i.quantity, 0)}</span>
            </div>
            <div className="border-t border-zinc-800 pt-4 flex justify-between font-bold text-lg mt-4">
              <span className="text-zinc-100">Grand Total</span>
              <span className="text-blue-500 text-xl tracking-tight">₹{getGrandTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-3">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMode('Cash')}
                  className={`py-3 rounded-lg font-medium transition-all cursor-pointer border ${paymentMode === 'Cash' ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                >Cash</button>
                <button
                  onClick={() => setPaymentMode('UPI')}
                  className={`py-3 rounded-lg font-medium transition-all cursor-pointer border ${paymentMode === 'UPI' ? 'bg-indigo-600 border-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                >UPI</button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={isSubmitting || !isFormValid}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all flex justify-center items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handlePrintAndSave}
                disabled={isSubmitting || !isFormValid}
                className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-all flex justify-center items-center gap-2 cursor-pointer shadow-lg hover:shadow-emerald-500/25"
              >
                <Printer className="w-5 h-5" />
                {isSubmitting ? 'Printing...' : 'Print & Save'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
