import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, User, Building2 } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { useAuth } from '../context/AuthContext';
import { usePortal } from '../context/PortalContext';
import { UserRole } from '../types';

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'employer' ? 'employer' : 'job_seeker';

  const { registerWithEmail, loginWithGoogle } = useAuth();
  const { showToast } = usePortal();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await registerWithEmail(name.trim(), email.trim(), password, role);
      showToast('Account created! A verification email has been sent.', 'success');
      navigate(role === 'employer' ? '/employer' : '/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      if (msg.includes('operation-not-allowed')) {
        setError(
          'Email/Password registration is not yet enabled in Firebase Console (Authentication > Sign-in method). Please use Google Sign-Up below or enable Email/Password in Firebase Console.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle(role);
      showToast('Account ready!', 'success');
      navigate(role === 'employer' ? '/employer' : '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <PageMeta
        title="Register – Apna Role"
        description="Create a free Job Seeker or Employer account on Apna Role."
      />

      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-7 sm:p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0B1B3B]">
            Create Your Apna Role Account
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Choose your account type to get started.
          </p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('job_seeker')}
            className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
              role === 'job_seeker'
                ? 'border-blue-700 bg-blue-50/70 text-[#0B1B3B]'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className="w-5 h-5 text-blue-700 mb-1.5" />
            <p className="text-xs font-bold">Job Seeker</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Find jobs &amp; build resumes</p>
          </button>
          <button
            type="button"
            onClick={() => setRole('employer')}
            className={`p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
              role === 'employer'
                ? 'border-blue-700 bg-blue-50/70 text-[#0B1B3B]'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-5 h-5 text-blue-700 mb-1.5" />
            <p className="text-xs font-bold">Employer / Recruiter</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Post jobs &amp; hire talent</p>
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignUp}
          className="w-full py-2.5 px-4 border border-slate-300 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-800 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          Continue with Google as {role === 'employer' ? 'Employer' : 'Job Seeker'}
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200" />
          <span className="shrink mx-3 text-xs text-slate-400">or register with email</span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Priya Verma"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@example.com"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-xs text-center text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-700 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
