import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);
  const clearCart = useCartStore(state => state.clearCart); // 👈 add this
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/auth/login', { identifier, password });
      clearCart();
      useCartStore.persist.setOptions({ name: `cart-storage-${res.data.user.id}` });
      await useCartStore.persist.rehydrate();
      setUser(res.data.user, res.data.token);
      navigate('/home');
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 ">
      <div className="bg-white p-8 rounded shadow-md w-96 rounded-3xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Email or Phone" className="w-full border p-2 mb-4 rounded" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full border p-2 mb-4 rounded" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="w-full bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700">Login</button>
        </form>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        <p className="text-center text-sm mt-4">Don't have an account? <Link to="/register" className="text-blue-600">Register</Link></p>
      </div>
    </div>
  );
}