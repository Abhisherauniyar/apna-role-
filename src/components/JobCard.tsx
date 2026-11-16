import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Check, Scale, ArrowUpRight, Building2 } from 'lucide-react';
import { Job } from '../types';
import { usePortal } from '../context/PortalContext';
import { useAuth } from '../context/AuthContext';

export function JobCard({ job }: { job: Job }) {
  const { isJobSaved, toggleSaveJob, compareJobs, toggleCompareJob, myApplications } = usePortal();
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const saved = isJobSaved(job.id);
  const compared = compareJobs.some((j) => j.id === job.id);
  const applied = myApplications.some((a) => a.jobId === job.id);

  const initials = job.companyName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <article className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden text-sm font-bold text-[#0B1B3B]">
              {job.companyLogo ? (
                <img
                  src={job.companyLogo}
                  alt={job.companyName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                initials || <Building2 className="w-5 h-5 text-slate-500" />
              )}
            </div>
            <div className="min-w-0">
              <Link
                to={`/jobs/${job.id}`}
                className="font-display text-base font-bold text-[#0B1B3B] hover:text-blue-700 transition-colors block truncate"
              >
                {job.title}
              </Link>
              <div className="flex items-center gap-2 text-sm text-slate-600 mt-0.5">
                <Link
                  to={`/companies/${job.companyId}`}
                  className="hover:text-blue-700 font-medium truncate"
                >
                  {job.companyName}
                </Link>
                {job.featured && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-xs font-semibold text-blue-700">Featured</span>
                  </>
                )}
              </div>
            </div>
          </div>

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
            aria-label={saved ? 'Unsave job' : 'Save job'}
            className={`p-2 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              saved
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Zero-Pill Unboxed Metadata Line */}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 tabular-nums">
          <span className="font-medium text-slate-800">{job.salaryDisplay}</span>
          <span aria-hidden="true">·</span>
          <span>{job.location}</span>
          <span aria-hidden="true">·</span>
          <span>{job.experienceLevel}</span>
          <span aria-hidden="true">·</span>
          <span>{job.jobType}</span>
          <span aria-hidden="true">·</span>
          <span>{job.workMode}</span>
        </div>

        <p className="mt-2.5 text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {job.description}
        </p>

        {job.skills && job.skills.length > 0 && (
          <p className="mt-2.5 text-xs text-slate-500 truncate">
            Skills: {job.skills.slice(0, 5).join(' · ')}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => toggleCompareJob(job)}
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            compared
              ? 'border-cyan-600 bg-cyan-50 text-cyan-800'
              : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          {compared ? <Check className="w-3.5 h-3.5" /> : <Scale className="w-3.5 h-3.5" />}
          {compared ? 'Comparing' : 'Compare'}
        </button>

        <div className="flex items-center gap-2">
          <Link
            to={`/jobs/${job.id}`}
            className="text-xs font-semibold text-slate-700 hover:text-[#0B1B3B] px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={() => {
              if (!firebaseUser) {
                navigate('/login');
              } else {
                navigate(`/jobs/${job.id}`);
              }
            }}
            className={`inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              applied
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-blue-700 text-white hover:bg-blue-800'
            }`}
          >
            {applied ? 'Applied' : 'Apply Now'}
            {!applied && <ArrowUpRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </article>
  );
}
