import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Building2,
  Plus,
  Users,
  Briefcase,
  Calendar,
  Trash2,
  Edit3,
  Upload,
  FileDown,
  Mail,
} from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { useAuth } from '../context/AuthContext';
import { usePortal } from '../context/PortalContext';
import { db, storage, OperationType, handleFirestoreError } from '../lib/firebase';
import {
  APPLICATION_STATUSES,
  Application,
  ApplicationStatus,
  EmailLog,
  INDIAN_LOCATIONS,
  JOB_CATEGORIES,
  Job,
} from '../types';

type EmpTab = 'overview' | 'company' | 'post_job' | 'post_internship' | 'applications';

export function EmployerDashboardPage() {
  const { firebaseUser, userProfile, isAdmin, loading } = useAuth();
  const { companies, jobs, internships, employerApplications, showToast } = usePortal();

  const [tab, setTab] = useState<EmpTab>('overview');

  const myCompany = useMemo(
    () => companies.find((c) => c.ownerId === firebaseUser?.uid && !c.isPreview),
    [companies, firebaseUser]
  );

  const myJobs = useMemo(
    () => jobs.filter((j) => j.employerId === firebaseUser?.uid && !j.isPreview),
    [jobs, firebaseUser]
  );

  const myInternships = useMemo(
    () => internships.filter((i) => i.employerId === firebaseUser?.uid && !i.isPreview),
    [internships, firebaseUser]
  );

  // Company form state
  const [compName, setCompName] = useState('');
  const [compIndustry, setCompIndustry] = useState('IT & Software Development');
  const [compLocation, setCompLocation] = useState<string>(INDIAN_LOCATIONS[0]);
  const [compSize, setCompSize] = useState('50–200 employees');
  const [compWebsite, setCompWebsite] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compLogo, setCompLogo] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);

  // Job form state
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobCategory, setJobCategory] = useState<string>(JOB_CATEGORIES[0]);
  const [jobLocation, setJobLocation] = useState<string>(INDIAN_LOCATIONS[0]);
  const [workMode, setWorkMode] = useState<'On-site' | 'Remote' | 'Hybrid'>('Hybrid');
  const [jobType, setJobType] = useState<'Full Time' | 'Part Time' | 'Internship' | 'Government' | 'Contract'>('Full Time');
  const [expLevel, setExpLevel] = useState<'Fresher' | '1-3 Years' | '3-5 Years' | '5+ Years'>('1-3 Years');
  const [salaryMin, setSalaryMin] = useState(600000);
  const [salaryMax, setSalaryMax] = useState(1200000);
  const [salaryDisplay, setSalaryDisplay] = useState('₹6–12 LPA');
  const [jobDesc, setJobDesc] = useState('');
  const [jobSkills, setJobSkills] = useState('React, TypeScript, Communication');
  const [jobDeadline, setJobDeadline] = useState('2026-12-30');
  const [savingJob, setSavingJob] = useState(false);

  // Internship form state
  const [intTitle, setIntTitle] = useState('');
  const [intCategory, setIntCategory] = useState<string>(JOB_CATEGORIES[1]);
  const [intLocation, setIntLocation] = useState<string>(INDIAN_LOCATIONS[10]);
  const [intWorkMode, setIntWorkMode] = useState<'On-site' | 'Remote' | 'Hybrid'>('Remote');
  const [intDuration, setIntDuration] = useState('3 Months');
  const [intStipend, setIntStipend] = useState(15000);
  const [intDesc, setIntDesc] = useState('');
  const [intSkills, setIntSkills] = useState('JavaScript, React, Git');
  const [savingInt, setSavingInt] = useState(false);

  // Interview Schedule Modal
  const [schedulingApp, setSchedulingApp] = useState<Application | null>(null);
  const [intDate, setIntDate] = useState('');
  const [intMode, setIntMode] = useState('Google Meet / Video');
  const [intLink, setIntLink] = useState('');
  const [recNotes, setRecNotes] = useState('');
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  useEffect(() => {
    if (!firebaseUser) {
      setEmailLogs([]);
      return;
    }
    const q = query(
      collection(db, 'emailLogs'),
      where('employerId', '==', firebaseUser.uid)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEmailLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EmailLog)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'emailLogs')
    );
    return () => unsub();
  }, [firebaseUser]);

  useEffect(() => {
    if (myCompany) {
      setCompName(myCompany.name);
      setCompIndustry(myCompany.industry);
      setCompLocation(myCompany.location);
      setCompSize(myCompany.size || '50–200 employees');
      setCompWebsite(myCompany.website || '');
      setCompDesc(myCompany.description);
      setCompLogo(myCompany.logoUrl || '');
    }
  }, [myCompany]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-slate-600">
        Loading Employer Console...
      </div>
    );
  }

  if (!firebaseUser || !userProfile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#0B1B3B]">
          Recruiter Sign-In Required
        </h1>
        <Link to="/login" className="inline-block px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-xl">
          Sign In
        </Link>
      </div>
    );
  }

  if (userProfile.role !== 'employer' && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#0B1B3B]">
          Employer Account Required
        </h1>
        <p className="text-sm text-slate-600">
          Your current account is registered as a Job Seeker. Register an Employer account to post jobs and review applicants.
        </p>
        <Link to="/register?role=employer" className="inline-block px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-xl">
          Register as Employer
        </Link>
      </div>
    );
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const storageRef = ref(storage, `company_logos/${firebaseUser.uid}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setCompLogo(url);
      showToast('Company logo uploaded!', 'success');
    } catch {
      showToast('Logo upload failed. Check Firebase Storage configuration.', 'error');
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);
    const companyId = myCompany?.id || `co_${firebaseUser.uid}`;
    try {
      if (myCompany) {
        await updateDoc(doc(db, 'companies', companyId), {
          name: compName.trim().slice(0, 140),
          industry: compIndustry.trim().slice(0, 100),
          location: compLocation.trim().slice(0, 120),
          size: compSize.trim().slice(0, 60),
          website: compWebsite.trim().slice(0, 300),
          logoUrl: compLogo.trim().slice(0, 1000),
          description: compDesc.trim().slice(0, 3000),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'companies', companyId), {
          id: companyId,
          ownerId: firebaseUser.uid,
          name: compName.trim().slice(0, 140),
          industry: compIndustry.trim().slice(0, 100),
          location: compLocation.trim().slice(0, 120),
          size: compSize.trim().slice(0, 60),
          website: compWebsite.trim().slice(0, 300),
          logoUrl: compLogo.trim().slice(0, 1000),
          description: compDesc.trim().slice(0, 3000),
          verified: false,
          rating: 4.5,
          reviewCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      showToast('Company profile saved!', 'success');
      setTab('post_job');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `companies/${companyId}`);
    } finally {
      setSavingCompany(false);
    }
  };

  const handlePostOrUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myCompany) {
      showToast('Please register your company profile first.', 'error');
      setTab('company');
      return;
    }
    setSavingJob(true);
    const jobId = editingJobId || `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const skillsArr = jobSkills.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 25);
    try {
      if (editingJobId) {
        await updateDoc(doc(db, 'jobs', jobId), {
          title: jobTitle.trim().slice(0, 160),
          category: jobCategory,
          location: jobLocation,
          workMode,
          jobType,
          experienceLevel: expLevel,
          salaryMin: Math.max(0, Math.round(salaryMin)),
          salaryMax: Math.max(Math.round(salaryMin), Math.round(salaryMax)),
          salaryDisplay: salaryDisplay.trim().slice(0, 80),
          description: jobDesc.trim().slice(0, 6000),
          skills: skillsArr,
          deadline: jobDeadline,
          isFresher: expLevel === 'Fresher',
          isGovernment: jobType === 'Government' || jobCategory === 'Government Jobs',
          updatedAt: serverTimestamp(),
        });
        showToast('Job listing updated!', 'success');
      } else {
        await setDoc(doc(db, 'jobs', jobId), {
          id: jobId,
          companyId: myCompany.id,
          employerId: firebaseUser.uid,
          companyName: myCompany.name,
          companyLogo: myCompany.logoUrl || '',
          title: jobTitle.trim().slice(0, 160),
          category: jobCategory,
          location: jobLocation,
          workMode,
          jobType,
          experienceLevel: expLevel,
          salaryMin: Math.max(0, Math.round(salaryMin)),
          salaryMax: Math.max(Math.round(salaryMin), Math.round(salaryMax)),
          salaryDisplay: salaryDisplay.trim().slice(0, 80),
          description: jobDesc.trim().slice(0, 6000),
          skills: skillsArr,
          deadline: jobDeadline,
          status: 'approved',
          featured: false,
          isFresher: expLevel === 'Fresher',
          isGovernment: jobType === 'Government' || jobCategory === 'Government Jobs',
          applicantsCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showToast('New job published live!', 'success');
      }
      setEditingJobId(null);
      setJobTitle('');
      setJobDesc('');
      setTab('overview');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `jobs/${jobId}`);
    } finally {
      setSavingJob(false);
    }
  };

  const handlePostInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myCompany) {
      showToast('Please register your company profile first.', 'error');
      setTab('company');
      return;
    }
    setSavingInt(true);
    const intId = `int_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      await setDoc(doc(db, 'internships', intId), {
        id: intId,
        companyId: myCompany.id,
        employerId: firebaseUser.uid,
        companyName: myCompany.name,
        companyLogo: myCompany.logoUrl || '',
        title: intTitle.trim().slice(0, 160),
        category: intCategory,
        location: intLocation,
        workMode: intWorkMode,
        duration: intDuration,
        stipend: Math.max(0, Math.round(intStipend)),
        stipendDisplay: intStipend > 0 ? `₹${intStipend.toLocaleString('en-IN')} / month` : 'Unpaid (Certificate)',
        isPaid: intStipend > 0,
        forStudents: true,
        skills: intSkills.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 25),
        description: intDesc.trim().slice(0, 4000),
        deadline: '2026-12-30',
        status: 'approved',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIntTitle('');
      setIntDesc('');
      showToast('Internship published!', 'success');
      setTab('overview');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `internships/${intId}`);
    } finally {
      setSavingInt(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      showToast('Job listing deleted.', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jobs/${jobId}`);
    }
  };

  const startEditJob = (job: Job) => {
    setEditingJobId(job.id);
    setJobTitle(job.title);
    setJobCategory(job.category);
    setJobLocation(job.location);
    setWorkMode(job.workMode);
    setJobType(job.jobType);
    setExpLevel(job.experienceLevel);
    setSalaryMin(job.salaryMin);
    setSalaryMax(job.salaryMax);
    setSalaryDisplay(job.salaryDisplay);
    setJobDesc(job.description);
    setJobSkills((job.skills || []).join(', '));
    setJobDeadline(job.deadline || '2026-12-30');
    setTab('post_job');
  };

  const updateAppStatus = async (app: Application, newStatus: ApplicationStatus) => {
    try {
      await updateDoc(doc(db, 'applications', app.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: app.candidateId,
        title: `Application Update: ${newStatus}`,
        message: `${app.companyName} updated your application for ${app.jobTitle} to ${newStatus}.`,
        type: newStatus === 'Interview Scheduled' ? 'interview' : 'application',
        link: '/dashboard',
        read: false,
        createdAt: serverTimestamp(),
      });
      showToast(
        newStatus === 'Shortlisted' || newStatus === 'Interview Scheduled'
          ? `Status updated to ${newStatus}. Automated email notification queued for candidate.`
          : `Candidate status updated to ${newStatus}.`,
        'success'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `applications/${app.id}`);
    }
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingApp) return;
    try {
      await updateDoc(doc(db, 'applications', schedulingApp.id), {
        status: 'Interview Scheduled',
        interviewDate: intDate,
        interviewMode: intMode,
        interviewLink: intLink.trim(),
        recruiterNotes: recNotes.trim(),
        updatedAt: serverTimestamp(),
      });
      const notifId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await setDoc(doc(db, 'notifications', notifId), {
        id: notifId,
        userId: schedulingApp.candidateId,
        title: 'Interview Scheduled',
        message: `${schedulingApp.companyName} scheduled an interview for ${schedulingApp.jobTitle} on ${intDate}.`,
        type: 'interview',
        link: '/dashboard',
        read: false,
        createdAt: serverTimestamp(),
      });
      setSchedulingApp(null);
      setIntDate('');
      setIntLink('');
      setRecNotes('');
      showToast('Interview scheduled! Automated email & dashboard notification queued.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `applications/${schedulingApp.id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageMeta
        title="Employer & Recruiter Dashboard – Apna Role"
        description="Manage company profile, post jobs and internships, review resumes, and schedule candidate interviews."
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">
            Employer &amp; Recruiter Console
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {myCompany ? `${myCompany.name} · ${myCompany.location}` : 'Set up your company profile to start hiring.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingJobId(null);
            setTab('post_job');
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" /> Post New Job
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'overview', label: `Listings (${myJobs.length + myInternships.length})`, icon: Briefcase },
            { id: 'applications', label: `Applications (${employerApplications.length})`, icon: Users },
            { id: 'company', label: myCompany ? 'Company Profile' : 'Register Company', icon: Building2 },
            { id: 'post_job', label: editingJobId ? 'Edit Job' : 'Post Job', icon: Plus },
            { id: 'post_internship', label: 'Post Internship', icon: Plus },
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
                  ? 'bg-[#0B1B3B] text-white border-[#0B1B3B]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Overview / Listings */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Published Jobs</p>
              <p className="font-mono text-2xl font-bold text-[#0B1B3B] mt-1 tabular-nums">{myJobs.length}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Published Internships</p>
              <p className="font-mono text-2xl font-bold text-[#0B1B3B] mt-1 tabular-nums">{myInternships.length}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Total Candidate Applications</p>
              <p className="font-mono text-2xl font-bold text-blue-700 mt-1 tabular-nums">{employerApplications.length}</p>
            </div>
          </div>

          {!myCompany && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-base font-bold text-[#0B1B3B]">
                  Step 1: Register Your Company Profile
                </h2>
                <p className="text-xs text-slate-700 mt-0.5">
                  Create your company profile before publishing jobs or internships.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTab('company')}
                className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0"
              >
                Register Company
              </button>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-display text-lg font-bold text-[#0B1B3B]">Your Job Listings</h2>
            </div>
            {myJobs.length === 0 ? (
              <p className="p-6 text-sm text-slate-600">No jobs posted yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {myJobs.map((job) => (
                  <div key={job.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <Link to={`/jobs/${job.id}`} className="font-display text-base font-bold text-[#0B1B3B] hover:text-blue-700">
                        {job.title}
                      </Link>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {job.location} · {job.salaryDisplay} · Status: {job.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditJob(job)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Company Form */}
      {tab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 max-w-3xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="font-display text-xl font-bold text-[#0B1B3B]">
              {myCompany ? 'Update Company Profile' : 'Register Your Company'}
            </h2>
            <label className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
              <Upload className="w-4 h-4" /> Upload Logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Industry</label>
              <input
                type="text"
                required
                value={compIndustry}
                onChange={(e) => setCompIndustry(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Headquarters</label>
              <select
                value={compLocation}
                onChange={(e) => setCompLocation(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {INDIAN_LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Size</label>
              <input
                type="text"
                value={compSize}
                onChange={(e) => setCompSize(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="url"
                value={compWebsite}
                onChange={(e) => setCompWebsite(e.target.value)}
                placeholder="https://yourcompany.in"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">About Company</label>
              <textarea
                rows={4}
                required
                value={compDesc}
                onChange={(e) => setCompDesc(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingCompany}
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl cursor-pointer"
          >
            {savingCompany ? 'Saving...' : 'Save Company Profile'}
          </button>
        </form>
      )}

      {/* Post/Edit Job Form */}
      {tab === 'post_job' && (
        <form onSubmit={handlePostOrUpdateJob} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 max-w-3xl">
          <h2 className="font-display text-xl font-bold text-[#0B1B3B]">
            {editingJobId ? 'Edit Job Listing' : 'Post a New Job'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
              <input
                type="text"
                required
                minLength={3}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Full-Stack Developer (React + Node.js)"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={jobCategory}
                onChange={(e) => setJobCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <select
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {INDIAN_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Mode</label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as 'On-site' | 'Remote' | 'Hybrid')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as Job['jobType'])}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Government">Government</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Experience Level</label>
              <select
                value={expLevel}
                onChange={(e) => setExpLevel(e.target.value as Job['experienceLevel'])}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="Fresher">Fresher</option>
                <option value="1-3 Years">1-3 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="5+ Years">5+ Years</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Display</label>
              <input
                type="text"
                required
                value={salaryDisplay}
                onChange={(e) => setSalaryDisplay(e.target.value)}
                placeholder="₹8–14 LPA"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Salary (INR / Year)</label>
              <input
                type="number"
                min={0}
                value={salaryMin}
                onChange={(e) => setSalaryMin(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Salary (INR / Year)</label>
              <input
                type="number"
                min={0}
                value={salaryMax}
                onChange={(e) => setSalaryMax(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deadline</label>
              <input
                type="date"
                value={jobDeadline}
                onChange={(e) => setJobDeadline(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Skills (comma-separated)</label>
              <input
                type="text"
                value={jobSkills}
                onChange={(e) => setJobSkills(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description</label>
              <textarea
                rows={4}
                required
                minLength={10}
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingJob}
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl cursor-pointer"
          >
            {savingJob ? 'Publishing...' : editingJobId ? 'Save Job Changes' : 'Publish Job'}
          </button>
        </form>
      )}

      {/* Post Internship Form */}
      {tab === 'post_internship' && (
        <form onSubmit={handlePostInternship} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 max-w-3xl">
          <h2 className="font-display text-xl font-bold text-[#0B1B3B]">Post New Internship</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Internship Title</label>
              <input
                type="text"
                required
                minLength={3}
                value={intTitle}
                onChange={(e) => setIntTitle(e.target.value)}
                placeholder="e.g. Frontend Development Intern"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={intCategory}
                onChange={(e) => setIntCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
              <select
                value={intLocation}
                onChange={(e) => setIntLocation(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                {INDIAN_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Work Mode</label>
              <select
                value={intWorkMode}
                onChange={(e) => setIntWorkMode(e.target.value as 'On-site' | 'Remote' | 'Hybrid')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
              <input
                type="text"
                required
                value={intDuration}
                onChange={(e) => setIntDuration(e.target.value)}
                placeholder="3 Months"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Stipend (INR, 0 for Unpaid)</label>
              <input
                type="number"
                min={0}
                value={intStipend}
                onChange={(e) => setIntStipend(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Skills</label>
              <input
                type="text"
                value={intSkills}
                onChange={(e) => setIntSkills(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                required
                minLength={10}
                value={intDesc}
                onChange={(e) => setIntDesc(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingInt}
            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl cursor-pointer"
          >
            {savingInt ? 'Publishing...' : 'Publish Internship'}
          </button>
        </form>
      )}

      {/* Applications Tab */}
      {tab === 'applications' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-slate-700">
            <Mail className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <span>
              Updating a candidate&apos;s status to <strong>Shortlisted</strong> or{' '}
              <strong>Interview Scheduled</strong> automatically triggers an email notification to their registered inbox via Firebase Cloud Functions.
            </span>
          </div>
          {employerApplications.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-600">
              No candidate applications received yet.
            </div>
          ) : (
            employerApplications.map((app) => {
              const isTerminal = app.status === 'Selected' || app.status === 'Rejected';
              const appLogs = emailLogs.filter((l) => l.applicationId === app.id);
              const latestEmailLog = appLogs[appLogs.length - 1];
              return (
                <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#0B1B3B]">
                        {app.candidateName}
                      </h3>
                      <p className="text-xs text-slate-600">
                        Applied for <strong>{app.jobTitle}</strong> · {app.candidateEmail}
                        {app.candidatePhone ? ` · ${app.candidatePhone}` : ''}
                      </p>
                      {app.candidateSkills && app.candidateSkills.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          Skills: {app.candidateSkills.join(' · ')}
                        </p>
                      )}
                      {latestEmailLog && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 bg-slate-50 text-slate-700">
                          <Mail className="w-3 h-3 text-blue-700" />
                          {latestEmailLog.deliveryStatus === 'sent'
                            ? `Auto-email sent (${latestEmailLog.statusTriggered})`
                            : latestEmailLog.deliveryStatus === 'failed_missing_smtp'
                              ? `Auto-email queued (configure SMTP secrets)`
                              : `Auto-email failed (${latestEmailLog.statusTriggered})`}
                        </div>
                      )}
                      {app.coverNote && (
                        <p className="mt-2.5 text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
                          {app.coverNote}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          <FileDown className="w-3.5 h-3.5" /> Resume
                        </a>
                      )}
                      <select
                        disabled={isTerminal}
                        value={app.status}
                        onChange={(e) => updateAppStatus(app, e.target.value as ApplicationStatus)}
                        aria-label="Update Application Status"
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white disabled:opacity-60"
                      >
                        {APPLICATION_STATUSES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      {!isTerminal && (
                        <button
                          type="button"
                          onClick={() => setSchedulingApp(app)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Schedule Interview
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Interview Schedule Modal */}
      {schedulingApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <form
            onSubmit={handleScheduleInterview}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4"
          >
            <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
              Schedule Interview with {schedulingApp.candidateName}
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date &amp; Time</label>
              <input
                type="text"
                required
                value={intDate}
                onChange={(e) => setIntDate(e.target.value)}
                placeholder="e.g. 24 Nov 2026, 11:00 AM IST"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Interview Mode</label>
              <select
                value={intMode}
                onChange={(e) => setIntMode(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option>Google Meet / Video</option>
                <option>Phone Screening</option>
                <option>In-Person Office</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Link / Address</label>
              <input
                type="text"
                value={intLink}
                onChange={(e) => setIntLink(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Recruiter Notes</label>
              <textarea
                rows={2}
                value={recNotes}
                onChange={(e) => setRecNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSchedulingApp(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg cursor-pointer"
              >
                Confirm &amp; Notify
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
