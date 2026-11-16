import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  User,
  Briefcase,
  Bookmark,
  Bell,
  Calendar,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  MailWarning,
} from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { JobCard } from '../components/JobCard';
import { useAuth } from '../context/AuthContext';
import { usePortal } from '../context/PortalContext';
import { storage } from '../lib/firebase';
import { APPLICATION_STATUSES, EducationEntry, ExperienceEntry } from '../types';

type DashTab = 'overview' | 'profile' | 'applications' | 'saved' | 'alerts';

export function JobSeekerDashboardPage() {
  const {
    firebaseUser,
    userProfile,
    loading,
    updateUserProfile,
    resendVerificationEmail,
    reloadAuthUser,
  } = useAuth();
  const {
    jobs,
    savedJobs,
    myApplications,
    jobAlerts,
    createJobAlert,
    deleteJobAlert,
    showToast,
  } = usePortal();

  const [tab, setTab] = useState<DashTab>('overview');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [alertKeyword, setAlertKeyword] = useState('');
  const [alertLoc, setAlertLoc] = useState('');
  const [alertFreq, setAlertFreq] = useState<'Daily' | 'Weekly' | 'Instant'>('Daily');

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhone(userProfile.phone || '');
      setLocation(userProfile.location || '');
      setHeadline(userProfile.headline || '');
      setBio(userProfile.bio || '');
      setSkillsText((userProfile.skills || []).join(', '));
      setEducation(userProfile.education || []);
      setExperience(userProfile.experience || []);
    }
  }, [userProfile]);

  const profileCompletion = useMemo(() => {
    if (!userProfile) return 0;
    let score = 20;
    if (userProfile.phone) score += 10;
    if (userProfile.location) score += 10;
    if (userProfile.headline) score += 15;
    if (userProfile.skills && userProfile.skills.length > 0) score += 15;
    if (userProfile.education && userProfile.education.length > 0) score += 10;
    if (userProfile.experience && userProfile.experience.length > 0) score += 10;
    if (userProfile.resumeUrl) score += 10;
    return Math.min(100, score);
  }, [userProfile]);

  const recommendations = useMemo(() => {
    const approved = jobs.filter((j) => j.status === 'approved');
    const skills = (userProfile?.skills || []).map((s) => s.toLowerCase());
    if (skills.length === 0) return approved.slice(0, 3);
    return approved
      .map((j) => ({
        job: j,
        score: (j.skills || []).filter((s) => skills.includes(s.toLowerCase())).length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.job);
  }, [jobs, userProfile]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-sm text-slate-600">
        Loading your Job Seeker Dashboard...
      </div>
    );
  }

  if (!firebaseUser || !userProfile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#0B1B3B]">
          Sign in to View Your Dashboard
        </h1>
        <p className="text-sm text-slate-600">
          Track live job applications, manage your resume, and receive personalized job matches.
        </p>
        <Link
          to="/login"
          className="inline-block px-5 py-2.5 bg-blue-700 text-white text-sm font-semibold rounded-xl"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const skills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 30);
      await updateUserProfile({
        displayName: displayName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        skills,
        education: education.slice(0, 10),
        experience: experience.slice(0, 15),
      });
      showToast('Profile updated!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const storageRef = ref(storage, `avatars/${firebaseUser.uid}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateUserProfile({ photoUrl: url });
      showToast('Profile photo uploaded!', 'success');
    } catch {
      showToast('Storage upload failed. Check Firebase Storage configuration.', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const storageRef = ref(storage, `resumes/${firebaseUser.uid}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateUserProfile({ resumeUrl: url, resumeFileName: file.name });
      showToast('Resume uploaded to your profile!', 'success');
    } catch {
      showToast('Resume upload failed. Ensure Firebase Storage rules allow authenticated uploads.', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertKeyword.trim()) return;
    await createJobAlert({
      keyword: alertKeyword.trim(),
      location: alertLoc.trim(),
      category: '',
      frequency: alertFreq,
    });
    setAlertKeyword('');
    setAlertLoc('');
    showToast('Job alert created!', 'success');
  };

  const interviews = myApplications.filter((a) => a.status === 'Interview Scheduled');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <PageMeta
        title="Job Seeker Dashboard – Apna Role"
        description="Manage your candidate profile, resume, saved jobs, job alerts, and real-time application status."
      />

      {/* Email Verification Banner */}
      {!firebaseUser.emailVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-amber-900">
            <MailWarning className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Your email address ({firebaseUser.email}) is not verified yet. Please check your inbox and verify your email.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={async () => {
                await resendVerificationEmail();
                showToast('Verification email resent.', 'info');
              }}
              className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-amber-900 cursor-pointer"
            >
              Resend Email
            </button>
            <button
              type="button"
              onClick={async () => {
                const ok = await reloadAuthUser();
                showToast(ok ? 'Email verified!' : 'Still pending verification.', ok ? 'success' : 'info');
              }}
              className="px-3 py-1.5 bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Refresh Status
            </button>
          </div>
        </div>
      )}

      {/* Header & Completion Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-slate-200 overflow-hidden flex items-center justify-center text-lg font-bold text-[#0B1B3B] shrink-0">
            {userProfile.photoUrl ? (
              <img
                src={userProfile.photoUrl}
                alt={userProfile.displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              userProfile.displayName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[#0B1B3B]">
              {userProfile.displayName}
            </h1>
            <p className="text-sm text-slate-600">{userProfile.headline || 'Job Seeker'}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {userProfile.location || 'Location not set'} · {userProfile.email}
            </p>
          </div>
        </div>

        <div className="w-full md:w-64 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">Profile Completion</span>
            <span className="text-blue-700 tabular-nums">{profileCompletion}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-700 transition-all"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'overview', label: 'Overview', icon: Briefcase },
            { id: 'profile', label: 'Profile & Resume', icon: User },
            { id: 'applications', label: `Applied Jobs (${myApplications.length})`, icon: CheckCircle2 },
            { id: 'saved', label: `Saved Jobs (${savedJobs.length})`, icon: Bookmark },
            { id: 'alerts', label: `Job Alerts (${jobAlerts.length})`, icon: Bell },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer transition-colors ${
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

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Applied Jobs</p>
              <p className="font-mono text-2xl font-bold text-[#0B1B3B] mt-1 tabular-nums">
                {myApplications.length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Shortlisted / Interviews</p>
              <p className="font-mono text-2xl font-bold text-blue-700 mt-1 tabular-nums">
                {myApplications.filter((a) => ['Shortlisted', 'Interview Scheduled', 'Selected'].includes(a.status)).length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Saved Opportunities</p>
              <p className="font-mono text-2xl font-bold text-[#0B1B3B] mt-1 tabular-nums">
                {savedJobs.length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Active Job Alerts</p>
              <p className="font-mono text-2xl font-bold text-[#0B1B3B] mt-1 tabular-nums">
                {jobAlerts.length}
              </p>
            </div>
          </div>

          {interviews.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-3">
              <h2 className="font-display text-lg font-bold text-[#0B1B3B] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-700" />
                Upcoming Interview Invitations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {interviews.map((inv) => (
                  <div key={inv.id} className="bg-white border border-blue-200 rounded-xl p-4">
                    <p className="font-semibold text-sm text-[#0B1B3B]">{inv.jobTitle}</p>
                    <p className="text-xs text-slate-600">{inv.companyName}</p>
                    <p className="text-xs font-medium text-blue-700 mt-2">
                      Scheduled: {inv.interviewDate || 'TBD'} · {inv.interviewMode || 'Video'}
                    </p>
                    {inv.interviewLink && (
                      <a
                        href={inv.interviewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block mt-2 text-xs font-semibold text-blue-700 underline"
                      >
                        Join Interview Link
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-[#0B1B3B]">
                Recommended Jobs for You
              </h2>
              <Link to="/jobs" className="text-sm font-semibold text-blue-700 hover:underline">
                Explore All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recommendations.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile & Resume Tab */}
      {tab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <h2 className="font-display text-xl font-bold text-[#0B1B3B]">
                Profile &amp; Resume Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Recruiters view your skills, experience, and uploaded resume when you apply.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <Upload className="w-4 h-4" />
                {uploadingFile ? 'Uploading...' : 'Upload Photo'}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-800 hover:bg-blue-100 cursor-pointer">
                <Upload className="w-4 h-4" />
                {userProfile.resumeFileName ? `Replace Resume (${userProfile.resumeFileName})` : 'Upload Resume (PDF)'}
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current City</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bengaluru, Karnataka"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="React & Node.js Full-Stack Developer"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="React, TypeScript, Python, SQL, Communication"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">About / Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-3 text-sm"
              />
            </div>
          </div>

          {/* Education */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#0B1B3B]">Education Details</h3>
              <button
                type="button"
                onClick={() =>
                  setEducation([...education, { degree: '', institution: '', year: '', grade: '' }])
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Education
              </button>
            </div>
            {education.map((edu, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-slate-50 p-3 rounded-xl">
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => {
                    const next = [...education];
                    next[idx] = { ...edu, degree: e.target.value };
                    setEducation(next);
                  }}
                  placeholder="Degree"
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => {
                    const next = [...education];
                    next[idx] = { ...edu, institution: e.target.value };
                    setEducation(next);
                  }}
                  placeholder="College / University"
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={edu.year}
                  onChange={(e) => {
                    const next = [...education];
                    next[idx] = { ...edu, year: e.target.value };
                    setEducation(next);
                  }}
                  placeholder="Year"
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={edu.grade}
                  onChange={(e) => {
                    const next = [...education];
                    next[idx] = { ...edu, grade: e.target.value };
                    setEducation(next);
                  }}
                  placeholder="CGPA / %"
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setEducation(education.filter((_, i) => i !== idx))}
                  className="text-xs text-red-600 inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            ))}
          </div>

          {/* Work Experience */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#0B1B3B]">Work Experience</h3>
              <button
                type="button"
                onClick={() =>
                  setExperience([...experience, { title: '', company: '', duration: '', description: '' }])
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Experience
              </button>
            </div>
            {experience.map((exp, idx) => (
              <div key={idx} className="bg-slate-50 p-3 rounded-xl space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => {
                      const next = [...experience];
                      next[idx] = { ...exp, title: e.target.value };
                      setExperience(next);
                    }}
                    placeholder="Role"
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={exp.company}
                    onChange={(e) => {
                      const next = [...experience];
                      next[idx] = { ...exp, company: e.target.value };
                      setExperience(next);
                    }}
                    placeholder="Company"
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={exp.duration}
                    onChange={(e) => {
                      const next = [...experience];
                      next[idx] = { ...exp, duration: e.target.value };
                      setExperience(next);
                    }}
                    placeholder="Duration"
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setExperience(experience.filter((_, i) => i !== idx))}
                    className="text-xs text-red-600 inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={exp.description}
                  onChange={(e) => {
                    const next = [...experience];
                    next[idx] = { ...exp, description: e.target.value };
                    setExperience(next);
                  }}
                  placeholder="Key responsibilities and achievements..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-50"
            >
              {savingProfile ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Applications & Visual Tracker Tab */}
      {tab === 'applications' && (
        <div className="space-y-4">
          {myApplications.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
              <p className="text-sm text-slate-600">You haven’t applied to any jobs or internships yet.</p>
              <Link
                to="/jobs"
                className="inline-block px-5 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg"
              >
                Browse Jobs
              </Link>
            </div>
          ) : (
            myApplications.map((app) => {
              const pipelineSteps = APPLICATION_STATUSES.slice(0, 5);
              const currentIdx = pipelineSteps.indexOf(app.status);
              const isRejected = app.status === 'Rejected';

              return (
                <div key={app.id} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#0B1B3B]">{app.jobTitle}</h3>
                      <p className="text-sm text-slate-600">
                        {app.companyName} · {app.listingType === 'internship' ? 'Internship' : 'Job'}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg w-fit ${
                        isRejected
                          ? 'bg-red-50 text-red-700'
                          : app.status === 'Selected'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-blue-50 text-blue-800'
                      }`}
                    >
                      Status: {app.status}
                    </span>
                  </div>

                  {/* Visual Application Timeline */}
                  {!isRejected ? (
                    <div className="grid grid-cols-5 gap-2 pt-2">
                      {pipelineSteps.map((step, i) => {
                        const reached = currentIdx >= i;
                        return (
                          <div key={step} className="space-y-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                reached ? 'bg-blue-700' : 'bg-slate-200'
                              }`}
                            />
                            <p
                              className={`text-[11px] font-medium truncate ${
                                reached ? 'text-[#0B1B3B] font-semibold' : 'text-slate-400'
                              }`}
                            >
                              {step}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-red-600">
                      This application was closed by the recruiter. Keep applying to matched roles!
                    </p>
                  )}

                  {app.interviewDate && (
                    <p className="text-xs text-blue-800 bg-blue-50 rounded-lg p-3">
                      Interview: {app.interviewDate} ({app.interviewMode || 'Video'})
                      {app.interviewLink ? ` — Link: ${app.interviewLink}` : ''}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Saved Jobs Tab */}
      {tab === 'saved' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedJobs.length === 0 ? (
            <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-sm text-slate-600">No saved jobs yet. Bookmark any opportunity to track it here.</p>
            </div>
          ) : (
            savedJobs.map((s) => (
              <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-bold text-[#0B1B3B]">{s.jobTitle}</h3>
                  <p className="text-sm text-slate-600">{s.companyName}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {s.location} · {s.salaryDisplay}
                  </p>
                </div>
                <Link
                  to={s.listingType === 'internship' ? '/internships' : `/jobs/${s.jobId}`}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  View Opportunity →
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {/* Job Alerts Tab */}
      {tab === 'alerts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleAddAlert} className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4 h-fit">
            <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
              Create Custom Job Alert
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title or Skill</label>
              <input
                type="text"
                required
                minLength={2}
                value={alertKeyword}
                onChange={(e) => setAlertKeyword(e.target.value)}
                placeholder="e.g. React Developer, Data Analyst"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Location</label>
              <input
                type="text"
                value={alertLoc}
                onChange={(e) => setAlertLoc(e.target.value)}
                placeholder="e.g. Bengaluru or Remote"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
              <select
                value={alertFreq}
                onChange={(e) => setAlertFreq(e.target.value as 'Daily' | 'Weekly' | 'Instant')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="Daily">Daily Digest</option>
                <option value="Weekly">Weekly Roundup</option>
                <option value="Instant">Instant Alerts</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
            >
              Save Job Alert
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {jobAlerts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-600">
                No job alerts configured yet.
              </div>
            ) : (
              jobAlerts.map((al) => (
                <div key={al.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm text-[#0B1B3B]">{al.keyword}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {al.location || 'Any Location'} · {al.frequency}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteJobAlert(al.id)}
                    className="p-2 text-slate-400 hover:text-red-600 cursor-pointer"
                    aria-label="Delete job alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
