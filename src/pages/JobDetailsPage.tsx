import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Share2,
  Flag,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Calendar,
} from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { JobCard } from '../components/JobCard';
import { usePortal } from '../context/PortalContext';
import { useAuth } from '../context/AuthContext';

export function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    jobs,
    companies,
    isJobSaved,
    toggleSaveJob,
    applyToListing,
    myApplications,
    reportListing,
    showToast,
  } = usePortal();
  const { firebaseUser, userProfile } = useAuth();

  const job = useMemo(() => jobs.find((j) => j.id === id), [jobs, id]);
  const company = useMemo(
    () => (job ? companies.find((c) => c.id === job.companyId) : undefined),
    [companies, job]
  );

  const similarJobs = useMemo(() => {
    if (!job) return [];
    return jobs
      .filter((j) => j.id !== job.id && j.status === 'approved' && (j.category === job.category || j.workMode === job.workMode))
      .slice(0, 3);
  }, [jobs, job]);

  const [applyOpen, setApplyOpen] = useState(false);
  const [coverNote, setCoverNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Suspicious Fee / Deposit Request');
  const [reportDetails, setReportDetails] = useState('');

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-[#0B1B3B]">
          Job Posting Not Found
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          This listing may have expired or been removed by the employer.
        </p>
        <Link
          to="/jobs"
          className="mt-5 inline-block px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-lg"
        >
          Browse Active Jobs
        </Link>
      </div>
    );
  }

  const saved = isJobSaved(job.id);
  const existingApplication = myApplications.find((a) => a.jobId === job.id);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await applyToListing({
        listingId: job.id,
        listingType: 'job',
        title: job.title,
        companyId: job.companyId,
        companyName: job.companyName,
        employerId: job.employerId,
        coverNote: coverNote.trim(),
      });
      setApplyOpen(false);
      setCoverNote('');
      showToast('Application submitted! Track status in your dashboard.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit application.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Job link copied to clipboard.', 'info');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      navigate('/login');
      return;
    }
    try {
      await reportListing({
        jobId: job.id,
        jobTitle: job.title,
        reason: reportReason,
        details: reportDetails.trim(),
      });
      setReportOpen(false);
      setReportDetails('');
      showToast('Thank you. Our moderation team has received your report.', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit report.', 'error');
    }
  };

  const jobPostingJsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    employmentType: job.jobType.toUpperCase().replace(/\s+/g, '_'),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.companyName,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        addressCountry: 'IN',
      },
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: 'INR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salaryMin,
        maxValue: job.salaryMax,
        unitText: 'YEAR',
      },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageMeta
        title={`${job.title} at ${job.companyName} – Apna Role`}
        description={`${job.title} in ${job.location} (${job.salaryDisplay}). Apply via Apna Role.`}
        jsonLd={jobPostingJsonLd}
      />

      <Link
        to="/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#0B1B3B] mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-1.5">
                  {job.category} · {job.workMode}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1B3B]">
                  {job.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                  <Link
                    to={`/companies/${job.companyId}`}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    {job.companyName}
                  </Link>
                  <span aria-hidden="true">·</span>
                  <span>{job.location}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    toggleSaveJob({
                      id: job.id,
                      listingType: 'job',
                      title: job.title,
                      companyName: job.companyName,
                      location: job.location,
                      salaryDisplay: job.salaryDisplay,
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-xs font-semibold cursor-pointer ${
                    saved
                      ? 'border-blue-300 bg-blue-50 text-blue-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                  {saved ? 'Saved' : 'Save Job'}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Salary Package</p>
                <p className="font-semibold text-[#0B1B3B] mt-0.5 tabular-nums">{job.salaryDisplay}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Experience</p>
                <p className="font-semibold text-[#0B1B3B] mt-0.5">{job.experienceLevel}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Job Type</p>
                <p className="font-semibold text-[#0B1B3B] mt-0.5">{job.jobType}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Apply By</p>
                <p className="font-semibold text-[#0B1B3B] mt-0.5 tabular-nums">
                  {job.deadline || 'Open until filled'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {existingApplication ? (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold rounded-xl">
                  <CheckCircle2 className="w-4 h-4" />
                  Applied · Status: {existingApplication.status}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!firebaseUser) {
                      navigate('/login');
                    } else {
                      setApplyOpen(true);
                    }
                  }}
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Apply Now
                </button>
              )}
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-500 hover:text-red-600 cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5" />
                Report Fake Job
              </button>
            </div>
          </div>

          {/* Job Description & Criteria */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0B1B3B] mb-2">
                Job Description
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {job.responsibilities && job.responsibilities.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1B3B] mb-2">
                  Key Responsibilities
                </h2>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
                  {job.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {job.skills && job.skills.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1B3B] mb-2">
                  Required Skills
                </h2>
                <p className="text-sm text-slate-800 font-medium">
                  {job.skills.join(' · ')}
                </p>
              </div>
            )}

            {job.eligibility && (
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1B3B] mb-2">
                  Eligibility Criteria
                </h2>
                <p className="text-sm text-slate-700">{job.eligibility}</p>
              </div>
            )}

            {job.benefits && job.benefits.length > 0 && (
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1B3B] mb-2">
                  Benefits &amp; Perks
                </h2>
                <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
                  {job.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Company Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-[#0B1B3B]">
                  About {job.companyName}
                </h2>
                <p className="text-xs text-slate-500">{company?.industry || job.category}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {company?.description || 'Verified hiring partner on Apna Role.'}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <p>Headquarters: {company?.location || job.location}</p>
              {company?.size && <p>Team Size: {company.size}</p>}
              {job.deadline && (
                <p className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Deadline: {job.deadline}
                </p>
              )}
            </div>
            <Link
              to={`/companies/${job.companyId}`}
              className="mt-5 block w-full text-center py-2.5 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold text-[#0B1B3B]"
            >
              View Company Profile &amp; Reviews
            </Link>
          </div>
        </aside>
      </div>

      {/* Similar Jobs */}
      {similarJobs.length > 0 && (
        <section className="mt-12 pt-10 border-t border-slate-200">
          <h2 className="font-display text-2xl font-bold text-[#0B1B3B] mb-6">
            Similar Job Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {similarJobs.map((sj) => (
              <JobCard key={sj.id} job={sj} />
            ))}
          </div>
        </section>
      )}

      {/* Apply Modal */}
      {applyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleApplySubmit}
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4"
          >
            <h2 className="font-display text-xl font-bold text-[#0B1B3B]">
              Apply for {job.title}
            </h2>
            <p className="text-xs text-slate-600">
              Applying as <span className="font-semibold">{userProfile?.displayName}</span> ({userProfile?.email}).
              {userProfile?.resumeFileName
                ? ` Attached resume: ${userProfile.resumeFileName}.`
                : ' You can upload a resume anytime from your Job Seeker Dashboard.'}
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Cover Note / Why You Fit This Role
              </label>
              <textarea
                rows={4}
                required
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Briefly highlight your relevant skills, projects, and notice period..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApplyOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleReportSubmit}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
              Report Misleading or Fake Job
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reason
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option>Suspicious Fee / Deposit Request</option>
                <option>Misleading Salary or Role Info</option>
                <option>Impersonating Official Brand</option>
                <option>Expired or Spam Listing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Additional Details
              </label>
              <textarea
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide details to help our trust & safety team investigate..."
                className="w-full border border-slate-200 rounded-lg p-3 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
