import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { PortalProvider } from './context/PortalContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CompareDrawer } from './components/CompareDrawer';
import { ToastContainer } from './components/ToastContainer';
import { HomePage } from './pages/HomePage';

const JobsPage = lazy(() => import('./pages/JobsPage').then((m) => ({ default: m.JobsPage })));
const JobDetailsPage = lazy(() =>
  import('./pages/JobDetailsPage').then((m) => ({ default: m.JobDetailsPage }))
);
const CompaniesPage = lazy(() =>
  import('./pages/CompaniesPage').then((m) => ({ default: m.CompaniesPage }))
);
const CompanyDetailsPage = lazy(() =>
  import('./pages/CompanyDetailsPage').then((m) => ({ default: m.CompanyDetailsPage }))
);
const InternshipsPage = lazy(() =>
  import('./pages/InternshipsPage').then((m) => ({ default: m.InternshipsPage }))
);
const ResumeBuilderPage = lazy(() =>
  import('./pages/ResumeBuilderPage').then((m) => ({ default: m.ResumeBuilderPage }))
);
const CareerGuidancePage = lazy(() =>
  import('./pages/CareerGuidancePage').then((m) => ({ default: m.CareerGuidancePage }))
);
const InterviewPrepPage = lazy(() =>
  import('./pages/InterviewPrepPage').then((m) => ({ default: m.InterviewPrepPage }))
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const JobSeekerDashboardPage = lazy(() =>
  import('./pages/JobSeekerDashboardPage').then((m) => ({ default: m.JobSeekerDashboardPage }))
);
const EmployerDashboardPage = lazy(() =>
  import('./pages/EmployerDashboardPage').then((m) => ({ default: m.EmployerDashboardPage }))
);
const AdminDashboardPage = lazy(() =>
  import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AboutPage = lazy(() =>
  import('./pages/StaticPages').then((m) => ({ default: m.AboutPage }))
);
const ContactPage = lazy(() =>
  import('./pages/StaticPages').then((m) => ({ default: m.ContactPage }))
);
const PrivacyPolicyPage = lazy(() =>
  import('./pages/StaticPages').then((m) => ({ default: m.PrivacyPolicyPage }))
);
const TermsPage = lazy(() =>
  import('./pages/StaticPages').then((m) => ({ default: m.TermsPage }))
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sm text-slate-500">
      Loading page...
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PortalProvider>
          <BrowserRouter>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
              <Navbar />
              <main className="flex-1">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/jobs" element={<JobsPage />} />
                    <Route path="/jobs/:id" element={<JobDetailsPage />} />
                    <Route path="/companies" element={<CompaniesPage />} />
                    <Route path="/companies/:id" element={<CompanyDetailsPage />} />
                    <Route path="/internships" element={<InternshipsPage />} />
                    <Route path="/resume-builder" element={<ResumeBuilderPage />} />
                    <Route path="/career-guidance" element={<CareerGuidancePage />} />
                    <Route path="/interview-prep" element={<InterviewPrepPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/dashboard" element={<JobSeekerDashboardPage />} />
                    <Route path="/employer" element={<EmployerDashboardPage />} />
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="*" element={<HomePage />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <CompareDrawer />
              <ToastContainer />
            </div>
          </BrowserRouter>
        </PortalProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
