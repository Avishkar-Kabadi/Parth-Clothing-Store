import { useState, useEffect, useMemo } from 'react';
import type { ProductDocType } from '../lib/database';
import { getDatabase } from '../lib/database';
import { Package, Trash2, Plus, Search } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState<ProductDocType[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCat, setNewProductCat] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let pSub: any;
    getDatabase().then(db => {
      pSub = db.products.find().$.subscribe(docs => setProducts(docs.map(d => d.toJSON())));
    });
    return () => pSub?.unsubscribe();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductCat.trim()) return;
    try {
      const db = await getDatabase();
      await db.products.insert({
        id: Date.now().toString(),
        name: newProductName.trim(),
        category: newProductCat.trim()
      });
      setNewProductName('');
      setNewProductCat('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const db = await getDatabase();
    const product = await db.products.findOne(id).exec();
    if (product) {
      await product.remove();
    }
  };

  // Sort by category, then by name
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const catCompare = a.category.localeCompare(b.category);
        if (catCompare !== 0) return catCompare;
        return a.name.localeCompare(b.name);
      });
  }, [products, searchQuery]);

  return (
    <div className="flex flex-col h-full space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col flex-1 min-h-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-zinc-100">
            <Package className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold">Manage Products</h2>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-100 transition-colors text-sm w-full md:w-64"
            />
          </div>
        </div>

        <form onSubmit={handleAddProduct} className="flex flex-col md:flex-row gap-4 mb-8 p-5 bg-zinc-950/40 border border-zinc-800/60 rounded-xl">
          <input 
            type="text" 
            placeholder="Product Name" 
            value={newProductName}
            onChange={e => setNewProductName(e.target.value)}
            className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-100 transition-colors"
          />
          <input 
            type="text" 
            placeholder="Category (e.g. Shirts, Jeans)" 
            value={newProductCat}
            onChange={e => setNewProductCat(e.target.value)}
            className="md:w-64 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-100 transition-colors"
          />
          <button type="submit" disabled={!newProductName.trim() || !newProductCat.trim()} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm font-medium">
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </form>

        <div className="flex-1 overflow-auto border border-zinc-800 rounded-lg bg-zinc-950">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900/90 text-zinc-400 sticky top-0 border-b border-zinc-800 backdrop-blur-sm z-10">
              <tr>
                <th className="px-6 py-4 font-medium">Product Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 w-16 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredAndSortedProducts.map(p => (
                <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-4 text-zinc-200 font-medium">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteProduct(p.id)} 
                      className="text-zinc-500 hover:text-red-400 p-2 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAndSortedProducts.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <Package className="w-8 h-8 opacity-20" />
                      <p>No products found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
