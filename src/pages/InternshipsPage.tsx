import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, CheckCircle2, Search, RotateCcw } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { usePortal } from '../context/PortalContext';
import { useAuth } from '../context/AuthContext';
import { INDIAN_LOCATIONS, Internship } from '../types';

export function InternshipsPage() {
  const {
    internships,
    categories,
    isJobSaved,
    toggleSaveJob,
    applyToListing,
    myApplications,
    showToast,
  } = usePortal();
  const { firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [queryText, setQueryText] = useState('');
  const [paidFilter, setPaidFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [workModeFilter, setWorkModeFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minStipend, setMinStipend] = useState(0);

  const [applyingFor, setApplyingFor] = useState<Internship | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const approved = useMemo(
    () => internships.filter((i) => i.status === 'approved'),
    [internships]
  );

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    return approved.filter((item) => {
      if (q) {
        const hay = `${item.title} ${item.companyName} ${(item.skills || []).join(' ')} ${item.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (paidFilter === 'paid' && !item.isPaid) return false;
      if (paidFilter === 'unpaid' && item.isPaid) return false;
      if (workModeFilter && item.workMode !== workModeFilter) return false;
      if (durationFilter && !item.duration.toLowerCase().includes(durationFilter.toLowerCase())) return false;
      if (locationFilter && item.location !== locationFilter) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (minStipend > 0 && item.stipend < minStipend) return false;
      return true;
    });
  }, [
    approved,
    queryText,
    paidFilter,
    workModeFilter,
    durationFilter,
    locationFilter,
    categoryFilter,
    minStipend,
  ]);

  const resetFilters = () => {
    setQueryText('');
    setPaidFilter('all');
    setWorkModeFilter('');
    setDurationFilter('');
    setLocationFilter('');
    setCategoryFilter('');
    setMinStipend(0);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingFor) return;
    if (!firebaseUser) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await applyToListing({
        listingId: applyingFor.id,
        listingType: 'internship',
        title: applyingFor.title,
        companyId: applyingFor.companyId,
        companyName: applyingFor.companyName,
        employerId: applyingFor.employerId,
        coverNote: coverNote.trim(),
      });
      setApplyingFor(null);
      setCoverNote('');
      showToast('Internship application submitted!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to apply.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageMeta
        title="Internships for Students & Freshers – Apna Role"
        description="Apply to paid, unpaid, remote, and work-from-home internships for college students and freshers across India."
      />

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">
          Internship Portal for Students &amp; Freshers
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Discover paid stipends, remote work-from-home projects, and Pre-Placement Offer (PPO) internships.
        </p>

        {/* Quick Segmented Filters */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', label: 'All Internships' },
              { id: 'paid', label: 'Paid Internships' },
              { id: 'unpaid', label: 'Unpaid / Certificate' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPaidFilter(t.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                paidFilter === t.id
                  ? 'bg-[#0B1B3B] text-white border-[#0B1B3B]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setWorkModeFilter(workModeFilter === 'Remote' ? '' : 'Remote')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
              workModeFilter === 'Remote'
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Remote / Work From Home
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-display text-sm font-bold text-[#0B1B3B]">Filters</span>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Skills or Role</label>
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="React, Python, Figma..."
                className="w-full text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">All Locations</option>
              {INDIAN_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Any Duration</option>
              <option value="2 Months">2 Months</option>
              <option value="3 Months">3 Months</option>
              <option value="6 Months">6 Months</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 tabular-nums">
              Min Monthly Stipend: {minStipend === 0 ? 'Any' : `₹${minStipend.toLocaleString('en-IN')}+`}
            </label>
            <input
              type="range"
              min={0}
              max={30000}
              step={5000}
              value={minStipend}
              onChange={(e) => setMinStipend(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
          </div>
        </aside>

        <div className="lg:col-span-9">
          {filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-sm text-slate-600">No internships matched your current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filtered.map((item) => {
                const saved = isJobSaved(item.id);
                const applied = myApplications.some((a) => a.jobId === item.id);
                return (
                  <article
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-blue-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-display text-base font-bold text-[#0B1B3B]">
                            {item.title}
                          </h2>
                          <p className="text-sm font-medium text-slate-600 mt-0.5">
                            {item.companyName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            toggleSaveJob({
                              id: item.id,
                              listingType: 'internship',
                              title: item.title,
                              companyName: item.companyName,
                              location: item.location,
                              salaryDisplay: item.stipendDisplay,
                            })
                          }
                          aria-label="Save internship"
                          className={`p-2 rounded-lg border cursor-pointer ${
                            saved
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'border-slate-200 text-slate-500'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 tabular-nums">
                        <span className="font-semibold text-blue-700">{item.stipendDisplay}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.duration}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.location}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.workMode}</span>
                      </div>

                      <p className="mt-2.5 text-sm text-slate-600 line-clamp-2">{item.description}</p>
                      {item.skills && item.skills.length > 0 && (
                        <p className="mt-2 text-xs text-slate-500">
                          Skills: {item.skills.join(' · ')}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 tabular-nums">
                        Apply by {item.deadline || 'Rolling'}
                      </span>
                      {applied ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" /> Applied
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!firebaseUser) navigate('/login');
                            else setApplyingFor(item);
                          }}
                          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Apply Directly
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {applyingFor && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleApply}
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4"
          >
            <h2 className="font-display text-xl font-bold text-[#0B1B3B]">
              Apply for {applyingFor.title}
            </h2>
            <p className="text-xs text-slate-600">
              Applicant: {userProfile?.displayName} ({userProfile?.email})
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Why should {applyingFor.companyName} select you?
              </label>
              <textarea
                rows={4}
                required
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Share your college coursework, GitHub/portfolio projects, and availability..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApplyingFor(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
