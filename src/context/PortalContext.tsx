import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  AppNotification,
  Application,
  CategoryDoc,
  Company,
  CompanyReview,
  Internship,
  JOB_CATEGORIES,
  Job,
  JobAlert,
  ResumeDoc,
  SavedJob,
} from '../types';
import {
  STARTER_COMPANIES,
  STARTER_INTERNSHIPS,
  STARTER_JOBS,
} from '../data/catalog';

export interface ToastMessage {
  id: string;
  text: string;
  tone: 'success' | 'error' | 'info';
}

interface PortalContextValue {
  companies: Company[];
  jobs: Job[];
  internships: Internship[];
  categories: string[];
  categoryDocs: CategoryDoc[];
  reviews: CompanyReview[];
  savedJobs: SavedJob[];
  myApplications: Application[];
  employerApplications: Application[];
  notifications: AppNotification[];
  jobAlerts: JobAlert[];
  resumes: ResumeDoc[];
  compareJobs: Job[];
  isUsingStarterPreview: boolean;
  dataLoading: boolean;
  toasts: ToastMessage[];
  showToast: (text: string, tone?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  toggleCompareJob: (job: Job) => void;
  clearCompareJobs: () => void;
  isJobSaved: (jobId: string) => boolean;
  toggleSaveJob: (item: {
    id: string;
    listingType: 'job' | 'internship';
    title: string;
    companyName: string;
    location: string;
    salaryDisplay: string;
  }) => Promise<void>;
  applyToListing: (payload: {
    listingId: string;
    listingType: 'job' | 'internship';
    title: string;
    companyId: string;
    companyName: string;
    employerId: string;
    coverNote: string;
    resumeUrl?: string;
    resumeFileName?: string;
  }) => Promise<void>;
  reportListing: (payload: {
    jobId: string;
    jobTitle: string;
    reason: string;
    details: string;
  }) => Promise<void>;
  submitCompanyReview: (payload: {
    companyId: string;
    roleTitle: string;
    rating: number;
    title: string;
    pros: string;
    cons: string;
  }) => Promise<void>;
  createJobAlert: (payload: {
    keyword: string;
    location: string;
    category: string;
    frequency: 'Daily' | 'Weekly' | 'Instant';
  }) => Promise<void>;
  deleteJobAlert: (alertId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  seedStarterCatalog: () => Promise<void>;
}

const PortalContext = createContext<PortalContextValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, userProfile, isAdmin } = useAuth();

