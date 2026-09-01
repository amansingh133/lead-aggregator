import { useEffect, useState } from 'react';
import { Button, Chip, MenuItem, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SearchField } from '../../components/SearchField';
import { FilterBar } from '../../components/FilterBar';
import { DataTable } from '../../components/DataTable';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchProjects, setFilters, createProject, updateProject, removeProject } from '../../features/projects/projectsSlice';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../hooks/useConfirm';
import { showToast } from '../../features/ui/uiSlice';
import { PROJECT_TYPE } from '../../constants/projectType';
import { ProjectFormDialog } from './ProjectFormDialog';

export default function ProjectListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const confirm = useConfirm();
  const { items, meta, filters, status } = useAppSelector((state) => state.projects);
  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    dispatch(setFilters({ search: debouncedSearch, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    dispatch(fetchProjects(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, JSON.stringify(filters)]);

  const handleSubmit = async (values) => {
    const action = editing
      ? updateProject({ id: editing._id, payload: values })
      : createProject(values);
    const result = await dispatch(action);
    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(showToast(editing ? 'Project updated' : 'Project created', 'success'));
      dispatch(fetchProjects(filters));
      return true;
    }
    dispatch(showToast(result.payload?.message || 'Save failed', 'error'));
    return false;
  };

  const handleDelete = async (project) => {
    const ok = await confirm({
      title: 'Delete project',
      message: `Delete "${project.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      severity: 'error',
    });
    if (!ok) return;
    const result = await dispatch(removeProject(project._id));
    if (removeProject.fulfilled.match(result)) {
      dispatch(showToast('Project deleted', 'success'));
      dispatch(fetchProjects(filters));
    } else {
      dispatch(showToast(result.payload?.message || 'Delete failed (it may have linked leads)', 'error'));
    }
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1.2, minWidth: 160 },
    { field: 'type', headerName: 'Type', width: 120 },
    { field: 'location', headerName: 'Location', flex: 1, minWidth: 140 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    ...(isAdmin
      ? [
          {
            field: 'actions',
            headerName: 'Actions',
            width: 190,
            sortable: false,
            renderCell: (params) => (
              <>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(params.row);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(params.row);
                  }}
                >
                  Delete
                </Button>
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        actions={
          isAdmin && (
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              New project
            </Button>
          )
        }
      />
      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search projects…" />
        <TextField
          select
          size="small"
          label="Type"
          value={filters.type}
          onChange={(e) => dispatch(setFilters({ type: e.target.value, page: 1 }))}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All types</MenuItem>
          {PROJECT_TYPE.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>
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
        onRowClick={(params) => navigate(`/projects/${params.row._id}`)}
        emptyTitle="No projects yet"
        emptyDescription={isAdmin ? 'Create your first project to start assigning leads.' : 'Ask an admin to create a project.'}
      />
      <ProjectFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initialValues={editing}
      />
    </>
  );
}
