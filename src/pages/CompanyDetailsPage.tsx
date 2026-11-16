import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Globe, MapPin, Star, Users } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { JobCard } from '../components/JobCard';
import { usePortal } from '../context/PortalContext';
import { useAuth } from '../context/AuthContext';

export function CompanyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companies, jobs, reviews, submitCompanyReview, showToast } = usePortal();
  const { firebaseUser } = useAuth();

  const company = useMemo(() => companies.find((c) => c.id === id), [companies, id]);
  const companyJobs = useMemo(
    () => jobs.filter((j) => j.companyId === id && j.status === 'approved'),
    [jobs, id]
  );
  const companyReviews = useMemo(
    () => reviews.filter((r) => r.companyId === id),
    [reviews, id]
  );

  const [roleTitle, setRoleTitle] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!company) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-[#0B1B3B]">Company Not Found</h1>
        <Link to="/companies" className="mt-4 inline-block text-sm font-semibold text-blue-700">
          Back to Companies
        </Link>
      </div>
    );
  }

  const avgRating =
    companyReviews.length > 0
      ? companyReviews.reduce((s, r) => s + r.rating, 0) / companyReviews.length
      : company.rating || 4.5;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await submitCompanyReview({
        companyId: company.id,
        roleTitle: roleTitle.trim() || 'Team Member',
        rating,
        title: reviewTitle.trim(),
        pros: pros.trim(),
        cons: cons.trim(),
      });
      setRoleTitle('');
      setReviewTitle('');
      setPros('');
      setCons('');
      showToast('Review published! Thank you for helping fellow candidates.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to post review.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <PageMeta
        title={`${company.name} – Careers, Reviews & Jobs | Apna Role`}
        description={company.description.slice(0, 155)}
      />

      <Link
        to="/companies"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0B1B3B]"
      >
        <ArrowLeft className="w-4 h-4" /> All Companies
      </Link>

      {/* Company Overview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-800 font-bold text-xl flex items-center justify-center shrink-0">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                company.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1B3B] flex items-center gap-2">
                {company.name}
                {company.verified && <CheckCircle2 className="w-5 h-5 text-blue-700" />}
              </h1>
              <p className="text-sm text-slate-600 mt-1">{company.industry}</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {company.location}
                </span>
                {company.size && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {company.size}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-700 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-center shrink-0">
            <div className="inline-flex items-center gap-1.5 font-mono text-2xl font-bold text-[#0B1B3B] tabular-nums">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              {avgRating.toFixed(1)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {companyReviews.length > 0 ? companyReviews.length : company.reviewCount || 0} ratings
            </p>
          </div>
        </div>

        <p className="mt-6 text-sm sm:text-base text-slate-700 leading-relaxed">
          {company.description}
        </p>
      </div>

      {/* Open Roles at Company */}
      <section>
        <h2 className="font-display text-2xl font-bold text-[#0B1B3B] mb-5">
          Open Roles at {company.name} ({companyJobs.length})
        </h2>
        {companyJobs.length === 0 ? (
          <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-xl p-6">
            No open positions at the moment.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {companyJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Employee Reviews & Write a Review */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-slate-200">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-2xl font-bold text-[#0B1B3B]">
            Company Reviews
          </h2>
          {companyReviews.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-600">
              No community reviews submitted yet. Be the first verified candidate or employee to share feedback.
            </div>
          ) : (
            companyReviews.map((r) => (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-[#0B1B3B]">{r.title}</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 tabular-nums">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {r.rating}/5
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {r.authorName} · {r.roleTitle || 'Employee'}
                </p>
                {r.pros && (
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-emerald-700">Pros:</span> {r.pros}
                  </p>
                )}
                {r.cons && (
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">Cons:</span> {r.cons}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={handleReviewSubmit}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4 h-fit"
        >
          <h3 className="font-display text-lg font-bold text-[#0B1B3B]">
            Write a Company Review
          </h3>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value={5}>5 Stars – Excellent</option>
              <option value={4}>4 Stars – Very Good</option>
              <option value={3}>3 Stars – Average</option>
              <option value={2}>2 Stars – Below Average</option>
              <option value={1}>1 Star – Poor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Your Role</label>
            <input
              type="text"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Review Headline</label>
            <input
              type="text"
              required
              minLength={3}
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="Great engineering mentorship and culture"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pros</label>
            <textarea
              rows={2}
              value={pros}
              onChange={(e) => setPros(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cons</label>
            <textarea
              rows={2}
              value={cons}
              onChange={(e) => setCons(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : firebaseUser ? 'Publish Review' : 'Sign in to Review'}
          </button>
        </form>
      </section>
    </div>
  );
}
