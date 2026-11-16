import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  ArrowRight,
  Building2,
  GraduationCap,
  FileText,
  Compass,
  Mic,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { JobCard } from '../components/JobCard';
import { usePortal } from '../context/PortalContext';
import { useAuth } from '../context/AuthContext';
import { INDIAN_LOCATIONS } from '../types';

type JobTab = 'latest' | 'wfh' | 'fresher' | 'government' | 'recent';

export function HomePage() {
  const navigate = useNavigate();
  const { jobs, companies, internships, categories, isUsingStarterPreview } = usePortal();
  const { userProfile, isAdmin } = useAuth();

  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [activeTab, setActiveTab] = useState<JobTab>('latest');

  const approvedJobs = useMemo(
    () => jobs.filter((j) => j.status === 'approved'),
    [jobs]
  );

  const approvedInternships = useMemo(
    () => internships.filter((i) => i.status === 'approved'),
    [internships]
  );

  const totalApplicationsCount = useMemo(
    () => approvedJobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0),
    [approvedJobs]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (location) params.set('loc', location);
    if (category) params.set('cat', category);
    navigate(`/jobs?${params.toString()}`);
  };

  const tabJobs = useMemo(() => {
    let list = [...approvedJobs];
    if (activeTab === 'wfh') {
      list = list.filter((j) => j.workMode === 'Remote');
    } else if (activeTab === 'fresher') {
      list = list.filter((j) => j.isFresher || j.experienceLevel === 'Fresher');
    } else if (activeTab === 'government') {
      list = list.filter((j) => j.isGovernment || j.jobType === 'Government' || j.category === 'Government Jobs');
    } else if (activeTab === 'recent') {
      list = [...approvedJobs].reverse();
    }
    return list.slice(0, 6);
  }, [approvedJobs, activeTab]);

  // Smart Job Matching for signed-in job seekers
  const matchedJobs = useMemo(() => {
    if (!userProfile?.skills || userProfile.skills.length === 0) return [];
    const userSkills = userProfile.skills.map((s) => s.toLowerCase());
    return approvedJobs
      .map((job) => {
        const jobSkills = (job.skills || []).map((s) => s.toLowerCase());
        const overlap = jobSkills.filter((s) => userSkills.some((u) => s.includes(u) || u.includes(s)));
        return { job, score: overlap.length };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.job);
  }, [approvedJobs, userProfile]);

  return (
    <div>
      <PageMeta
        title="Apna Role – Indian Job Portal, Internships & AI Career Platform"
        description="Sahi Naukri, Sahi Mauka – Apna Role Ke Saath! Discover jobs, internships, verified Indian companies, AI resume builder, and career coaching."
      />

      {/* Preview Catalog Notice (transparent when Firestore hasn't been seeded yet) */}
      {isUsingStarterPreview && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-blue-900">
            <span>
              Displaying Starter Indian Opportunities Catalog. Employers can register to post live roles{isAdmin ? ' or publish the starter catalog from the Admin Console.' : '.'}
            </span>
            {isAdmin && (
              <Link to="/admin" className="font-semibold underline hover:text-blue-700">
                Open Admin Console
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <p className="text-sm font-semibold text-blue-700 mb-3">
                सही नौकरी, सही मौका – अपना रोल के साथ!
              </p>
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#0B1B3B] tracking-tight leading-[1.12] text-balance">
                Find Your Dream Job with Apna Role
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Discover thousands of job opportunities and take the next step in your career. Connect directly with verified Indian recruiters, build ATS-ready resumes, and prepare for interviews.
              </p>

              {/* Job Search Form */}
              <form
                onSubmit={handleSearch}
                className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5"
              >
                <div className="sm:col-span-4 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Title, skills, or company"
                    className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
                <div className="sm:col-span-3 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    aria-label="Job Location"
                    className="w-full text-sm text-slate-900 focus:outline-none bg-transparent"
                  >
                    <option value="">All Locations</option>
                    {INDIAN_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Job Category"
                    className="w-full text-sm text-slate-900 focus:outline-none bg-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="sm:col-span-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                >
                  Search Jobs
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                <span>Popular searches:</span>
                <Link to="/jobs?q=React" className="font-medium text-blue-700 hover:underline">
                  React Developer
                </Link>
                <Link to="/jobs?mode=Remote" className="font-medium text-blue-700 hover:underline">
                  Work From Home
                </Link>
                <Link to="/jobs?exp=Fresher" className="font-medium text-blue-700 hover:underline">
                  Fresher Openings
                </Link>
                <Link to="/jobs?type=Government" className="font-medium text-blue-700 hover:underline">
                  Government Jobs
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative h-full min-h-[280px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src="/src/assets/images/hero_career_india_1794856686856.jpg"
                  alt="Indian software engineers and designers collaborating in a sunlit office"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3B]/80 via-[#0B1B3B]/20 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <p className="text-xs font-medium text-cyan-300">
                      Your Career. Your Opportunity. Your Future.
                    </p>
                    <p className="font-display text-lg font-bold mt-1">
                      Verified Indian Employers &amp; Campus Roles
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full-Width Database-Driven Statistics Strip */}
          <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-[#0B1B3B] tabular-nums">
                {approvedJobs.length}
              </p>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Active Job Listings
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-[#0B1B3B] tabular-nums">
                {companies.length}
              </p>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Hiring Companies
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-[#0B1B3B] tabular-nums">
                {approvedInternships.length}
              </p>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Internship Opportunities
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-[#0B1B3B] tabular-nums">
                {totalApplicationsCount}
              </p>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Candidate Applications
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Smart Job Matches (if logged-in candidate has skills) */}
      {matchedJobs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#0B1B3B]">
                Recommended for Your Skills
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Smart matches based on your profile skills: {(userProfile?.skills || []).slice(0, 4).join(', ')}
              </p>
            </div>
            <Link
              to="/jobs"
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {matchedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}

      {/* Segmented Jobs Explorer: Latest, WFH, Fresher, Government, Recently Posted */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1B3B]">
              Explore Curated Opportunities
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Switch between latest full-time openings, remote roles, fresher drives, and government posts.
            </p>
          </div>
          <Link
            to="/jobs"
            className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 whitespace-nowrap"
          >
            Browse All Jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Functional Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl w-fit mb-7">
          {(
            [
              { id: 'latest', label: 'Latest Jobs' },
              { id: 'wfh', label: 'Work From Home' },
              { id: 'fresher', label: 'Fresher Jobs' },
              { id: 'government', label: 'Government Jobs' },
              { id: 'recent', label: 'Recently Posted' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white text-[#0B1B3B] shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {tabJobs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-sm text-slate-600">
              No roles match this quick filter right now. Try viewing all jobs.
            </p>
            <Link
              to="/jobs"
              className="mt-4 inline-block px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg"
            >
              View All Jobs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tabJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Trending Job Categories */}
      <section className="bg-white border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1B3B]">
                Trending Job Categories
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Filter openings across 15 high-demand Indian industry verticals.
              </p>
            </div>
            <Link
              to="/jobs"
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
            >
              All Categories
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {categories.map((cat) => {
              const count = approvedJobs.filter((j) => j.category === cat).length;
              return (
                <Link
                  key={cat}
                  to={`/jobs?cat=${encodeURIComponent(cat)}`}
                  className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-colors flex flex-col justify-between gap-2"
                >
                  <span className="font-display text-sm font-semibold text-[#0B1B3B] leading-snug">
                    {cat}
                  </span>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {count} {count === 1 ? 'opening' : 'openings'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top Hiring & Featured Companies */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-8">
          <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 min-h-[240px]">
            <img
              src="/src/assets/images/company_office_campus_1794856687801.jpg"
              alt="Modern Indian corporate technology campus"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-7 flex flex-col justify-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1B3B]">
              Featured &amp; Top Hiring Companies
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
              Explore verified employers across Bengaluru, Hyderabad, Mumbai, Pune, and Delhi NCR. Read employee reviews, compare workplace culture, and view open positions.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/companies"
                className="px-5 py-2.5 bg-[#0B1B3B] hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Explore All Companies
              </Link>
              <Link
                to="/register?role=employer"
                className="px-5 py-2.5 border border-slate-300 hover:border-slate-400 text-slate-800 text-sm font-semibold rounded-lg transition-colors"
              >
                Hire on Apna Role
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.slice(0, 6).map((co) => {
            const openRoles = approvedJobs.filter((j) => j.companyId === co.id).length;
            return (
              <Link
                key={co.id}
                to={`/companies/${co.id}`}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 font-bold text-sm flex items-center justify-center shrink-0">
                        {co.logoUrl ? (
                          <img
                            src={co.logoUrl}
                            alt={co.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          co.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-bold text-[#0B1B3B] truncate">
                          {co.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">{co.industry}</p>
                      </div>
                    </div>
                    {co.verified && (
                      <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" aria-label="Verified Employer" />
                    )}
                  </div>
                  <p className="mt-3 text-sm text-slate-600 line-clamp-2">{co.description}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 tabular-nums">
                  <span>{co.location}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#0B1B3B]">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {(co.rating || 4.5).toFixed(1)} · {openRoles} open
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Internship Opportunities + Career Toolkit */}
      <section className="bg-white border-t border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-[#0B1B3B]">
                  Internship Opportunities
                </h2>
                <Link
                  to="/internships"
                  className="text-sm font-semibold text-blue-700 hover:underline"
                >
                  All Internships
                </Link>
              </div>
              <div className="space-y-3">
                {approvedInternships.slice(0, 3).map((intern) => (
                  <Link
                    key={intern.id}
                    to="/internships"
                    className="block p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-sm font-bold text-[#0B1B3B]">
                          {intern.title}
                        </h3>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {intern.companyName} · {intern.location}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-blue-700 tabular-nums shrink-0">
                        {intern.stipendDisplay}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Duration: {intern.duration} · {intern.workMode}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 rounded-xl overflow-hidden border border-slate-200 h-44 bg-slate-100">
                <img
                  src="/src/assets/images/interview_prep_coaching_1794856687969.jpg"
                  alt="Candidate preparing for technical interview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <Link
                to="/resume-builder"
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between gap-2"
              >
                <FileText className="w-5 h-5 text-blue-700" />
                <div>
                  <h3 className="font-display text-sm font-bold text-[#0B1B3B]">
                    AI Resume Builder
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Generate ATS-friendly resumes &amp; export PDF.
                  </p>
                </div>
              </Link>
              <Link
                to="/career-guidance"
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between gap-2"
              >
                <Compass className="w-5 h-5 text-cyan-700" />
                <div>
                  <h3 className="font-display text-sm font-bold text-[#0B1B3B]">
                    AI Career Assistant
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Skill gap analysis &amp; personalized career paths.
                  </p>
                </div>
              </Link>
              <Link
                to="/interview-prep"
                className="sm:col-span-2 p-4 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-blue-700 shrink-0" />
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#0B1B3B]">
                      Interview Preparation &amp; AI Mock Practice
                    </h3>
                    <p className="text-xs text-slate-600">
                      HR, Java, Python, JS, SQL &amp; Data Science Q&amp;A + live AI answer evaluation.
                    </p>
                  </div>
                </div>
                <GraduationCap className="w-5 h-5 text-slate-400 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