  const [liveCompanies, setLiveCompanies] = useState<Company[]>([]);
  const [liveJobs, setLiveJobs] = useState<Job[]>([]);
  const [liveInternships, setLiveInternships] = useState<Internship[]>([]);
  const [categoryDocs, setCategoryDocs] = useState<CategoryDoc[]>([]);
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [employerApplications, setEmployerApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [jobAlerts, setJobAlerts] = useState<JobAlert[]>([]);
  const [resumes, setResumes] = useState<ResumeDoc[]>([]);
  const [compareJobs, setCompareJobs] = useState<Job[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (text: string, tone: 'success' | 'error' | 'info' = 'info') => {
      const id = makeId('toast');
      setToasts((prev) => [...prev, { id, text, tone }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Public Firestore listeners
  useEffect(() => {
    const unsubCompanies = onSnapshot(
      collection(db, 'companies'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Company));
        setLiveCompanies(list);
      },
      (err) => {
        console.error('Companies listener error:', err);
      }
    );

    const unsubJobs = onSnapshot(
      collection(db, 'jobs'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job));
        setLiveJobs(list);
        setDataLoading(false);
      },
      (err) => {
        console.error('Jobs listener error:', err);
        setDataLoading(false);
      }
    );

    const unsubInternships = onSnapshot(
      collection(db, 'internships'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Internship));
        setLiveInternships(list);
      },
      (err) => console.error('Internships listener error:', err)
    );

    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snap) => {
        setCategoryDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CategoryDoc)));
      },
      (err) => console.error('Categories listener error:', err)
    );

    const unsubReviews = onSnapshot(
      collection(db, 'reviews'),
      (snap) => {
        setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CompanyReview)));
      },
      (err) => console.error('Reviews listener error:', err)
    );

    return () => {
      unsubCompanies();
      unsubJobs();
      unsubInternships();
      unsubCategories();
      unsubReviews();
    };
  }, []);

  // Authenticated user Firestore listeners
  useEffect(() => {
    if (!firebaseUser) {
      setSavedJobs([]);
      setMyApplications([]);
      setEmployerApplications([]);
      setNotifications([]);
      setJobAlerts([]);
      setResumes([]);
      return;
    }

    const uid = firebaseUser.uid;

    const unsubSaved = onSnapshot(
      query(collection(db, 'savedJobs'), where('userId', '==', uid)),
      (snap) => setSavedJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedJob))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'savedJobs')
    );

    const unsubCandidateApps = onSnapshot(
      query(collection(db, 'applications'), where('candidateId', '==', uid)),
      (snap) => setMyApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Application))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'applications')
    );

    const unsubEmployerApps = onSnapshot(
      query(collection(db, 'applications'), where('employerId', '==', uid)),
      (snap) =>
        setEmployerApplications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Application))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'applications')
    );

    const unsubNotifications = onSnapshot(
      query(collection(db, 'notifications'), where('userId', '==', uid)),
      (snap) =>
        setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'notifications')
    );

    const unsubAlerts = onSnapshot(
      query(collection(db, 'jobAlerts'), where('userId', '==', uid)),
      (snap) => setJobAlerts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as JobAlert))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'jobAlerts')
    );

    const unsubResumes = onSnapshot(
      query(collection(db, 'resumes'), where('userId', '==', uid)),
      (snap) => setResumes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ResumeDoc))),
      (err) => handleFirestoreError(err, OperationType.LIST, 'resumes')
    );

    return () => {
      unsubSaved();
      unsubCandidateApps();
      unsubEmployerApps();
      unsubNotifications();
      unsubAlerts();
      unsubResumes();
    };
  }, [firebaseUser]);

  const isUsingStarterPreview =
    !dataLoading && liveJobs.length === 0 && liveCompanies.length === 0;

  const companies = liveCompanies.length > 0 ? liveCompanies : STARTER_COMPANIES;
  const jobs = liveJobs.length > 0 ? liveJobs : STARTER_JOBS;
  const internships = liveInternships.length > 0 ? liveInternships : STARTER_INTERNSHIPS;

  const categories =
    categoryDocs.filter((c) => c.active).length > 0
      ? categoryDocs.filter((c) => c.active).map((c) => c.name)
      : [...JOB_CATEGORIES];

  const isJobSaved = useCallback(
    (jobId: string) => savedJobs.some((s) => s.jobId === jobId),
    [savedJobs]
  );

  const toggleSaveJob = async (item: {
    id: string;
    listingType: 'job' | 'internship';
    title: string;
    companyName: string;
    location: string;
    salaryDisplay: string;
  }) => {
    if (!firebaseUser) {
      showToast('Please sign in to save opportunities.', 'info');
      return;
    }
    const existing = savedJobs.find((s) => s.jobId === item.id);
    if (existing) {
      try {
        await deleteDoc(doc(db, 'savedJobs', existing.id));
        showToast('Removed from saved jobs.', 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `savedJobs/${existing.id}`);
      }
      return;
    }
    const savedId = `${firebaseUser.uid}_${item.id}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    try {
      await setDoc(doc(db, 'savedJobs', savedId), {
        id: savedId,
        userId: firebaseUser.uid,
        jobId: item.id,
        listingType: item.listingType,
        jobTitle: item.title.slice(0, 160),
        companyName: item.companyName.slice(0, 140),
        location: item.location.slice(0, 120),
        salaryDisplay: item.salaryDisplay.slice(0, 80),
        createdAt: serverTimestamp(),
      });
      showToast('Saved to your dashboard.', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `savedJobs/${savedId}`);
    }
  };

  const applyToListing = async (payload: {
    listingId: string;
    listingType: 'job' | 'internship';
    title: string;
    companyId: string;
    companyName: string;
    employerId: string;
    coverNote: string;
    resumeUrl?: string;
    resumeFileName?: string;
  }) => {
    if (!firebaseUser || !userProfile) {
      throw new Error('Please sign in to apply.');
    }
    const alreadyApplied = myApplications.some((a) => a.jobId === payload.listingId);
    if (alreadyApplied) {
      throw new Error('You have already applied for this opportunity.');
    }
    const appId = makeId('app');
    try {
      await setDoc(doc(db, 'applications', appId), {
        id: appId,
        jobId: payload.listingId,
        listingType: payload.listingType,
        jobTitle: payload.title.slice(0, 160),
        companyId: payload.companyId,
        companyName: payload.companyName.slice(0, 140),
        employerId: payload.employerId,
        candidateId: firebaseUser.uid,
        candidateName: userProfile.displayName.slice(0, 120),
        candidateEmail: userProfile.email.slice(0, 200),
        candidatePhone: (userProfile.phone || '').slice(0, 30),
        candidateSkills: (userProfile.skills || []).slice(0, 30),
        resumeUrl: (payload.resumeUrl || userProfile.resumeUrl || '').slice(0, 1000),
        resumeFileName: (payload.resumeFileName || userProfile.resumeFileName || '').slice(0, 200),
        coverNote: payload.coverNote.slice(0, 2000),
        status: 'Applied',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (payload.employerId && payload.employerId !== 'system_seed') {
        const notifId = makeId('notif');
        await setDoc(doc(db, 'notifications', notifId), {
          id: notifId,
          userId: payload.employerId,
          title: 'New Candidate Application',
          message: `${userProfile.displayName} applied for ${payload.title}`,
          type: 'application',
          link: '/employer',
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      const selfNotifId = makeId('notif');
      await setDoc(doc(db, 'notifications', selfNotifId), {
        id: selfNotifId,
        userId: firebaseUser.uid,
        title: 'Application Submitted',
        message: `Your application for ${payload.title} at ${payload.companyName} was sent.`,
        type: 'application',
        link: '/dashboard',
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `applications/${appId}`);
    }
  };

  const reportListing = async (payload: {
    jobId: string;
    jobTitle: string;
    reason: string;
    details: string;
  }) => {
    if (!firebaseUser) throw new Error('Sign in required to submit a report.');
    const reportId = makeId('rep');
    try {
      await setDoc(doc(db, 'reports', reportId), {
        id: reportId,
        jobId: payload.jobId,
        jobTitle: payload.jobTitle.slice(0, 160),
        reporterId: firebaseUser.uid,
        reason: payload.reason.slice(0, 120),
        details: payload.details.slice(0, 1500),
        status: 'open',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reports/${reportId}`);
    }
  };

  const submitCompanyReview = async (payload: {
    companyId: string;
    roleTitle: string;
    rating: number;
    title: string;
    pros: string;
    cons: string;
  }) => {
    if (!firebaseUser || !userProfile) throw new Error('Sign in required to submit a review.');
    const revId = makeId('rev');
    try {
      await setDoc(doc(db, 'reviews', revId), {
        id: revId,
        companyId: payload.companyId,
        userId: firebaseUser.uid,
        authorName: userProfile.displayName.slice(0, 120),
        roleTitle: payload.roleTitle.slice(0, 120),
        rating: Math.min(5, Math.max(1, Math.round(payload.rating))),
        title: payload.title.slice(0, 140),
        pros: payload.pros.slice(0, 1000),
        cons: payload.cons.slice(0, 1000),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reviews/${revId}`);
    }
  };

  const createJobAlert = async (payload: {
    keyword: string;
    location: string;
    category: string;
    frequency: 'Daily' | 'Weekly' | 'Instant';
  }) => {
    if (!firebaseUser) throw new Error('Sign in required to create job alerts.');
    const alertId = makeId('alert');
    try {
      await setDoc(doc(db, 'jobAlerts', alertId), {
        id: alertId,
        userId: firebaseUser.uid,
        keyword: payload.keyword.slice(0, 120),
        location: payload.location.slice(0, 120),
        category: payload.category.slice(0, 80),
        frequency: payload.frequency,
        active: true,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `jobAlerts/${alertId}`);
    }
  };

  const deleteJobAlert = async (alertId: string) => {
    try {
      await deleteDoc(doc(db, 'jobAlerts', alertId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `jobAlerts/${alertId}`);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${notificationId}`);
    }
  };

  const toggleCompareJob = (job: Job) => {
    setCompareJobs((prev) => {
      if (prev.some((j) => j.id === job.id)) {
        return prev.filter((j) => j.id !== job.id);
      }
      if (prev.length >= 3) {
        showToast('You can compare up to 3 jobs at once.', 'info');
        return prev;
      }
      return [...prev, job];
    });
  };

  const clearCompareJobs = () => setCompareJobs([]);

  const seedStarterCatalog = async () => {
    if (!firebaseUser || !isAdmin) {
      throw new Error('Admin privileges required to seed starter catalog.');
    }
    const batch = writeBatch(db);
    for (const co of STARTER_COMPANIES) {
      const { isPreview: _p, ...cleanCo } = co;
      batch.set(doc(db, 'companies', co.id), {
        ...cleanCo,
        ownerId: firebaseUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    for (const job of STARTER_JOBS) {
      const { isPreview: _p, ...cleanJob } = job;
      batch.set(doc(db, 'jobs', job.id), {
        ...cleanJob,
        employerId: firebaseUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    for (const intern of STARTER_INTERNSHIPS) {
      const { isPreview: _p, ...cleanInt } = intern;
      batch.set(doc(db, 'internships', intern.id), {
        ...cleanInt,
        employerId: firebaseUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    for (const catName of JOB_CATEGORIES) {
      const catId = `cat_${catName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      batch.set(doc(db, 'categories', catId), {
        id: catId,
        name: catName,
        slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        active: true,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  };

  return (
    <PortalContext.Provider
      value={{
        companies,
        jobs,
        internships,
        categories,
        categoryDocs,
        reviews,
        savedJobs,
        myApplications,
        employerApplications,
        notifications,
        jobAlerts,
        resumes,
        compareJobs,
        isUsingStarterPreview,
        dataLoading,
        toasts,
        showToast,
        dismissToast,
        toggleCompareJob,
        clearCompareJobs,
        isJobSaved,
        toggleSaveJob,
        applyToListing,
        reportListing,
        submitCompanyReview,
        createJobAlert,
        deleteJobAlert,
        markNotificationRead,
        seedStarterCatalog,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalProvider');
  return ctx;
}
