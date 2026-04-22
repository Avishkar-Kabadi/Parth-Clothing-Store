import { useState, useEffect } from 'react';
import type { UserDocType } from '../lib/database';
import { getDatabase } from '../lib/database';
import { Shield, Trash2, Plus } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<UserDocType[]>([]);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    let uSub: any;
    getDatabase().then(db => {
      uSub = db.users.find().$.subscribe(docs => setUsers(docs.map(d => d.toJSON())));
    });
    return () => {
      uSub?.unsubscribe();
    };
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) return;
    
    // Check for unique username
    if (users.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
        alert('Username already exists! Please choose a different one.');
        return;
    }

    try {
      const db = await getDatabase();
      await db.users.insert({
        id: Date.now().toString(),
        username: newUsername.trim(),
        password_hash: newPassword,
        role: 'staff'
      });
      setNewUsername('');
      setNewPassword('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const db = await getDatabase();
    const user = await db.users.findOne(id).exec();
    if (user && user.role !== 'admin') {
      await user.remove();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-8 max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm flex flex-col flex-1 min-h-[400px]">
        <div className="flex items-center gap-2 mb-6 text-zinc-100">
          <Shield className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-bold">Manage Users</h2>
        </div>

        <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-4 mb-8 p-5 bg-zinc-950/40 border border-zinc-800/60 rounded-xl">
          <input 
            type="text" 
            placeholder="New Username" 
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100 transition-colors"
          />
          <input 
            type="password" 
            placeholder="Set Password" 
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100 transition-colors"
          />
          <button type="submit" disabled={!newUsername.trim() || !newPassword} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm font-medium">
            <Plus className="w-5 h-5" />
            Add Staff
          </button>
        </form>

        <div className="flex-1 overflow-auto border border-zinc-800 rounded-lg bg-zinc-950">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900/90 text-zinc-400 sticky top-0 border-b border-zinc-800 backdrop-blur-sm z-10">
              <tr>
                <th className="px-6 py-4 font-medium">Username</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 w-16 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-4 text-zinc-200 font-medium">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.role !== 'admin' ? (
                      <button 
                        onClick={() => handleDeleteUser(u.id)} 
                        className="text-zinc-500 hover:text-red-400 p-2 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-zinc-600 text-xs italic px-2">Protected</span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <Shield className="w-8 h-8 opacity-20" />
                      <p>No users found.</p>
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
