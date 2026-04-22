import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDatabase } from '../lib/database';
import type { SaleDocType, ProductDocType } from '../lib/database';
import { ArrowLeft, User, Phone, CheckCircle2, Package, Trash2, Plus, AlertCircle } from 'lucide-react';

export default function EditLedgerRecord() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<SaleDocType | null>(null);
    const [products, setProducts] = useState<ProductDocType[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // State for adding a new item manually
    const [selectedProductId, setSelectedProductId] = useState('');
    const [manualPrice, setManualPrice] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [error, setError] = useState('');

    useEffect(() => {
        const init = async () => {
            if (!id) return;
            const db = await getDatabase();
            const productDocs = await db.products.find().exec();
            setProducts(productDocs.map(p => p.toJSON() as ProductDocType));

            const doc = await db.sales.findOne(id).exec();
            if (doc) {
                setFormData(JSON.parse(JSON.stringify(doc.toJSON())));
            }
            setLoading(false);
        };
        init();
    }, [id]);

    const updateItemsAndTotals = (newItems: any[]) => {
        if (!formData) return;
        const subtotal = newItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0);

        const percentage = formData.subtotal > 0 ? (formData.tax / formData.subtotal) : 0;
        const tax = subtotal * percentage;
        const grand_total = subtotal + tax;

        setFormData({ ...formData, items: newItems, subtotal, tax, grand_total });
    };

    const updateTaxPercentage = (percentage: number) => {
        if (!formData) return;
        const subtotal = formData.items.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
        const tax = subtotal * (percentage / 100);
        const grand_total = subtotal + tax;
        setFormData({ ...formData, subtotal, tax, grand_total });
    };

    const handleItemChange = (
        index: number,
        field: 'product_id' | 'name' | 'price' | 'quantity' | 'total',
        value: any
    ) => {
        if (!formData) return;
        const newItems = [...formData.items];
        const item = { ...newItems[index] };

        if (field === 'product_id') {
            const selectedProd = products.find(p => p.id === value);
            if (selectedProd) {
                item.product_id = selectedProd.id;
                item.name = selectedProd.name;
            }
        } else {
            (item as any)[field] = value;
        }

        item.total = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        newItems[index] = item;
        updateItemsAndTotals(newItems);
    };

    const handleAddNewItem = (e: React.MouseEvent) => {
        e.preventDefault();
        setError('');

        // 1. ADD THIS GUARD: If formData is null, stop execution.
        if (!formData) return;

        if (!selectedProductId) return setError('Select a product first.');
        const p = parseFloat(manualPrice);
        const q = parseInt(quantity);

        if (isNaN(p) || p <= 0) return setError('Enter a valid price.');
        if (isNaN(q) || q <= 0) return setError('Quantity must be at least 1.');

        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;

        const newItem = {
            product_id: product.id,
            name: product.name,
            price: p,
            quantity: q,
            total: p * q
        };

        updateItemsAndTotals([...formData.items, newItem]);

        setSelectedProductId('');
        setManualPrice('');
        setQuantity('1');
    };

    const removeItem = (index: number) => {
        if (!formData) return;
        const newItems = formData.items.filter((_, i) => i !== index);
        updateItemsAndTotals(newItems);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData || !id) return;

        // Final Validations
        if (!formData.customer_name.trim()) return alert('Customer name is required.');
        if (!/^\d{10}$/.test(formData.customer_phone)) return alert('Enter a valid 10-digit phone number.');
        if (formData.items.length === 0) return alert('Bill must have at least one item.');

        setIsSaving(true);
        try {
            const db = await getDatabase();
            const doc = await db.sales.findOne(id).exec();
            if (doc) {
                await doc.patch({
                    customer_name: formData.customer_name.trim(),
                    customer_phone: formData.customer_phone.trim(),
                    payment_mode: formData.payment_mode,
                    items: formData.items,
                    subtotal: formData.subtotal,
                    tax: formData.tax,
                    grand_total: formData.grand_total
                });
                setTimeout(() => navigate(-1), 500);
            }
        } catch (error) {
            console.error("Update failed:", error);
            setIsSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div></div>;
    if (!formData) return <div className="min-h-screen bg-zinc-950 text-zinc-500 flex flex-col items-center justify-center gap-4"><p>Record not found.</p><button onClick={() => navigate(-1)} className="text-indigo-400 underline">Go Back</button></div>;

    return (
        <div className="flex-1 h-full w-full bg-zinc-950 overflow-y-auto overflow-x-hidden">

            <div className="p-4 md:p-8 lg:p-10 w-full min-h-full flex flex-col">

                <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
                    <button

                        onClick={() => navigate(-1)}

                        className="group flex items-center text-zinc-500 hover:text-zinc-200 transition-colors mb-6 w-fit"

                    >

                        <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={18} />

                        Back to Ledger

                    </button>

                    <div className="px-6 py-5 border-b  border-zinc-800 bg-zinc-900/50">
                        <h1 className="text-2xl font-bold text-white">Edit Sale Details</h1>
                        <div className='flex justify-between'>
                            <p className="text-xs text-zinc-500 mt-1 font-mono uppercase tracking-wider">ID: {id}</p>
                            <p className="text-xs text-zinc-500 mt-1 font-normal uppercase tracking-wider">Date: {formData?.timestamp}</p>

                        </div>




                    </div>

                    <form onSubmit={handleUpdate}>
                        <div className="p-8 space-y-7">
                            {/* Customer Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Customer Name</label>
                                    <input type="text" required value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 focus:border-indigo-500 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Contact Number</label>
                                    <input type="tel" value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 focus:border-indigo-500 outline-none transition-all" />
                                </div>
                            </div>

                            {/* Add New Item Section */}
                            <div className="space-y-4 p-5 bg-zinc-950/40 border border-zinc-800/60 rounded-2xl">
                                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Plus size={14} /> Add New Item</label>
                                <div className="flex flex-col md:flex-row gap-3">
                                    <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500">
                                        <option value="">Select Product...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <input type="number" placeholder="Price" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} className="md:w-32 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                                    <input type="number" placeholder="Qty" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="md:w-24 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none text-center focus:border-indigo-500" />
                                    <button type="button" onClick={handleAddNewItem} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center"><Plus size={20} /></button>
                                </div>
                                {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
                            </div>

                            {/* Items List */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Package size={14} /> Purchased Items</label>
                                <div className="space-y-3">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-3 items-center bg-zinc-950/20 p-4 rounded-2xl border border-zinc-800/50">
                                            <div className="col-span-12 md:col-span-6">
                                                <select value={item.product_id} onChange={(e) => handleItemChange(index, 'product_id', e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none">
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-4 md:col-span-2">
                                                <input type="number" value={item.price} onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none" />
                                            </div>
                                            <div className="col-span-4 md:col-span-2">
                                                <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none text-center" />
                                            </div>
                                            <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-2">
                                                <span className="text-sm font-bold text-zinc-200">₹{item.total.toFixed(2)}</span>
                                                <button type="button" onClick={() => removeItem(index)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary & Payment */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-zinc-800/50">
                                <div className="space-y-3">
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Payment Method</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Cash', 'UPI'].map((mode) => (
                                            <button key={mode} type="button" onClick={() => setFormData({ ...formData, payment_mode: mode as any })} className={`py-3 rounded-xl border text-sm font-bold transition-all ${formData.payment_mode === mode ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-zinc-950 border-zinc-800 text-zinc-500'}`}>{mode}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800 space-y-3">
                                    <div className="flex justify-between text-sm text-zinc-400"><span>Subtotal:</span><span>₹{formData.subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between items-center text-sm text-zinc-400">
                                        <span>Tax (%):</span>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={formData.subtotal > 0 ? Math.round((formData.tax / formData.subtotal) * 100) || '' : ''}
                                                onChange={(e) => updateTaxPercentage(Number(e.target.value) || 0)}
                                                className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center text-zinc-200 transition-all"
                                                placeholder="0"
                                                min="0"
                                            />
                                            <span className="text-zinc-200 min-w-[4rem] text-right">₹{formData.tax.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
                                        <span className="text-sm font-bold text-zinc-100 uppercase">Grand Total</span>
                                        <span className="text-2xl font-black text-indigo-400">₹{formData.grand_total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-zinc-950/50 border-t border-zinc-800 flex items-center justify-between">
                            <span className="text-xs text-zinc-600 italic">Created by: {formData.created_by}</span>
                            <button type="submit" disabled={isSaving || formData.items.length === 0} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-10 py-3 rounded-xl text-md font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-indigo-600/10">
                                {isSaving ? 'Saving...' : <><CheckCircle2 size={20} /> Update Record</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        // </div >
    );
}