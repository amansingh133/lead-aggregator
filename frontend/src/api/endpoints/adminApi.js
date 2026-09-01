import axiosClient from '../axiosClient';

export const adminApi = {
  listEmployees: (params) => axiosClient.get('/admin/employees', { params }),
  getEmployee: (id) => axiosClient.get(`/admin/employees/${id}`),
  createEmployee: (payload) => axiosClient.post('/admin/employees', payload),
  updateEmployee: (id, payload) => axiosClient.put(`/admin/employees/${id}`, payload),
  removeEmployee: (id) => axiosClient.delete(`/admin/employees/${id}`),
  employeeMonthlyAttendance: (employeeId, params) =>
    axiosClient.get(`/admin/employees/${employeeId}/attendance/monthly`, { params }),
};
