import { useEffect, useState } from 'react';
import { Button, Chip, MenuItem, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SearchField } from '../../components/SearchField';
import { FilterBar } from '../../components/FilterBar';
import { DataTable } from '../../components/DataTable';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchEmployees, setFilters, createEmployee } from '../../features/admin/employeesSlice';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useConfirm } from '../../hooks/useConfirm';
import { useAuth } from '../../hooks/useAuth';
import { showToast } from '../../features/ui/uiSlice';
import { ROLE, ROLE_LABEL, manageableRoles } from '../../constants/roles';
import { EmployeeFormDialog } from './EmployeeFormDialog';
import { TemporaryPasswordDialog } from './TemporaryPasswordDialog';

export default function EmployeeListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const auth = useAuth();
  const roleOptions = manageableRoles(auth);
  const { items, meta, filters, status } = useAppSelector((state) => state.employees);
  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createdInfo, setCreatedInfo] = useState(null);

  useEffect(() => {
    dispatch(setFilters({ search: debouncedSearch, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    dispatch(fetchEmployees(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, JSON.stringify(filters)]);

  const handleCreate = async (payload) => {
    const privileged = payload.role === ROLE.ADMIN || payload.role === ROLE.SUPER_ADMIN;
    // Extra confirmation when granting org-wide (Admin / Super Admin) access,
    // on top of the role-gated form and the backend's RBAC.
    if (privileged) {
      const ok = await confirm({
        title: `Create a new ${ROLE_LABEL[payload.role]}?`,
        message: `${payload.name} will have org-wide access to every project and lead${
          payload.role === ROLE.SUPER_ADMIN ? ', and will be able to manage Admins' : ''
        }. Are you sure?`,
        confirmLabel: `Create ${ROLE_LABEL[payload.role]}`,
        severity: 'warning',
      });
      if (!ok) return false;
    }

    const result = await dispatch(createEmployee(payload));
    if (createEmployee.fulfilled.match(result)) {
      dispatch(showToast(`${ROLE_LABEL[payload.role] || 'Employee'} created`, 'success'));
      dispatch(fetchEmployees(filters));
      setCreatedInfo(result.payload);
      return true;
    }
    dispatch(showToast(result.payload?.message || 'Create failed', 'error'));
    return false;
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    { field: 'mobileNumber', headerName: 'Mobile', width: 130 },
    {
      field: 'role',
      headerName: 'Role',
      width: 130,
      renderCell: (p) => {
        const color =
          p.value === ROLE.SUPER_ADMIN ? 'secondary' : p.value === ROLE.ADMIN ? 'primary' : 'default';
        return (
          <Chip
            label={ROLE_LABEL[p.value] || p.value}
            color={color}
            size="small"
            variant={p.value === ROLE.EMPLOYEE ? 'outlined' : 'filled'}
          />
        );
      },
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 110,
      renderCell: (p) => <Chip label={p.value ? 'Active' : 'Inactive'} color={p.value ? 'success' : 'default'} size="small" />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Team"
        actions={
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => setDialogOpen(true)}>
            New team member
          </Button>
        }
      />
      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search by name or email…" />
        {roleOptions.length > 1 && (
          <TextField
            select
            size="small"
            label="Role"
            value={filters.role || ''}
            onChange={(e) => dispatch(setFilters({ role: e.target.value, page: 1 }))}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All roles</MenuItem>
            {roleOptions.map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABEL[r]}
              </MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          select
          size="small"
          label="Status"
          value={filters.isActive}
          onChange={(e) => dispatch(setFilters({ isActive: e.target.value, page: 1 }))}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Inactive</MenuItem>
        </TextField>
      </FilterBar>
      <DataTable
        rows={items}
        columns={columns}
        loading={status === 'loading'}
        meta={meta}
        onPageModelChange={(model) => dispatch(setFilters(model))}
        onRowClick={(params) => navigate(`/admin/employees/${params.row._id}`)}
        emptyTitle="No team members yet"
        emptyDescription="Add employees or admins to start assigning them leads."
      />
      <EmployeeFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleCreate} />
      <TemporaryPasswordDialog
        open={Boolean(createdInfo)}
        onClose={() => setCreatedInfo(null)}
        employee={createdInfo?.employee}
        temporaryPassword={createdInfo?.temporaryPassword}
      />
    </>
  );
}
