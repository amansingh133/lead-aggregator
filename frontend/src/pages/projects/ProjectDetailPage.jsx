import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { PageHeader } from '../../components/PageHeader';
import { LoadingState } from '../../components/LoadingState';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { clearProjectDetail, fetchProjectDetail, updateProject, removeProject } from '../../features/projects/projectsSlice';
import { useAuth } from '../../hooks/useAuth';
import { useConfirm } from '../../hooks/useConfirm';
import { showToast } from '../../features/ui/uiSlice';
import { formatDate } from '../../utils/formatters';
import { ProjectFormDialog } from './ProjectFormDialog';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const confirm = useConfirm();
  const { current: project, status } = useAppSelector((state) => state.projectDetail);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProjectDetail(id));
    return () => dispatch(clearProjectDetail());
  }, [dispatch, id]);

  const handleSubmit = async (values) => {
    const result = await dispatch(updateProject({ id, payload: values }));
    if (updateProject.fulfilled.match(result)) {
      dispatch(showToast('Project updated', 'success'));
      return true;
    }
    dispatch(showToast(result.payload?.message || 'Save failed', 'error'));
    return false;
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete project',
      message: `Delete "${project.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      severity: 'error',
    });
    if (!ok) return;
    const result = await dispatch(removeProject(id));
    if (removeProject.fulfilled.match(result)) {
      dispatch(showToast('Project deleted', 'success'));
      navigate('/projects');
    } else {
      dispatch(showToast(result.payload?.message || 'Delete failed (it may have linked leads)', 'error'));
    }
  };

  if (status === 'loading' || !project) return <LoadingState />;

  return (
    <>
      <PageHeader
        title={project.name}
        breadcrumbs={[{ label: 'Projects', to: '/projects' }, { label: project.name }]}
        actions={
          isAdmin && (
            <>
              <Button onClick={() => setDialogOpen(true)}>Edit</Button>
              <Button color="error" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )
        }
      />
      <Card variant="outlined" sx={{ maxWidth: 640 }}>
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip label={project.type} size="small" />
            <Chip
              label={project.isActive ? 'Active' : 'Inactive'}
              color={project.isActive ? 'success' : 'default'}
              size="small"
            />
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Location
              </Typography>
              <Typography variant="body1">{project.location || '—'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body1">{formatDate(project.createdAt)}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1">{project.description || '—'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <ProjectFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initialValues={project}
      />
    </>
  );
}
