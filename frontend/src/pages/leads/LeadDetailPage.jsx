import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { PageHeader } from '../../components/PageHeader';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { StatusChip } from '../../components/StatusChip';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { clearLeadDetail, fetchLeadDetail, updateLead, addFollowUp } from '../../features/leads/leadsSlice';
import { fetchProjects } from '../../features/projects/projectsSlice';
import { fetchEmployees } from '../../features/admin/employeesSlice';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import { ROLE } from '../../constants/roles';
import { showToast } from '../../features/ui/uiSlice';
import { LEAD_TYPE } from '../../constants/leadStatus';
import { formatDateTime } from '../../utils/formatters';
import { FollowUpForm } from './FollowUpForm';

function InfoField({ label, value }) {
  return (
    <Grid item xs={12} sm={6} md={4} sx={{ minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" sx={{ overflowWrap: 'anywhere' }}>
        {value ?? '—'}
      </Typography>
    </Grid>
  );
}

// Fallback label for an Instant Form answer when the backend didn't resolve
// the advertiser's question text ("preferred_locality" -> "Preferred Locality").
const humanizeKey = (k) =>
  String(k || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function LeadDetailPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { isAdmin } = useAuth();
  const { lead, followUpHistory, status } = useAppSelector((state) => state.leadDetail);
  const projects = useAppSelector((state) => state.projects.items);
  const employees = useAppSelector((state) => state.employees.items);

  useEffect(() => {
    dispatch(fetchLeadDetail(id));
    dispatch(fetchProjects({ limit: 100 }));
    if (isAdmin) dispatch(fetchEmployees({ limit: 100, role: ROLE.EMPLOYEE }));
    return () => dispatch(clearLeadDetail());
  }, [dispatch, id, isAdmin]);

  const editForm = useForm({
    alternateNumber: '',
    project: '',
    type: '',
    budget: '',
    source: '',
    location: '',
    remarks: '',
    assignedTo: '',
    // Social-lead "fill once" contact fields (only editable while empty).
    name: '',
    email: '',
    mobileNumber: '',
  });

  useEffect(() => {
    if (lead) {
      editForm.setValues({
        alternateNumber: lead.alternateNumber || '',
        project: lead.project?._id || '',
        type: lead.type || '',
        budget: lead.budget ?? '',
        source: lead.source || '',
        location: lead.location || '',
        remarks: lead.remarks || '',
        assignedTo: lead.assignedTo?._id || '',
        name: lead.name || '',
        email: lead.email || '',
        mobileNumber: lead.mobileNumber || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?._id]);

  if (status === 'loading' || !lead) return <LoadingState />;

  const isEnriched = Boolean(lead.project && lead.type);
  // A social-lead contact field can be filled in once, only while still empty.
  const canFill = (field) => lead.origin === 'social' && isAdmin && !lead[field];

  const handleSaveDetails = async () => {
    const payload = {
      alternateNumber: editForm.values.alternateNumber,
      project: editForm.values.project || undefined,
      type: editForm.values.type || undefined,
      budget: editForm.values.budget === '' ? undefined : Number(editForm.values.budget),
      source: editForm.values.source,
      location: editForm.values.location,
      remarks: editForm.values.remarks,
      ...(isAdmin ? { assignedTo: editForm.values.assignedTo || undefined } : {}),
      ...(canFill('name') && editForm.values.name.trim()
        ? { name: editForm.values.name.trim() }
        : {}),
      ...(canFill('email') && editForm.values.email.trim()
        ? { email: editForm.values.email.trim() }
        : {}),
      ...(canFill('mobileNumber') && editForm.values.mobileNumber.trim()
        ? { mobileNumber: editForm.values.mobileNumber.trim() }
        : {}),
    };
    const result = await dispatch(updateLead({ id, payload }));
    if (updateLead.fulfilled.match(result)) {
      dispatch(showToast('Lead updated', 'success'));
    } else {
      dispatch(showToast(result.payload?.message || 'Update failed', 'error'));
    }
  };

  const handleAddFollowUp = async (payload) => {
    const result = await dispatch(addFollowUp({ leadId: id, payload }));
    if (addFollowUp.fulfilled.match(result)) {
      dispatch(showToast('Follow-up logged', 'success'));
      return true;
    }
    dispatch(showToast(result.payload?.message || 'Could not log follow-up', 'error'));
    return false;
  };

  return (
    <>
      <PageHeader
        title={lead.name}
        breadcrumbs={[{ label: 'Leads', to: '/leads' }, { label: lead.name }]}
        actions={
          <Stack direction="row" spacing={1}>
            <StatusChip status={lead.status} />
            <Chip
              size="small"
              variant="outlined"
              label={lead.origin === 'social' ? lead.social?.platform || 'social' : 'manual'}
            />
          </Stack>
        }
      />

      {lead.origin === 'social' && lead.social && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h6">Facebook Lead Ad</Typography>
                <Chip size="small" label={lead.social.platform || 'facebook'} />
              </Stack>
              <Grid container spacing={1.5}>
                <InfoField label="Campaign" value={lead.social.campaignName || lead.social.campaignId} />
                <InfoField label="Ad set" value={lead.social.adsetName || lead.social.adsetId} />
                <InfoField label="Ad" value={lead.social.adName || lead.social.adId} />
                <InfoField label="Form ID" value={lead.social.formId} />
              </Grid>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">Instant Form answers</Typography>
              {Array.isArray(lead.social.fieldData) && lead.social.fieldData.length > 0 ? (
                <Stack spacing={0.75}>
                  {lead.social.fieldData.map((f) => (
                    <Stack key={f.name} direction="row" spacing={1}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>
                        {f.label || humanizeKey(f.name)}
                      </Typography>
                      <Typography variant="body2">
                        {(f.values || []).join(', ') || '—'}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No form answers were captured for this lead.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {!isEnriched && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This lead came in via social media and hasn&apos;t been assigned a project/type yet.
          {isAdmin
            ? ' Set a project and type below, then save, to enable follow-ups.'
            : ' An admin needs to enrich it before follow-ups can be logged.'}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lead details
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {canFill('mobileNumber') ? (
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Mobile (add)"
                      placeholder="10-digit number"
                      value={editForm.values.mobileNumber}
                      onChange={editForm.handleChange('mobileNumber')}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                ) : (
                  <InfoField label="Mobile" value={lead.mobileNumber} />
                )}
                {canFill('email') ? (
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Email (add)"
                      value={editForm.values.email}
                      onChange={editForm.handleChange('email')}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                ) : (
                  <InfoField label="Email" value={lead.email} />
                )}
                {canFill('name') && (
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Name (add)"
                      value={editForm.values.name}
                      onChange={editForm.handleChange('name')}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                )}
                <InfoField label="Added" value={formatDateTime(lead.addedDate)} />
              </Grid>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Alternate number"
                    value={editForm.values.alternateNumber}
                    onChange={editForm.handleChange('alternateNumber')}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Project"
                    value={editForm.values.project}
                    onChange={editForm.handleChange('project')}
                    fullWidth
                  >
                    <MenuItem value="">—</MenuItem>
                    {projects.map((p) => (
                      <MenuItem key={p._id} value={p._id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Type"
                    value={editForm.values.type}
                    onChange={editForm.handleChange('type')}
                    fullWidth
                  >
                    <MenuItem value="">—</MenuItem>
                    {LEAD_TYPE.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Budget"
                    type="number"
                    value={editForm.values.budget}
                    onChange={editForm.handleChange('budget')}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Source"
                    value={editForm.values.source}
                    onChange={editForm.handleChange('source')}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Location"
                    value={editForm.values.location}
                    onChange={editForm.handleChange('location')}
                    fullWidth
                  />
                </Grid>
                {isAdmin && (
                  <Grid item xs={12}>
                    <TextField
                      select
                      label="Assigned to"
                      value={editForm.values.assignedTo}
                      onChange={editForm.handleChange('assignedTo')}
                      fullWidth
                    >
                      <MenuItem value="">Unassigned</MenuItem>
                      {employees.map((e) => (
                        <MenuItem key={e._id} value={e._id}>
                          {e.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    label="Remarks"
                    value={editForm.values.remarks}
                    onChange={editForm.handleChange('remarks')}
                    fullWidth
                    multiline
                    minRows={2}
                  />
                </Grid>
              </Grid>
              <Stack direction="row" sx={{ mt: 2 }}>
                <Button variant="contained" onClick={handleSaveDetails}>
                  Save changes
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Log a follow-up
              </Typography>
              {isEnriched ? (
                <FollowUpForm onSubmit={handleAddFollowUp} currentStatus={lead.status} />
              ) : (
                <Alert severity="warning">Enrich this lead (project + type) before logging follow-ups.</Alert>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Follow-up history
              </Typography>
              {followUpHistory.length === 0 ? (
                <EmptyState title="No follow-ups yet" />
              ) : (
                <Stack spacing={2} divider={<Divider />}>
                  {followUpHistory.map((f) => (
                    <Stack key={f._id} spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2">{f.type}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(f.createdAt)}
                        </Typography>
                      </Stack>
                      <Typography variant="body2">{f.remarks || 'No remarks'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Next: {formatDateTime(f.nextFollowUpDate)}
                        {f.visitDate ? ` · Visit: ${formatDateTime(f.visitDate)}` : ''}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
