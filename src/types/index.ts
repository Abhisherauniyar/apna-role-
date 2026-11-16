export type UserRole = 'job_seeker' | 'employer';

export type ApplicationStatus =
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Rejected';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Rejected',
];

export const JOB_CATEGORIES = [
  'IT & Software Development',
  'Web Development',
  'Digital Marketing',
  'Data Science & AI',
  'Banking & Finance',
  'Sales & Marketing',
  'Human Resources',
  'Government Jobs',
  'Teaching & Education',
  'Healthcare',
  'Customer Support',
  'Engineering',
  'Graphic Designing',
  'Content Writing',
  'Business & Management',
] as const;

export const INDIAN_LOCATIONS = [
  'Bengaluru, Karnataka',
  'Hyderabad, Telangana',
  'Pune, Maharashtra',
  'Mumbai, Maharashtra',
  'Delhi NCR / Gurugram',
  'Noida, Uttar Pradesh',
  'Chennai, Tamil Nadu',
  'Kolkata, West Bengal',
  'Ahmedabad, Gujarat',
  'Jaipur, Rajasthan',
  'Remote (India)',
] as const;

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
  grade: string;
}

export interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ProjectEntry {
  name: string;
  tech: string;
  link?: string;
  description: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  photoUrl?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  emailVerified?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  companyId?: string;
  designation: string;
  workEmail?: string;
  verified?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Company {
  id: string;
  ownerId: string;
  name: string;
  industry: string;
  location: string;
  size?: string;
  website?: string;
  logoUrl?: string;
  description: string;
  foundedYear?: string;
  verified: boolean;
  rating?: number;
  reviewCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  isPreview?: boolean;
}

export interface Job {
  id: string;
  companyId: string;
  employerId: string;
  companyName: string;
  companyLogo?: string;
  title: string;
  category: string;
  location: string;
  workMode: 'On-site' | 'Remote' | 'Hybrid';
  jobType: 'Full Time' | 'Part Time' | 'Internship' | 'Government' | 'Contract';
  experienceLevel: 'Fresher' | '1-3 Years' | '3-5 Years' | '5+ Years';
  salaryMin: number;
  salaryMax: number;
  salaryDisplay: string;
  description: string;
  responsibilities?: string[];
  skills?: string[];
  eligibility?: string;
  benefits?: string[];
  deadline?: string;
  status: 'approved' | 'pending' | 'rejected' | 'closed';
  featured: boolean;
  isFresher?: boolean;
  isGovernment?: boolean;
  applicantsCount?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
  isPreview?: boolean;
}

export interface Internship {
  id: string;
  companyId: string;
  employerId: string;
  companyName: string;
  companyLogo?: string;
  title: string;
  category: string;
  location: string;
  workMode: 'On-site' | 'Remote' | 'Hybrid';
  duration: string;
  stipend: number;
  stipendDisplay: string;
  isPaid: boolean;
  forStudents?: boolean;
  skills?: string[];
  description: string;
  deadline?: string;
  status: 'approved' | 'pending' | 'rejected' | 'closed';
  createdAt?: unknown;
  updatedAt?: unknown;
  isPreview?: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  listingType: 'job' | 'internship';
  jobTitle: string;
  companyId: string;
  companyName: string;
  employerId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateSkills?: string[];
  resumeUrl?: string;
  resumeFileName?: string;
  coverNote?: string;
  status: ApplicationStatus;
  interviewDate?: string;
  interviewMode?: string;
  interviewLink?: string;
  recruiterNotes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  listingType: 'job' | 'internship';
  jobTitle: string;
  companyName: string;
  location?: string;
  salaryDisplay?: string;
  createdAt?: unknown;
}

export interface ResumeDoc {
  id: string;
  userId: string;
  title: string;
  template: 'executive' | 'modern' | 'minimal';
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  summary?: string;
  skills?: string[];
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  projects?: ProjectEntry[];
  certifications?: string[];
  achievements?: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'application' | 'interview' | 'alert' | 'system';
  link?: string;
  read: boolean;
  createdAt?: unknown;
}

export interface CompanyReview {
  id: string;
  companyId: string;
  userId: string;
  authorName: string;
  roleTitle?: string;
  rating: number;
  title: string;
  pros?: string;
  cons?: string;
  createdAt?: unknown;
}

export interface JobAlert {
  id: string;
  userId: string;
  keyword: string;
  location?: string;
  category?: string;
  frequency: 'Daily' | 'Weekly' | 'Instant';
  active: boolean;
  createdAt?: unknown;
}

export interface JobReport {
  id: string;
  jobId: string;
  jobTitle?: string;
  reporterId: string;
  reason: string;
  details?: string;
  status: 'open' | 'reviewed' | 'dismissed' | 'action_taken';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CategoryDoc {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt?: unknown;
}

export interface EmailLog {
  id: string;
  applicationId: string;
  candidateId: string;
  employerId: string;
  recipientEmail: string;
  statusTriggered: 'Shortlisted' | 'Interview Scheduled';
  subject: string;
  deliveryStatus: 'sent' | 'failed' | 'failed_missing_smtp';
  messageId?: string;
  errorMessage?: string;
  createdAt?: unknown;
}

