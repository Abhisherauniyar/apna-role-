import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, BellPlus, RotateCcw } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { JobCard } from '../components/JobCard';
import { usePortal } from '../context/PortalContext';
import { useAuth } from '../context/AuthContext';
import { INDIAN_LOCATIONS } from '../types';

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { jobs, categories, companies, createJobAlert, showToast } = usePortal();
  const { firebaseUser } = useAuth();

  const [queryText, setQueryText] = useState(searchParams.get('q') || '');
  const [selectedLoc, setSelectedLoc] = useState(searchParams.get('loc') || '');
  const [selectedCat, setSelectedCat] = useState(searchParams.get('cat') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedMode, setSelectedMode] = useState(searchParams.get('mode') || '');
  const [selectedExp, setSelectedExp] = useState(searchParams.get('exp') || '');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [minSalaryLpa, setMinSalaryLpa] = useState<number>(0);
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'salary_desc' | 'relevant'>('latest');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    setQueryText(searchParams.get('q') || '');
    setSelectedLoc(searchParams.get('loc') || '');
    setSelectedCat(searchParams.get('cat') || '');
    setSelectedType(searchParams.get('type') || '');
    setSelectedMode(searchParams.get('mode') || '');
    setSelectedExp(searchParams.get('exp') || '');
  }, [searchParams]);

  const approvedJobs = useMemo(
    () => jobs.filter((j) => j.status === 'approved'),
    [jobs]
  );

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const list = approvedJobs.filter((job) => {
      if (q) {
        const hay = `${job.title} ${job.companyName} ${(job.skills || []).join(' ')} ${job.category} ${job.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedLoc && job.location !== selectedLoc) return false;
      if (selectedCat && job.category !== selectedCat) return false;
      if (selectedType && job.jobType !== selectedType) return false;
      if (selectedMode && job.workMode !== selectedMode) return false;
      if (selectedExp && job.experienceLevel !== selectedExp) return false;
      if (selectedCompany && job.companyId !== selectedCompany) return false;
      if (minSalaryLpa > 0 && job.salaryMax < minSalaryLpa * 100000) return false;
      if (dateFilter !== 'all' && job.createdAt && typeof (job.createdAt as { toMillis?: () => number }).toMillis === 'function') {
        const ms = (job.createdAt as { toMillis: () => number }).toMillis();
        const days = (Date.now() - ms) / (1000 * 60 * 60 * 24);
        if (dateFilter === '7d' && days > 7) return false;
        if (dateFilter === '30d' && days > 30) return false;
      }
      return true;
    });

    if (sortBy === 'salary_desc') {
      list.sort((a, b) => b.salaryMax - a.salaryMax);
    } else if (sortBy === 'relevant' && q) {
      list.sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(q) ? 1 : 0;
        const bTitle = b.title.toLowerCase().includes(q) ? 1 : 0;
        return bTitle - aTitle;
      });
    } else {
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return list;
  }, [
    approvedJobs,
    queryText,
    selectedLoc,
    selectedCat,
    selectedType,
    selectedMode,
    selectedExp,
    selectedCompany,
    minSalaryLpa,
    dateFilter,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedJobs = filtered.slice((page - 1) * pageSize, page * pageSize);

  const resetFilters = () => {
    setQueryText('');
    setSelectedLoc('');
    setSelectedCat('');
    setSelectedType('');
    setSelectedMode('');
    setSelectedExp('');
    setSelectedCompany('');
    setMinSalaryLpa(0);
    setDateFilter('all');
    setPage(1);
    setSearchParams({});
  };

  const handleSaveAlert = async () => {
    if (!firebaseUser) {
      showToast('Please sign in to create a job alert.', 'info');
      return;
    }
    const kw = queryText.trim() || selectedCat || 'Software & Corporate Jobs';
    await createJobAlert({
      keyword: kw,
      location: selectedLoc,
      category: selectedCat,
      frequency: 'Daily',
    });
    showToast(`Job alert created for "${kw}".`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageMeta
        title="Find Jobs in India – Apna Role Job Search"
        description="Search full-time, part-time, remote, fresher, and government jobs across India with salary, location, and skill filters."
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">
            Find Jobs Across India
          </h1>
          <p className="text-sm text-slate-600 mt-1 tabular-nums">
            Showing {filtered.length} verified {filtered.length === 1 ? 'opportunity' : 'opportunities'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSaveAlert}
            className="inline-flex items-center gap-2 px-4 py-2 border border-blue-200 bg-blue-50 text-blue-800 text-xs font-semibold rounded-lg hover:bg-blue-100 cursor-pointer"
          >
            <BellPlus className="w-4 h-4" />
            Create Job Alert
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'latest' | 'salary_desc' | 'relevant')}
            aria-label="Sort Jobs"
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
          >
            <option value="latest">Sort: Latest Jobs</option>
            <option value="salary_desc">Sort: Salary High to Low</option>
            <option value="relevant">Sort: Most Relevant</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-3 space-y-5 bg-white border border-slate-200 rounded-xl p-5 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-[#0B1B3B]">
              <SlidersHorizontal className="w-4 h-4 text-blue-700" />
              Filter Jobs
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Keyword / Skill / Role
            </label>
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={queryText}
                onChange={(e) => {
                  setQueryText(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. React, Python, HR"
                className="w-full text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category
            </label>
            <select
              value={selectedCat}
              onChange={(e) => {
                setSelectedCat(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Location
            </label>
            <select
              value={selectedLoc}
              onChange={(e) => {
                setSelectedLoc(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">All Locations</option>
              {INDIAN_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Experience Level
            </label>
            <select
              value={selectedExp}
              onChange={(e) => {
                setSelectedExp(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Any Experience</option>
              <option value="Fresher">Fresher</option>
              <option value="1-3 Years">1-3 Years</option>
              <option value="3-5 Years">3-5 Years</option>
              <option value="5+ Years">5+ Years</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Job Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">All Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Internship">Internship</option>
              <option value="Government">Government</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Work Mode
            </label>
            <select
              value={selectedMode}
              onChange={(e) => {
                setSelectedMode(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">All Modes</option>
              <option value="Remote">Remote / Work From Home</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 tabular-nums">
              Minimum Salary: {minSalaryLpa === 0 ? 'Any' : `₹${minSalaryLpa}+ LPA`}
            </label>
            <input
              type="range"
              min={0}
              max={25}
              step={3}
              value={minSalaryLpa}
              onChange={(e) => {
                setMinSalaryLpa(Number(e.target.value));
                setPage(1);
              }}
              className="w-full accent-blue-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Date Posted
            </label>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value as 'all' | '7d' | '30d');
                setPage(1);
              }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="all">Anytime</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </aside>

        {/* Job Results */}
        <div className="lg:col-span-9 space-y-4">
          {pagedJobs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
                No jobs matched your filters
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Try broadening your location, salary threshold, or search keyword.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {pagedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pt-6 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-medium text-slate-600 px-3 tabular-nums">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-lg bg-white disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
