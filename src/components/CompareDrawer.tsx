import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, X } from 'lucide-react';
import { usePortal } from '../context/PortalContext';

export function CompareDrawer() {
  const { compareJobs, toggleCompareJob, clearCompareJobs } = usePortal();
  const [modalOpen, setModalOpen] = useState(false);

  if (compareJobs.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#0B1B3B] text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-4 max-w-[95vw] no-print">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium whitespace-nowrap">
          <Scale className="w-4 h-4 text-cyan-400" />
          <span>Compare ({compareJobs.length}/3)</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto">
          {compareJobs.map((j) => (
            <button
              key={j.id}
              type="button"
              onClick={() => toggleCompareJob(j)}
              className="inline-flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-md max-w-[160px] cursor-pointer"
            >
              <span className="truncate">{j.title}</span>
              <X className="w-3 h-3 shrink-0" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-[#0B1B3B] text-xs font-bold rounded-lg cursor-pointer whitespace-nowrap"
          >
            Compare Now
          </button>
          <button
            type="button"
            onClick={clearCompareJobs}
            className="text-xs text-slate-300 hover:text-white px-2 py-1 cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h2 className="font-display text-xl font-bold text-[#0B1B3B]">
                  Side-by-Side Job Comparison
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluate compensation, work mode, experience, and skills across shortlisted roles.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 w-36">Attribute</th>
                    {compareJobs.map((j) => (
                      <th key={j.id} className="py-3 px-4 font-display font-bold text-[#0B1B3B] min-w-[200px]">
                        <Link
                          to={`/jobs/${j.id}`}
                          onClick={() => setModalOpen(false)}
                          className="hover:text-blue-700"
                        >
                          {j.title}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-600">Company</td>
                    {compareJobs.map((j) => (
                      <td key={j.id} className="py-3 px-4 text-slate-900">{j.companyName}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-600">Compensation</td>
                    {compareJobs.map((j) => (
                      <td key={j.id} className="py-3 px-4 font-semibold text-blue-700 tabular-nums">{j.salaryDisplay}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-600">Location</td>
                    {compareJobs.map((j) => (
                      <td key={j.id} className="py-3 px-4 text-slate-800">{j.location}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-600">Work Mode</td>
                    {compareJobs.map((j) => (
                      <td key={j.id} className="py-3 px-4 text-slate-800">{j.workMode} · {j.jobType}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-600">Experience</td>
                    {compareJobs.map((j) => (
                      <td key={j.id} className="py-3 px-4 text-slate-800">{j.experienceLevel}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-600">Key Skills</td>
                    {compareJobs.map((j) => (
                      <td key={j.id} className="py-3 px-4 text-slate-700 text-xs">
                        {(j.skills || []).join(', ') || 'Not specified'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-600">Benefits</td>
                    {compareJobs.map((j) => (
                      <td key={j.id} className="py-3 px-4 text-slate-700 text-xs">
                        {(j.benefits || []).join(', ') || 'Standard corporate benefits'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-slate-600">Action</td>
                    {compareJobs.map((j) => (
                      <td key={j.id} className="py-3 px-4">
                        <Link
                          to={`/jobs/${j.id}`}
                          onClick={() => setModalOpen(false)}
                          className="inline-block px-3.5 py-1.5 bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-800"
                        >
                          View &amp; Apply
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
