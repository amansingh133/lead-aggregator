import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';
import { projectsReducer, projectDetailReducer } from '../features/projects/projectsSlice';
import { leadsReducer, leadDetailReducer } from '../features/leads/leadsSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import attendanceReducer from '../features/attendance/attendanceSlice';
import { employeesReducer, employeeDetailReducer } from '../features/admin/employeesSlice';
import metaConnectionReducer from '../features/social/metaConnectionSlice';
import campaignsReducer from '../features/social/campaignsSlice';
import { attachStore } from '../api/axiosClient';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    projects: projectsReducer,
    projectDetail: projectDetailReducer,
    leads: leadsReducer,
    leadDetail: leadDetailReducer,
    dashboard: dashboardReducer,
    attendance: attendanceReducer,
    employees: employeesReducer,
    employeeDetail: employeeDetailReducer,
    // Facebook Lead Ads integration
    metaConnection: metaConnectionReducer,
    campaigns: campaignsReducer,
  },
});

// axiosClient needs the store for the auth-header/401 interceptors, but
// store.js also pulls in slices that import axiosClient's endpoints —
// wiring it here (after creation) avoids a circular import at module-load time.
attachStore(store);
