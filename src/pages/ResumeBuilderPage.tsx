import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  Download,
  Printer,
  Save,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { useAuth } from '../context/AuthContext';
import { usePortal } from '../context/PortalContext';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { EducationEntry, ExperienceEntry, ProjectEntry } from '../types';

type TemplateType = 'executive' | 'modern' | 'minimal';

export function ResumeBuilderPage() {
  const { firebaseUser, userProfile } = useAuth();
  const { resumes, showToast } = usePortal();

  const [resumeTitle, setResumeTitle] = useState('Software Engineer Resume');
  const [template, setTemplate] = useState<TemplateType>('executive');
  const [fullName, setFullName] = useState(userProfile?.displayName || 'Aarav Sharma');
  const [email, setEmail] = useState(userProfile?.email || 'aarav.sharma@example.in');
  const [phone, setPhone] = useState(userProfile?.phone || '+91 98765 43210');
  const [location, setLocation] = useState(userProfile?.location || 'Bengaluru, Karnataka');
  const [linkedin, setLinkedin] = useState('linkedin.com/in/aarav-sharma');
  const [summary, setSummary] = useState(
    'Full-stack developer with strong foundations in React, TypeScript, and Node.js. Experienced in building accessible web applications and scalable REST APIs.'
  );
  const [skillsInput, setSkillsInput] = useState(
    (userProfile?.skills && userProfile.skills.length > 0
      ? userProfile.skills
      : ['React', 'TypeScript', 'Node.js', 'SQL', 'Tailwind CSS', 'Git']
    ).join(', ')
  );

  const [education, setEducation] = useState<EducationEntry[]>([
    {
      degree: 'B.Tech in Computer Science & Engineering',
      institution: 'National Institute of Technology',
      year: '2021 – 2025',
      grade: '8.7 CGPA',
    },
  ]);

  const [experience, setExperience] = useState<ExperienceEntry[]>([
    {
      title: 'Software Engineering Intern',
      company: 'IndusTech Solutions, Bengaluru',
      duration: 'Jan 2025 – Jun 2025',
      description: 'Built responsive merchant dashboard views in React and improved API response caching by 35%.',
    },
  ]);

  const [projects, setProjects] = useState<ProjectEntry[]>([
    {
      name: 'Smart Campus Placement Tracker',
      tech: 'React, Firebase, Express',
      link: 'github.com/aarav/placement-tracker',
      description: 'Real-time interview scheduling and application tracker supporting 400+ students.',
    },
  ]);

  const [certificationsText, setCertificationsText] = useState(
    'AWS Certified Cloud Practitioner\nMeta Front-End Developer Certificate'
  );
  const [achievementsText, setAchievementsText] = useState(
    'Finalist – Smart India Hackathon 2024\nSolved 350+ DSA problems on coding platforms'
  );

  const [targetJD, setTargetJD] = useState('');
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<{
    overallFeedback?: string;
    improvements?: string[];
    missingKeywords?: string[];
    matchedKeywords?: string[];
    tip?: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const skillsList = skillsInput
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const runAiAction = async (
    action: 'summary' | 'improve' | 'skills' | 'grammar' | 'keywords' | 'ats'
  ) => {
    setAiLoading(action);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          targetJobDescription: targetJD,
          resumeData: {
            fullName,
            summary,
            skills: skillsList,
            education,
            experience,
            projects,
            certifications: certificationsText.split('\n').filter(Boolean),
            achievements: achievementsText.split('\n').filter(Boolean),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || 'AI service returned an error.');
        return;
      }
      if (action === 'summary' && data.summary) {
        setSummary(data.summary);
        showToast('AI generated a tailored summary.', 'success');
      } else if (action === 'skills' && Array.isArray(data.skills)) {
        const merged = Array.from(new Set([...skillsList, ...data.skills]));
        setSkillsInput(merged.join(', '));
        showToast('Added AI-suggested relevant skills.', 'success');
      } else {
        setAiFeedback(data);
        if (data.rewrittenSummary) {
          setSummary(data.rewrittenSummary);
        }
        showToast('AI review completed.', 'success');
      }
    } catch {
      setAiError('Could not connect to AI service.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleSaveToCloud = async () => {
    if (!firebaseUser) {
      showToast('Please sign in to save your resume to your account.', 'info');
      return;
    }
    setSaving(true);
    const resumeId = `res_${firebaseUser.uid}_${Date.now()}`;
    try {
      await setDoc(doc(db, 'resumes', resumeId), {
        id: resumeId,
        userId: firebaseUser.uid,
        title: resumeTitle.trim().slice(0, 120) || 'My Resume',
        template,
        fullName: fullName.trim().slice(0, 120) || 'Candidate',
        email: email.trim().slice(0, 200),
        phone: phone.trim().slice(0, 40),
        location: location.trim().slice(0, 120),
        linkedin: linkedin.trim().slice(0, 300),
        summary: summary.trim().slice(0, 2500),
        skills: skillsList.slice(0, 35),
        education: education.slice(0, 10),
        experience: experience.slice(0, 15),
        projects: projects.slice(0, 15),
        certifications: certificationsText.split('\n').filter(Boolean).slice(0, 20),
        achievements: achievementsText.split('\n').filter(Boolean).slice(0, 20),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      showToast('Resume saved to your Apna Role profile.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `resumes/${resumeId}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    const docPdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 44;
    const maxWidth = 505;
    let y = 50;

    const addHeading = (text: string) => {
      if (y > 750) {
        docPdf.addPage();
        y = 50;
      }
      docPdf.setFont('helvetica', 'bold');
      docPdf.setFontSize(11);
      docPdf.setTextColor(11, 27, 59);
      docPdf.text(text.toUpperCase(), margin, y);
      y += 6;
      docPdf.setDrawColor(203, 213, 225);
      docPdf.line(margin, y, margin + maxWidth, y);
      y += 14;
    };

    const addWrapped = (text: string, size = 10, bold = false) => {
      docPdf.setFont('helvetica', bold ? 'bold' : 'normal');
      docPdf.setFontSize(size);
      docPdf.setTextColor(30, 41, 59);
      const lines = docPdf.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        if (y > 775) {
          docPdf.addPage();
          y = 50;
        }
        docPdf.text(line, margin, y);
        y += size + 4;
      }
    };

    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(20);
    docPdf.setTextColor(11, 27, 59);
    docPdf.text(fullName || 'Candidate Name', margin, y);
    y += 18;

    addWrapped(`${email}  |  ${phone}  |  ${location}  |  ${linkedin}`, 9);
    y += 8;

    if (summary.trim()) {
      addHeading('Professional Summary');
      addWrapped(summary.trim(), 10);
      y += 8;
    }

    if (skillsList.length > 0) {
      addHeading('Core Skills');
      addWrapped(skillsList.join(' • '), 10);
      y += 8;
    }

    if (experience.length > 0) {
      addHeading('Work Experience');
      for (const exp of experience) {
        addWrapped(`${exp.title} — ${exp.company} (${exp.duration})`, 10, true);
        if (exp.description) addWrapped(exp.description, 9.5);
        y += 4;
      }
      y += 4;
    }

    if (projects.length > 0) {
      addHeading('Projects');
      for (const proj of projects) {
        addWrapped(`${proj.name} (${proj.tech})`, 10, true);
        if (proj.description) addWrapped(proj.description, 9.5);
        y += 4;
      }
      y += 4;
    }

    if (education.length > 0) {
      addHeading('Education');
      for (const edu of education) {
        addWrapped(`${edu.degree} — ${edu.institution} (${edu.year}) | ${edu.grade}`, 10);
      }
      y += 8;
    }

    const certs = certificationsText.split('\n').filter(Boolean);
    if (certs.length > 0) {
      addHeading('Certifications');
      certs.forEach((c) => addWrapped(`• ${c}`, 9.5));
      y += 6;
    }

    const achs = achievementsText.split('\n').filter(Boolean);
    if (achs.length > 0) {
      addHeading('Achievements');
      achs.forEach((a) => addWrapped(`• ${a}`, 9.5));
    }

    docPdf.save(`${(fullName || 'ApnaRole_Resume').replace(/\s+/g, '_')}.pdf`);
    showToast('PDF downloaded!', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageMeta
        title="AI Resume Builder & ATS Optimizer – Apna Role"
        description="Build ATS-friendly Indian resumes from scratch with Gemini AI summary generation, keyword matching, grammar review, and PDF download."
      />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 no-print">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">
            AI Resume Builder
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Craft an ATS-friendly resume with live preview, AI optimization, cloud saving, and PDF download.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveToCloud}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
          >
            <Save className="w-4 h-4 text-blue-700" />
            {saving ? 'Saving...' : 'Save to Account'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Saved Resumes Quick Load */}
      {resumes.length > 0 && (
        <div className="mb-6 bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3 no-print">
          <span className="text-xs font-semibold text-slate-700">Saved Resumes:</span>
          {resumes.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setResumeTitle(r.title);
                setTemplate(r.template);
                setFullName(r.fullName);
                setEmail(r.email || '');
                setPhone(r.phone || '');
                setLocation(r.location || '');
                setLinkedin(r.linkedin || '');
                setSummary(r.summary || '');
                setSkillsInput((r.skills || []).join(', '));
                if (r.education) setEducation(r.education);
                if (r.experience) setExperience(r.experience);
                if (r.projects) setProjects(r.projects);
                if (r.certifications) setCertificationsText(r.certifications.join('\n'));
                if (r.achievements) setAchievementsText(r.achievements.join('\n'));
                showToast(`Loaded "${r.title}"`, 'info');
              }}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-blue-50 text-slate-800 rounded-lg cursor-pointer"
            >
              {r.title}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Column */}
        <div className="lg:col-span-6 space-y-6 no-print">
          {/* AI Assistant Panel */}
          <div className="bg-[#0B1B3B] text-white rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                AI Resume Optimization Suite
              </h2>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1.5">
                Target Job Description (Optional — improves keyword &amp; ATS matching)
              </label>
              <textarea
                rows={2}
                value={targetJD}
                onChange={(e) => setTargetJD(e.target.value)}
                placeholder="Paste job description or target role requirements here..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'summary', label: 'Generate Summary' },
                  { id: 'improve', label: 'Improve Content' },
                  { id: 'skills', label: 'Suggest Skills' },
                  { id: 'grammar', label: 'Check Grammar' },
                  { id: 'keywords', label: 'JD Keywords' },
                  { id: 'ats', label: 'ATS Suggestions' },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  disabled={aiLoading !== null}
                  onClick={() => runAiAction(btn.id)}
                  className="px-3 py-2 bg-slate-800 hover:bg-blue-700 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {aiLoading === btn.id ? 'Working...' : btn.label}
                </button>
              ))}
            </div>

            {aiError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            {aiFeedback && (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2.5 text-xs">
                {aiFeedback.overallFeedback && (
                  <p className="text-slate-200">{aiFeedback.overallFeedback}</p>
                )}
                {aiFeedback.tip && (
                  <p className="text-cyan-300">{aiFeedback.tip}</p>
                )}
                {aiFeedback.improvements && aiFeedback.improvements.length > 0 && (
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    {aiFeedback.improvements.map((imp, idx) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                )}
                {aiFeedback.missingKeywords && aiFeedback.missingKeywords.length > 0 && (
                  <div>
                    <p className="font-semibold text-amber-300">Missing Keywords to Add:</p>
                    <p className="text-slate-300 mt-0.5">{aiFeedback.missingKeywords.join(', ')}</p>
                  </div>
                )}
                {aiFeedback.matchedKeywords && aiFeedback.matchedKeywords.length > 0 && (
                  <p className="text-emerald-300 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Matched: {aiFeedback.matchedKeywords.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Template & Title */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resume Title</label>
                <input
                  type="text"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Template Style</label>
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as TemplateType)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="executive">Executive Navy</option>
                  <option value="modern">Modern Royal Accent</option>
                  <option value="minimal">Classic ATS Minimal</option>
                </select>
              </div>
            </div>

            <h3 className="font-display text-sm font-bold text-[#0B1B3B] pt-2">Personal Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full Name"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="LinkedIn / Portfolio URL"
                className="sm:col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Summary</label>
              <textarea
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Skills (comma-separated)
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#0B1B3B]">Experience</h3>
              <button
                type="button"
                onClick={() =>
                  setExperience([...experience, { title: '', company: '', duration: '', description: '' }])
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Role
              </button>
            </div>
            {experience.map((exp, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2 relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => {
                      const next = [...experience];
                      next[idx] = { ...exp, title: e.target.value };
                      setExperience(next);
                    }}
                    placeholder="Role Title"
                    className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
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
                    className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={exp.duration}
                    onChange={(e) => {
                      const next = [...experience];
                      next[idx] = { ...exp, duration: e.target.value };
                      setExperience(next);
                    }}
                    placeholder="Duration (e.g. 2024 – Present)"
                    className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setExperience(experience.filter((_, i) => i !== idx))}
                    className="text-xs text-red-600 inline-flex items-center gap-1 justify-end cursor-pointer"
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
                  placeholder="Impact and key deliverables..."
                  className="w-full bg-white border border-slate-200 rounded p-2 text-xs"
                />
              </div>
            ))}
          </div>

          {/* Projects & Education */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#0B1B3B]">Projects</h3>
              <button
                type="button"
                onClick={() => setProjects([...projects, { name: '', tech: '', description: '' }])}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </div>
            {projects.map((p, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => {
                      const next = [...projects];
                      next[idx] = { ...p, name: e.target.value };
                      setProjects(next);
                    }}
                    placeholder="Project Name"
                    className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                  />
                  <input
                    type="text"
                    value={p.tech}
                    onChange={(e) => {
                      const next = [...projects];
                      next[idx] = { ...p, tech: e.target.value };
                      setProjects(next);
                    }}
                    placeholder="Tech Stack"
                    className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                  />
                </div>
                <textarea
                  rows={2}
                  value={p.description}
                  onChange={(e) => {
                    const next = [...projects];
                    next[idx] = { ...p, description: e.target.value };
                    setProjects(next);
                  }}
                  placeholder="Project outcome..."
                  className="w-full bg-white border border-slate-200 rounded p-2 text-xs"
                />
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <h3 className="font-display text-sm font-bold text-[#0B1B3B]">Education</h3>
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
              <div key={idx} className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => {
                    const next = [...education];
                    next[idx] = { ...edu, degree: e.target.value };
                    setEducation(next);
                  }}
                  placeholder="Degree"
                  className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => {
                    const next = [...education];
                    next[idx] = { ...edu, institution: e.target.value };
                    setEducation(next);
                  }}
                  placeholder="University / College"
                  className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={edu.year}
                  onChange={(e) => {
                    const next = [...education];
                    next[idx] = { ...edu, year: e.target.value };
                    setEducation(next);
                  }}
                  placeholder="Years"
                  className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
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
                  className="bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                />
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Certifications (one per line)
                </label>
                <textarea
                  rows={3}
                  value={certificationsText}
                  onChange={(e) => setCertificationsText(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Achievements (one per line)
                </label>
                <textarea
                  rows={3}
                  value={achievementsText}
                  onChange={(e) => setAchievementsText(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Resume Preview Sheet */}
        <div className="lg:col-span-6">
          <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 shadow-sm print-only-resume sticky top-20">
            <header
              className={`pb-4 mb-5 ${
                template === 'executive'
                  ? 'border-b-2 border-[#0B1B3B]'
                  : template === 'modern'
                    ? 'border-b-2 border-blue-700'
                    : 'border-b border-slate-300'
              }`}
            >
              <h2
                className={`font-display text-2xl font-bold ${
                  template === 'modern' ? 'text-blue-800' : 'text-[#0B1B3B]'
                }`}
              >
                {fullName || 'Your Full Name'}
              </h2>
              <p className="text-xs text-slate-600 mt-1.5">
                {[email, phone, location, linkedin].filter(Boolean).join(' · ')}
              </p>
            </header>

            <div className="space-y-5 text-sm text-slate-800">
              {summary && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Summary
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-700">{summary}</p>
                </section>
              )}

              {skillsList.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Skills
                  </h3>
                  <p className="text-xs text-slate-800 font-medium">
                    {skillsList.join(' · ')}
                  </p>
                </section>
              )}

              {experience.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Experience
                  </h3>
                  <div className="space-y-3">
                    {experience.map((e, i) => (
                      <div key={i}>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-xs font-bold text-[#0B1B3B]">
                            {e.title} · {e.company}
                          </p>
                          <span className="text-[11px] text-slate-500 tabular-nums shrink-0">
                            {e.duration}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                          {e.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {projects.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Projects
                  </h3>
                  <div className="space-y-2.5">
                    {projects.map((p, i) => (
                      <div key={i}>
                        <p className="text-xs font-bold text-[#0B1B3B]">
                          {p.name} <span className="font-normal text-slate-500">({p.tech})</span>
                        </p>
                        <p className="text-xs text-slate-700 mt-0.5">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {education.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Education
                  </h3>
                  <div className="space-y-1.5">
                    {education.map((edu, i) => (
                      <div key={i} className="flex items-baseline justify-between gap-2 text-xs">
                        <span>
                          <strong className="text-[#0B1B3B]">{edu.degree}</strong> — {edu.institution}
                        </span>
                        <span className="text-slate-500 tabular-nums shrink-0">
                          {edu.year} · {edu.grade}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {certificationsText.trim() && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Certifications
                  </h3>
                  <ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5">
                    {certificationsText
                      .split('\n')
                      .filter(Boolean)
                      .map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                  </ul>
                </section>
              )}

              {achievementsText.trim() && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Achievements
                  </h3>
                  <ul className="list-disc pl-4 text-xs text-slate-700 space-y-0.5">
                    {achievementsText
                      .split('\n')
                      .filter(Boolean)
                      .map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                  </ul>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
