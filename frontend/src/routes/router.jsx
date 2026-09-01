import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { LoadingState } from '../components/LoadingState';
import { PRIVILEGED_ROLES } from '../constants/roles';

const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const VerifyOtpPage = lazy(() => import('../pages/auth/VerifyOtpPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
// Hidden one-time route for creating the very first (primary) Super Admin.
// Self-disables once one exists (see the page + GET /auth/bootstrap-status).
const SetupSuperAdminPage = lazy(() => import('../pages/auth/SetupSuperAdminPage'));

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));

const ProjectListPage = lazy(() => import('../pages/projects/ProjectListPage'));
const ProjectDetailPage = lazy(() => import('../pages/projects/ProjectDetailPage'));

const LeadListPage = lazy(() => import('../pages/leads/LeadListPage'));
const LeadDetailPage = lazy(() => import('../pages/leads/LeadDetailPage'));

const AttendancePage = lazy(() => import('../pages/attendance/AttendancePage'));
const AttendanceReportPage = lazy(() => import('../pages/attendance/AttendanceReportPage'));

const EmployeeListPage = lazy(() => import('../pages/admin/EmployeeListPage'));
const EmployeeDetailPage = lazy(() => import('../pages/admin/EmployeeDetailPage'));

const MetaConnectionPage = lazy(() => import('../pages/social/MetaConnectionPage'));
const MetaOAuthCallbackPage = lazy(() => import('../pages/social/MetaOAuthCallbackPage'));
const CampaignsPage = lazy(() => import('../pages/social/CampaignsPage'));

const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

function withSuspense(Component) {
  return (
    <Suspense fallback={<LoadingState minHeight="60vh" />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: withSuspense(LoginPage) },
      { path: '/verify-otp', element: withSuspense(VerifyOtpPage) },
      { path: '/forgot-password', element: withSuspense(ForgotPasswordPage) },
      { path: '/reset-password', element: withSuspense(ResetPasswordPage) },
      { path: '/setup-super-admin', element: withSuspense(SetupSuperAdminPage) },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: withSuspense(DashboardPage) },
          { path: '/profile', element: withSuspense(ProfilePage) },
          { path: '/projects', element: withSuspense(ProjectListPage) },
          { path: '/projects/:id', element: withSuspense(ProjectDetailPage) },
          { path: '/leads', element: withSuspense(LeadListPage) },
          { path: '/leads/:id', element: withSuspense(LeadDetailPage) },
          { path: '/attendance', element: withSuspense(AttendancePage) },
          { path: '/attendance/report', element: withSuspense(AttendanceReportPage) },
          {
            element: <RoleRoute allow={PRIVILEGED_ROLES} />,
            children: [
              { path: '/admin/employees', element: withSuspense(EmployeeListPage) },
              { path: '/admin/employees/:id', element: withSuspense(EmployeeDetailPage) },
              { path: '/social/meta', element: withSuspense(MetaConnectionPage) },
              { path: '/social/meta/callback', element: withSuspense(MetaOAuthCallbackPage) },
              { path: '/social/campaigns', element: withSuspense(CampaignsPage) },
            ],
          },
          { path: '*', element: withSuspense(NotFoundPage) },
        ],
      },
    ],
  },
]);
