import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { usePortal } from '../context/PortalContext';

export function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <PageMeta
        title="About Us – Apna Role"
        description="Learn about Apna Role’s mission to connect Indian talent with verified employers, internships, and AI-powered career tools."
      />

      <div className="space-y-4">
        <p className="text-sm font-semibold text-blue-700">
          सही नौकरी, सही मौका – अपना रोल के साथ!
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0B1B3B]">
          Empowering Every Career Across India
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Apna Role is an Indian employment and career development platform built to bridge the gap between ambitious talent and transparent, verified hiring teams. Whether you are a college student seeking your first internship, a fresher preparing for campus interviews, or an experienced engineer exploring leadership roles, Apna Role brings discovery, resume crafting, and interview readiness together.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-lg font-bold text-[#0B1B3B]">01. Verified Employers</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Every organization profile and listing goes through safety checks and community reporting safeguards to protect candidates from misleading offers.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-lg font-bold text-[#0B1B3B]">02. Transparent Tracking</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            No black-hole applications. Candidates track every stage from Applied and Under Review to Shortlisted and Interview Scheduled in real time.
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-lg font-bold text-[#0B1B3B]">03. Practical AI Coaching</h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Server-secured AI tools assist with ATS keyword alignment, resume summaries, salary benchmarking in INR LPA, and mock interview evaluations.
          </p>
        </div>
      </div>

      <div className="bg-[#0B1B3B] text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src="/src/assets/images/avatar_recruiter_india_1794856687584.jpg"
            alt="Apna Role Talent Leadership"
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full object-cover border border-slate-600"
          />
          <div>
            <p className="font-display text-lg font-bold">Ready to take your next career step?</p>
            <p className="text-xs text-slate-300">Your Career. Your Opportunity. Your Future.</p>
          </div>
        </div>
        <Link
          to="/jobs"
          className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#0B1B3B] text-sm font-bold rounded-xl shrink-0"
        >
          Browse Opportunities
        </Link>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { showToast } = usePortal();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Candidate Support');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    showToast('Inquiry received! Our support desk will respond within 1 business day.', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <PageMeta
        title="Contact Us – Apna Role"
        description="Get in touch with Apna Role support for job seeker assistance, employer onboarding, or trust and safety inquiries."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">Contact Apna Role</h1>
            <p className="text-sm text-slate-600 mt-2">
              Questions about hiring on Apna Role, account verification, or reporting suspicious listings? Reach out to our Bengaluru &amp; NCR support desk.
            </p>
          </div>

          <div className="space-y-4 text-sm text-slate-700">
            <p className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-blue-700" /> support@apnarole.in
            </p>
            <p className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-blue-700" /> +91 80 4120 9800 (Mon–Sat, 9:30 AM – 6:30 PM IST)
            </p>
            <p className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-blue-700" /> Indiranagar, Bengaluru, Karnataka 560038
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          {submitted ? (
            <div className="py-10 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h2 className="font-display text-xl font-bold text-[#0B1B3B]">Message Received</h2>
              <p className="text-sm text-slate-600">
                Thank you, {name}. Our team has logged your inquiry under {topic}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setName('');
                  setEmail('');
                  setMessage('');
                }}
                className="text-xs font-semibold text-blue-700 hover:underline cursor-pointer"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white"
                >
                  <option>Candidate Support</option>
                  <option>Employer &amp; Hiring Partnerships</option>
                  <option>Trust &amp; Safety / Fake Job Report</option>
                  <option>Technical Feedback</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  minLength={10}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl cursor-pointer"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <PageMeta
        title="Privacy Policy – Apna Role"
        description="How Apna Role collects, protects, and manages candidate and employer data."
      />
      <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">Privacy Policy</h1>
      <p className="text-xs text-slate-500">Last updated: November 2026</p>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 text-sm text-slate-700 leading-relaxed">
        <section>
          <h2 className="font-display text-base font-bold text-[#0B1B3B] mb-1.5">1. Information We Collect</h2>
          <p>
            When you create an Apna Role account, we collect your name, email address, role preference (Job Seeker or Employer), optional phone number, skills, education, work history, and uploaded resumes so recruiters can evaluate your applications.
          </p>
        </section>
        <section>
          <h2 className="font-display text-base font-bold text-[#0B1B3B] mb-1.5">2. PII Protection &amp; Access Controls</h2>
          <p>
            Personal profile data is isolated behind strict database security rules. Only you and authorized platform administrators can view your full account record. Employers only see candidate details you explicitly submit in an application.
          </p>
        </section>
        <section>
          <h2 className="font-display text-base font-bold text-[#0B1B3B] mb-1.5">3. AI Features &amp; Data Handling</h2>
          <p>
            Requests sent to the AI Resume Builder, Career Assistant, and Mock Interview tools are routed securely through server-side endpoints. We never sell personal resumes or contact details to third-party brokers.
          </p>
        </section>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <PageMeta
        title="Terms & Conditions – Apna Role"
        description="Terms of service governing job seekers, recruiters, and listings on Apna Role."
      />
      <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">Terms &amp; Conditions</h1>
      <p className="text-xs text-slate-500">Last updated: November 2026</p>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 text-sm text-slate-700 leading-relaxed">
        <section>
          <h2 className="font-display text-base font-bold text-[#0B1B3B] mb-1.5">1. Genuine Opportunities Policy</h2>
          <p>
            Employers must only publish authentic employment or internship openings. Charging job seekers registration fees, interview deposits, or equipment security fees is strictly prohibited and results in immediate account suspension.
          </p>
        </section>
        <section>
          <h2 className="font-display text-base font-bold text-[#0B1B3B] mb-1.5">2. Candidate Conduct</h2>
          <p>
            Job seekers agree to submit accurate academic, experience, and contact information in profiles and applications.
          </p>
        </section>
        <section>
          <h2 className="font-display text-base font-bold text-[#0B1B3B] mb-1.5">3. Moderation &amp; Safety</h2>
          <p>
            Apna Role reserves the right to review, reject, or remove reported listings, unverified companies, or abusive reviews to maintain a trustworthy career marketplace.
          </p>
        </section>
      </div>
    </div>
  );
}
