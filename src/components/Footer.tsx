import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export function Footer() {
  return (
    <footer className="bg-[#0B1B3B] text-slate-300 border-t border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <BrandLogo className="w-8 h-8" />
              <span className="font-display text-lg font-bold text-white tracking-tight">
                Apna Role
              </span>
            </Link>
            <p className="text-sm text-cyan-300 font-medium">
              सही नौकरी, सही मौका – अपना रोल के साथ!
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your Career. Your Opportunity. Your Future. India’s integrated job discovery, internship, AI resume, and interview readiness platform.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">For Job Seekers</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/jobs" className="hover:text-white transition-colors">Find Jobs</Link></li>
              <li><Link to="/internships" className="hover:text-white transition-colors">Internships</Link></li>
              <li><Link to="/companies" className="hover:text-white transition-colors">Explore Companies</Link></li>
              <li><Link to="/resume-builder" className="hover:text-white transition-colors">AI Resume Builder</Link></li>
              <li><Link to="/career-guidance" className="hover:text-white transition-colors">AI Career Guidance</Link></li>
              <li><Link to="/interview-prep" className="hover:text-white transition-colors">Interview Preparation</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Portals &amp; Employers</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Job Seeker Dashboard</Link></li>
              <li><Link to="/employer" className="hover:text-white transition-colors">Employer Dashboard</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Admin Console</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register Account</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Company &amp; Legal</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Apna Role. All rights reserved.</p>
          <p>Your Career. Your Opportunity. Your Future.</p>
        </div>
      </div>
    </footer>
  );
}
