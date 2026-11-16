import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle2, Star } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { usePortal } from '../context/PortalContext';

export function CompaniesPage() {
  const { companies, jobs, reviews } = usePortal();
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const industries = useMemo(
    () => Array.from(new Set(companies.map((c) => c.industry))),
    [companies]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      if (q && !`${c.name} ${c.industry} ${c.location}`.toLowerCase().includes(q)) return false;
      if (industryFilter && c.industry !== industryFilter) return false;
      return true;
    });
  }, [companies, search, industryFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageMeta
        title="Hiring Companies in India – Apna Role"
        description="Explore verified Indian startups, enterprise IT leaders, and public-sector organizations hiring on Apna Role."
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">
            Explore Hiring Companies
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Read verified employee reviews, explore company culture, and discover open positions.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="text-sm focus:outline-none"
            />
          </div>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            aria-label="Filter by Industry"
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((co) => {
          const openJobs = jobs.filter((j) => j.companyId === co.id && j.status === 'approved').length;
          const coReviews = reviews.filter((r) => r.companyId === co.id);
          const avgRating =
            coReviews.length > 0
              ? coReviews.reduce((s, r) => s + r.rating, 0) / coReviews.length
              : co.rating || 4.5;

          return (
            <Link
              key={co.id}
              to={`/companies/${co.id}`}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-colors flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 font-bold flex items-center justify-center shrink-0">
                      {co.logoUrl ? (
                        <img
                          src={co.logoUrl}
                          alt={co.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        co.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-[#0B1B3B] flex items-center gap-1.5">
                        {co.name}
                        {co.verified && <CheckCircle2 className="w-4 h-4 text-blue-700" />}
                      </h2>
                      <p className="text-xs text-slate-500">{co.industry}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600 line-clamp-3">{co.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 tabular-nums">
                <span>{co.location}</span>
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#0B1B3B]">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {avgRating.toFixed(1)} · {openJobs} open roles
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
