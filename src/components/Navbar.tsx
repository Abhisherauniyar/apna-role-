import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Building2,
  X,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../context/AuthContext';
import { usePortal } from '../context/PortalContext';

export function Navbar() {
  const { firebaseUser, userProfile, isAdmin, logout } = useAuth();
  const { notifications, markNotificationRead, showToast } = usePortal();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Find Jobs', to: '/jobs' },
    { label: 'Companies', to: '/companies' },
    { label: 'Internships', to: '/internships' },
    { label: 'Resume Builder', to: '/resume-builder' },
    { label: 'Career Guidance', to: '/career-guidance' },
  ];

  const handleLogout = async () => {
    setAccountOpen(false);
    setMobileOpen(false);
    await logout();
    showToast('Signed out cleanly.', 'info');
    navigate('/');
  };

  const dashboardRoute = isAdmin
    ? '/admin'
    : userProfile?.role === 'employer'
      ? '/employer'
      : '/dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600 rounded-lg"
        >
          <BrandLogo className="w-8 h-8 shrink-0" />
          <span className="font-display text-lg font-bold tracking-tight text-[#0B1B3B]">
            Apna Role
          </span>
        </Link>

        {/* Zone 2: Primary Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.map((item) => {
            const active =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  active
                    ? 'text-[#0B1B3B] border-blue-700 font-semibold'
                    : 'border-transparent hover:text-[#0B1B3B] hover:border-slate-300'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action / Account Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {!firebaseUser ? (
            <div className="hidden sm:flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-[#0B1B3B] px-3 py-2 whitespace-nowrap shrink-0"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 relative">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen((o) => !o);
                    setAccountOpen(false);
                  }}
                  aria-label="Notifications"
                  className="relative p-2 text-slate-600 hover:text-[#0B1B3B] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-blue-700 text-white text-[10px] font-bold rounded-full flex items-center justify-center tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <span className="text-sm font-semibold text-slate-900">
                        Notifications
                      </span>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {unreadCount} unread
                      </span>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        No notifications yet.
                      </p>
                    ) : (
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {notifications.slice(0, 6).map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              markNotificationRead(n.id);
                              setNotifOpen(false);
                              if (n.link) navigate(n.link);
                            }}
                            className={`w-full text-left py-2.5 px-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ${
                              !n.read ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <p className="text-xs font-semibold text-slate-900">
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                              {n.message}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Account Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAccountOpen((o) => !o);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded-lg text-sm font-medium text-slate-800 bg-white cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span className="max-w-[130px] truncate">
                    {userProfile?.displayName || firebaseUser.displayName || 'Account'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>
                {accountOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50">
                    <div className="px-3.5 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {userProfile?.displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {userProfile?.role === 'employer' ? 'Employer Account' : 'Job Seeker Account'}
                      </p>
                    </div>
                    <Link
                      to={dashboardRoute}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-700" />
                      My Dashboard
                    </Link>
                    {userProfile?.role === 'employer' && (
                      <Link
                        to="/employer"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Building2 className="w-4 h-4 text-blue-700" />
                        Recruiter Console
                      </Link>
                    )}
                    <Link
                      to="/interview-prep"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <LayoutDashboard className="w-4 h-4 text-cyan-700" />
                      Interview Prep
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <ShieldCheck className="w-4 h-4 text-blue-700" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle Menu"
            className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1">
          {navLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/interview-prep"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Interview Preparation
          </Link>
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {!firebaseUser ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-2.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-700"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="text-center py-2.5 text-sm font-semibold bg-blue-700 text-white rounded-lg"
                >
                  Register
                </Link>
              </div>
            ) : (
              <>
                <Link
                  to={dashboardRoute}
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center py-2.5 text-sm font-semibold bg-blue-700 text-white rounded-lg"
                >
                  Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-center py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg cursor-pointer"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
