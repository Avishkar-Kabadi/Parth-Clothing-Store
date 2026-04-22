import { useState, useEffect } from 'react';
import { getDatabase } from '../lib/database';
import type { UserDocType } from '../lib/database';
import { useAuthStore } from '../store/useStore';
import { Lock, User } from 'lucide-react';

export default function Login() {
  const [isSetup, setIsSetup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore(state => state.login);

  useEffect(() => {
    const checkAdmin = async () => {
      const db = await getDatabase();
      const admin = await db.users.findOne({ selector: { role: 'admin' } }).exec();
      if (!admin) {
        setIsSetup(true);
      }
    };
    checkAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const db = await getDatabase();

    if (isSetup) {
      if (!username || !password) return setError('Fill all fields');
      const newUser: UserDocType = {
        id: Date.now().toString(),
        username,
        password_hash: password,
        role: 'admin'
      };
      await db.users.insert(newUser);
      login(newUser);
    } else {
      const user = await db.users.findOne({ selector: { username, password_hash: password } }).exec();
      if (user) {
        login(user.toJSON());
      } else {
        setError('Invalid credentials');
      }
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-zinc-100">
          {isSetup ? 'Admin Setup' : 'Staff Login'}
        </h2>
        
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm text-center">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Username" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100 transition-all"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100 transition-all"
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex justify-center items-center cursor-pointer"
          >
            {isSetup ? 'Create Admin Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
