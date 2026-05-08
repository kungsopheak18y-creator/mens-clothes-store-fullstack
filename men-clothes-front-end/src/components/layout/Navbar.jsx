import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ClipboardList, Menu, X, User, LogOut, UserPlus, Package } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import api from '../../lib/api';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, clearUser } = useAuthStore();
  const items = useCartStore((state) => state.items) || [];
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setAccountOpen(false);
    await api.post('/api/auth/logout');
    clearUser();
    // 👇 switch back to guest cart — isolates from next user
    useCartStore.persist.setOptions({ name: 'cart-storage-guest' });
    await useCartStore.persist.rehydrate();
    navigate('/login');
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Home', href: '/home', onClick: handleHomeClick },
    { label: 'Products', href: '/home#featured-products' },
    { label: 'Shop', href: '/shop' },
    { label: 'About', href: '/home#about' },
    { label: 'Contact', href: '/home#contact' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-premium' : 'bg-white shadow-sm'}`}>
      <div className="container-premium py-3 flex justify-between items-center">

        {/* Logo */}
        <Link to="/home" onClick={handleHomeClick} className="text-2xl font-mono font-medium tracking-tight text-brand-900">
          Men's Store
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onClick={link.onClick}
              className="text-brand-600 hover:text-brand-900 text-sm font-medium transition"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-6">
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="text-brand-600 hover:text-brand-900 text-sm font-medium hidden md:block">
              Admin
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="relative text-brand-600 hover:text-brand-900 transition">
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Account Icon + Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="relative text-brand-600 hover:text-brand-900 transition"
            >
              <User className="w-5 h-5" />
            </button>

            {accountOpen && (
              <div className="absolute right-0 mt-3 w-64 z-50" style={{
                background: '#fff',
                border: '1px solid #ececec',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                animation: 'dropIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}>
                <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .acct-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          font-size: 13px;
          color: #2a2a2a;
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: background 0.15s;
          background: transparent;
          width: 100%;
          border: none;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          border-radius: 8px;
        }
        .acct-link:hover { background: #f5f5f5; }
        .acct-icon {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: #f5f5f5;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .acct-link:hover .acct-icon { background: #ebebeb; }
        .acct-link svg { color: #555; }
        .acct-link.danger { color: #c0392b; }
        .acct-link.danger .acct-icon { background: #fff0f0; }
        .acct-link.danger svg { color: #c0392b; }
        .acct-link.danger:hover { background: #fff5f5; }
        .acct-divider { height: 1px; background: #f2f2f2; margin: 4px 8px; }
      `}</style>

                {user ? (
                  <>
                    {/* User identity block */}
                    <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f2f2f2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        {/* Avatar */}
                        <div style={{
                          width: 40, height: 40,
                          borderRadius: '10px',
                          background: '#f0f0f0',
                          color: '#1a1a1a',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 600,
                          letterSpacing: '0.05em',
                          flexShrink: 0,
                          border: '1px solid #e8e8e8',
                        }}>
                          {(user.firstName?.[0] || '').toUpperCase()}{(user.lastName?.[0] || '').toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1a', margin: 0, lineHeight: 1.3 }}>
                            {user.firstName} {user.lastName}
                          </p>
                          <p style={{
                            fontSize: 11, color: '#aaa', margin: '2px 0 0',
                            letterSpacing: '0.01em', whiteSpace: 'nowrap',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '8px' }}>
                      <Link to="/profile" onClick={() => setAccountOpen(false)} className="acct-link">
                        <span className="acct-icon"><User size={14} /></span>
                        My Profile
                      </Link>
                      <Link to="/orders" onClick={() => setAccountOpen(false)} className="acct-link">
                        <span className="acct-icon"><Package size={14} /></span>
                        My Orders
                      </Link>
                    </div>

                    <div className="acct-divider" />

                    {/* Logout */}
                    <div style={{ padding: '4px 8px 8px' }}>
                      <button onClick={handleLogout} className="acct-link danger">
                        <span className="acct-icon"><LogOut size={14} /></span>
                        Sign out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Guest header */}
                    <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f2f2f2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div style={{
                          width: 40, height: 40,
                          borderRadius: '10px',
                          background: '#f5f5f5',
                          border: '1px solid #e8e8e8',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <User size={16} color="#999" />
                        </div>
                        <div>
                          <p style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1a', margin: 0 }}>Welcome</p>
                          <p style={{ fontSize: 11, color: '#aaa', margin: '2px 0 0', lineHeight: 1.5 }}>
                            Sign in for a better experience
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Guest actions */}
                    <div style={{ padding: '8px' }}>
                      <Link to="/login" onClick={() => setAccountOpen(false)} className="acct-link">
                        <span className="acct-icon"><User size={14} /></span>
                        Sign in
                      </Link>
                      <Link to="/register" onClick={() => setAccountOpen(false)} className="acct-link">
                        <span className="acct-icon"><UserPlus size={14} /></span>
                        Create account
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-brand-600 hover:text-brand-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-brand-100 py-4 px-4 shadow-lg">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => { link.onClick?.(); setMobileMenuOpen(false); }}
                className="text-brand-700 hover:text-brand-900 py-2 text-sm"
              >
                {link.label}
              </Link>
            ))}
            {user?.role === 'ADMIN' && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="text-brand-700 hover:text-brand-900 py-2 text-sm">
                Admin
              </Link>
            )}
            <div className="border-t border-gray-100 pt-3 mt-1 flex flex-col gap-1">
              {user ? (
                <>
                  <div className="py-2">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                  </div>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="text-brand-700 hover:text-brand-900 py-2 text-sm">
                    My Profile
                  </Link>
                  <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="text-brand-700 hover:text-brand-900 py-2 text-sm">
                    My Orders
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="text-left text-red-500 hover:text-red-600 py-2 text-sm"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-brand-700 hover:text-brand-900 py-2 text-sm">
                    Sign in
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="text-brand-700 hover:text-brand-900 py-2 text-sm">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}