import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ShieldCheck,
  Users,
  Building2,
  Briefcase,
  Flag,
  FolderKanban,
  Database,
  CheckCircle2,
  Star,
  Trash2,
  Mail,
} from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { useAuth } from '../context/AuthContext';
import { usePortal } from '../context/PortalContext';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { EmailLog, JobReport, UserProfile } from '../types';

type AdminTab = 'analytics' | 'users' | 'companies' | 'jobs' | 'reports' | 'categories' | 'emails';

export function AdminDashboardPage() {
  const { firebaseUser, isAdmin, loading } = useAuth();
  const {
    companies,
    jobs,
    internships,
    categoryDocs,
    seedStarterCatalog,
    isUsingStarterPreview,
    showToast,
  } = usePortal();

  const [tab, setTab] = useState<AdminTab>('analytics');
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [reportsList, setReportsList] = useState<JobReport[]>([]);
  const [emailLogsList, setEmailLogsList] = useState<EmailLog[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAdminData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        setUsersList(usersSnap.docs.map((d) => d.data() as UserProfile));
      } catch (err) {
        console.error('Admin users fetch:', err);
      }
      try {
        const repSnap = await getDocs(collection(db, 'reports'));
        setReportsList(repSnap.docs.map((d) => ({ id: d.id, ...d.data() } as JobReport)));
      } catch (err) {
        console.error('Admin reports fetch:', err);
      }
      try {
        const mailSnap = await getDocs(collection(db, 'emailLogs'));
        setEmailLogsList(mailSnap.docs.map((d) => ({ id: d.id, ...d.data() } as EmailLog)));
      } catch (err) {
        console.error('Admin emailLogs fetch:', err);
      }
    };
    fetchAdminData();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-slate-600">
        Verifying admin access...
      </div>
    );
  }

  if (!firebaseUser || !isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-3">
        <ShieldCheck className="w-10 h-10 text-red-600 mx-auto" />
        <h1 className="font-display text-2xl font-bold text-[#0B1B3B]">
          Authorized Admin Access Only
        </h1>
        <p className="text-sm text-slate-600">
          This moderation console is restricted to verified Apna Role platform administrators.
        </p>
      </div>
    );
  }

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedStarterCatalog();
      showToast('Starter Indian catalog published to Firestore!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Seed failed.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const toggleVerifyCompany = async (coId: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'companies', coId), {
        verified: !current,
        updatedAt: serverTimestamp(),
      });
      showToast(!current ? 'Company verified.' : 'Company verification removed.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `companies/${coId}`);
    }
  };

  const updateJobModeration = async (jobId: string, patch: { status?: string; featured?: boolean }) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), {
        ...patch,
        updatedAt: serverTimestamp(),
      });
      showToast('Job moderation updated.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `jobs/${jobId}`);
    }
  };

  const deleteJobAdmin = async (jobId: string) => {
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      showToast('Job removed.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jobs/${jobId}`);
    }
  };

  const updateReportStatus = async (repId: string, status: JobReport['status']) => {
    try {
      await updateDoc(doc(db, 'reports', repId), {
        status,
        updatedAt: serverTimestamp(),
      });
      setReportsList((prev) => prev.map((r) => (r.id === repId ? { ...r, status } : r)));
      showToast(`Report marked ${status}.`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `reports/${repId}`);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const catId = `cat_${Date.now()}`;
    const slug = newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    try {
      await setDoc(doc(db, 'categories', catId), {
        id: catId,
        name: newCategoryName.trim(),
        slug,
        active: true,
        createdAt: serverTimestamp(),
      });
      setNewCategoryName('');
      showToast('Category added!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `categories/${catId}`);
    }
  };

  const deleteCategory = async (catId: string) => {
    try {
      await deleteDoc(doc(db, 'categories', catId));
      showToast('Category removed.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${catId}`);
    }
  };

  const jobSeekersCount = usersList.filter((u) => u.role === 'job_seeker').length;
  const employersCount = usersList.filter((u) => u.role === 'employer').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageMeta
        title="Admin Console – Apna Role"
        description="Platform moderation, user management, company verification, job approvals, and analytics."
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">
            Apna Role Admin Console
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Moderation, verification, category governance, and live platform analytics.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSeed}
          disabled={seeding}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0B1B3B] hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
        >
          <Database className="w-4 h-4 text-cyan-400" />
          {seeding
            ? 'Publishing Catalog...'
            : isUsingStarterPreview
              ? 'Publish Starter Catalog to Firestore'
              : 'Sync Starter Catalog'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'analytics', label: 'Platform Analytics', icon: ShieldCheck },
            { id: 'users', label: `Users (${usersList.length})`, icon: Users },
            { id: 'companies', label: `Companies (${companies.length})`, icon: Building2 },
            { id: 'jobs', label: `Job Moderation (${jobs.length})`, icon: Briefcase },
            { id: 'reports', label: `Reported Jobs (${reportsList.length})`, icon: Flag },
            { id: 'categories', label: 'Categories', icon: FolderKanban },
            { id: 'emails', label: `Auto Emails (${emailLogsList.length})`, icon: Mail },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer ${
                tab === t.id
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Analytics */}
      {tab === 'analytics' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Registered Users</p>
            <p className="font-mono text-3xl font-bold text-[#0B1B3B] mt-1 tabular-nums">{usersList.length}</p>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              {jobSeekersCount} Seekers · {employersCount} Employers
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Companies</p>
            <p className="font-mono text-3xl font-bold text-[#0B1B3B] mt-1 tabular-nums">{companies.length}</p>
            <p className="text-xs text-blue-700 mt-1 tabular-nums">
              {companies.filter((c) => c.verified).length} Verified
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Jobs &amp; Internships</p>
            <p className="font-mono text-3xl font-bold text-[#0B1B3B] mt-1 tabular-nums">
              {jobs.length + internships.length}
            </p>
            <p className="text-xs text-slate-500 mt-1 tabular-nums">
              {jobs.filter((j) => j.featured).length} Featured
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500">Open Safety Reports</p>
            <p className="font-mono text-3xl font-bold text-red-600 mt-1 tabular-nums">
              {reportsList.filter((r) => r.status === 'open').length}
            </p>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-3.5 px-5 font-semibold">Name</th>
                <th className="py-3.5 px-5 font-semibold">Email</th>
                <th className="py-3.5 px-5 font-semibold">Role</th>
                <th className="py-3.5 px-5 font-semibold">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map((u) => (
                <tr key={u.uid}>
                  <td className="py-3.5 px-5 font-semibold text-[#0B1B3B]">{u.displayName}</td>
                  <td className="py-3.5 px-5 text-slate-600">{u.email}</td>
                  <td className="py-3.5 px-5 text-slate-700 capitalize">{u.role.replace('_', ' ')}</td>
                  <td className="py-3.5 px-5 text-slate-600">{u.location || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Companies */}
      {tab === 'companies' && (
        <div className="space-y-3">
          {companies.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-bold text-[#0B1B3B] flex items-center gap-1.5">
                  {c.name}
                  {c.verified && <CheckCircle2 className="w-4 h-4 text-blue-700" />}
                </h3>
                <p className="text-xs text-slate-500">{c.industry} · {c.location}</p>
              </div>
              {!c.isPreview && (
                <button
                  type="button"
                  onClick={() => toggleVerifyCompany(c.id, c.verified)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    c.verified
                      ? 'border border-slate-200 text-slate-700'
                      : 'bg-blue-700 text-white'
                  }`}
                >
                  {c.verified ? 'Revoke Verification' : 'Verify Company'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Jobs Moderation */}
      {tab === 'jobs' && (
        <div className="space-y-3">
          {jobs.map((j) => (
            <div key={j.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-bold text-[#0B1B3B]">{j.title}</h3>
                <p className="text-xs text-slate-600">
                  {j.companyName} · {j.location} · Status: <strong>{j.status}</strong>
                </p>
              </div>
              {!j.isPreview && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateJobModeration(j.id, { featured: !j.featured })}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer ${
                      j.featured ? 'bg-amber-50 border-amber-200 text-amber-800' : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    {j.featured ? 'Featured' : 'Feature'}
                  </button>
                  <select
                    value={j.status}
                    onChange={(e) => updateJobModeration(j.id, { status: e.target.value })}
                    className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-white"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => deleteJobAdmin(j.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    aria-label="Delete job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reported Jobs */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {reportsList.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-600">
              No reported job listings.
            </div>
          ) : (
            reportsList.map((r) => (
              <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-base font-bold text-[#0B1B3B]">{r.jobTitle || r.jobId}</h3>
                  <p className="text-xs font-semibold text-red-700 mt-0.5">{r.reason}</p>
                  {r.details && <p className="text-xs text-slate-600 mt-1">{r.details}</p>}
                </div>
                <select
                  value={r.status}
                  onChange={(e) => updateReportStatus(r.id, e.target.value as JobReport['status'])}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white"
                >
                  <option value="open">Open</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="action_taken">Action Taken</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            ))
          )}
        </div>
      )}

      {/* Categories */}
      {tab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleAddCategory} className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4 h-fit">
            <h2 className="font-display text-base font-bold text-[#0B1B3B]">Add Job Category</h2>
            <input
              type="text"
              required
              minLength={2}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Cybersecurity"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Add Category
            </button>
          </form>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {categoryDocs.length === 0 ? (
              <p className="p-6 text-sm text-slate-600">
                Using default 15 built-in categories. Click "Publish Starter Catalog to Firestore" above to manage them dynamically in Firestore.
              </p>
            ) : (
              categoryDocs.map((c) => (
                <div key={c.id} className="px-5 py-3.5 flex items-center justify-between">
                  <span className="text-sm font-medium text-[#0B1B3B]">{c.name}</span>
                  <button
                    type="button"
                    onClick={() => deleteCategory(c.id)}
                    className="text-xs text-red-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Automated Email Notifications */}
      {tab === 'emails' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
            <h2 className="font-display text-lg font-bold text-[#0B1B3B] flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-700" />
              Automated Candidate Email Notifications
            </h2>
            <p className="text-sm text-slate-600">
              Powered by Firebase Cloud Functions v2 (<code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">onApplicationStatusEmailNotify</code>). Fires automatically whenever an application status changes to <strong>Shortlisted</strong> or <strong>Interview Scheduled</strong>.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
            {emailLogsList.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-600">
                No automated email notifications recorded yet. Deploy the Cloud Function with SMTP secrets configured to enable live email delivery.
              </p>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500">
                    <th className="py-3.5 px-5 font-semibold">Recipient</th>
                    <th className="py-3.5 px-5 font-semibold">Trigger Status</th>
                    <th className="py-3.5 px-5 font-semibold">Delivery</th>
                    <th className="py-3.5 px-5 font-semibold">Subject</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {emailLogsList.map((log) => (
                    <tr key={log.id}>
                      <td className="py-3.5 px-5 font-medium text-[#0B1B3B]">{log.recipientEmail}</td>
                      <td className="py-3.5 px-5 text-slate-700">{log.statusTriggered}</td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            log.deliveryStatus === 'sent'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {log.deliveryStatus === 'sent'
                            ? 'Sent'
                            : log.deliveryStatus === 'failed_missing_smtp'
                              ? 'SMTP Secrets Missing'
                              : 'Failed'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-600">{log.subject}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
