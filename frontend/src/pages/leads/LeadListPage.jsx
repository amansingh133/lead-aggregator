import { useEffect, useState } from 'react';
import { Button, Chip, MenuItem, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { SearchField } from '../../components/SearchField';
import { FilterBar } from '../../components/FilterBar';
import { DataTable } from '../../components/DataTable';
import { StatusChip } from '../../components/StatusChip';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchLeads, setFilters, createLead } from '../../features/leads/leadsSlice';
import { leadApi } from '../../api/endpoints/leadApi';
import { fetchProjects } from '../../features/projects/projectsSlice';
import { fetchEmployees } from '../../features/admin/employeesSlice';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAuth } from '../../hooks/useAuth';
import { showToast } from '../../features/ui/uiSlice';
import { LEAD_STATUS, LEAD_TYPE } from '../../constants/leadStatus';
import { PLATFORMS } from '../../constants/platform';
import { ROLE } from '../../constants/roles';
import { formatDate } from '../../utils/formatters';
import { LeadFormDialog } from './LeadFormDialog';

export default function LeadListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const { items, meta, filters, status } = useAppSelector((state) => state.leads);
  const projects = useAppSelector((state) => state.projects.items);
  const employees = useAppSelector((state) => state.employees.items);
  const [search, setSearch] = useState(filters.search);
  const debouncedSearch = useDebouncedValue(search);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Cascading Facebook attribution options (only tiers that produced a lead).
  const [fbCampaigns, setFbCampaigns] = useState([]);
  const [fbAdsets, setFbAdsets] = useState([]);
  const [fbAds, setFbAds] = useState([]);

  useEffect(() => {
    dispatch(fetchProjects({ limit: 100 }));
    if (isAdmin) dispatch(fetchEmployees({ limit: 100, role: ROLE.EMPLOYEE }));
    leadApi
      .facebookAttribution({ level: 'campaign' })
      .then((res) => setFbCampaigns(res.data || []))
      .catch(() => setFbCampaigns([]));
  }, [dispatch, isAdmin]);

  // Ad sets for the chosen campaign.
  useEffect(() => {
    if (!filters.campaignId) {
      setFbAdsets([]);
      return;
    }
    leadApi
      .facebookAttribution({ level: 'adset', campaignId: filters.campaignId })
      .then((res) => setFbAdsets(res.data || []))
      .catch(() => setFbAdsets([]));
  }, [filters.campaignId]);

  // Ads for the chosen ad set.
  useEffect(() => {
    if (!filters.adsetId) {
      setFbAds([]);
      return;
    }
    leadApi
      .facebookAttribution({ level: 'ad', adsetId: filters.adsetId })
      .then((res) => setFbAds(res.data || []))
      .catch(() => setFbAds([]));
  }, [filters.adsetId]);

  // Supports being deep-linked with a pre-applied filter, e.g. the Campaigns
  // page's "View leads" button
  // (/leads?origin=social&platform=facebook&campaignId=&adsetId=&adId=).
  useEffect(() => {
    const origin = searchParams.get('origin');
    const platform = searchParams.get('platform');
    const campaignId = searchParams.get('campaignId');
    const adsetId = searchParams.get('adsetId');
    const adId = searchParams.get('adId');
    if (origin || platform || campaignId || adsetId || adId) {
      dispatch(
        setFilters({
          origin: origin || '',
          platform: platform || '',
          campaignId: campaignId || '',
          adsetId: adsetId || '',
          adId: adId || '',
          page: 1,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    dispatch(setFilters({ search: debouncedSearch, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    dispatch(fetchLeads(filters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, JSON.stringify(filters)]);

  const handleCreate = async (payload) => {
    const result = await dispatch(createLead(payload));
    if (createLead.fulfilled.match(result)) {
      dispatch(showToast('Lead created', 'success'));
      dispatch(fetchLeads(filters));
      return true;
    }
    dispatch(showToast(result.payload?.message || 'Create failed', 'error'));
    return false;
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
    { field: 'mobileNumber', headerName: 'Mobile', width: 130, valueGetter: (value, row) => row.mobileNumber || '—' },
    {
      field: 'project',
      headerName: 'Project',
      flex: 1,
      minWidth: 140,
      valueGetter: (value, row) => row.project?.name || '—',
    },
    { field: 'status', headerName: 'Status', width: 140, renderCell: (p) => <StatusChip status={p.value} /> },
    {
      field: 'origin',
      headerName: 'Source',
      width: 110,
      renderCell: (p) => (
        <Chip
          size="small"
          label={p.row.origin === 'social' ? p.row.social?.platform || 'social' : 'manual'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'campaign',
      headerName: 'Campaign',
      flex: 1,
      minWidth: 150,
      valueGetter: (value, row) => row.social?.campaignName || '—',
    },
    {
      field: 'assignedTo',
      headerName: 'Assigned To',
      flex: 1,
      minWidth: 140,
      valueGetter: (value, row) => row.assignedTo?.name || 'Unassigned',
    },
    {
      field: 'nextFollowUpDate',
      headerName: 'Next Follow-up',
      width: 150,
      valueGetter: (value, row) => formatDate(row.nextFollowUpDate),
    },
  ];

  return (
    <>
      <PageHeader
        title="Leads"
        actions={
          <Button startIcon={<AddIcon />} variant="contained" onClick={() => setDialogOpen(true)}>
            New lead
          </Button>
        }
      />
      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search by name or mobile…" />
        <TextField
          select
          size="small"
          label="Status"
          value={filters.status}
          onChange={(e) => dispatch(setFilters({ status: e.target.value, page: 1 }))}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {LEAD_STATUS.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Project"
          value={filters.project}
          onChange={(e) => dispatch(setFilters({ project: e.target.value, page: 1 }))}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All projects</MenuItem>
          {projects.map((p) => (
            <MenuItem key={p._id} value={p._id}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Type"
          value={filters.type}
          onChange={(e) => dispatch(setFilters({ type: e.target.value, page: 1 }))}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="">All types</MenuItem>
          {LEAD_TYPE.map((t) => (
            <MenuItem key={t} value={t}>
              {t}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Origin"
          value={filters.origin}
          onChange={(e) =>
            dispatch(
              setFilters({
                origin: e.target.value,
                // Clear the social-only sub-filters when leaving "social".
                ...(e.target.value === 'social'
                  ? {}
                  : { platform: '', campaignId: '', adsetId: '', adId: '' }),
                page: 1,
              }),
            )
          }
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="">All origins</MenuItem>
          <MenuItem value="manual">Manual</MenuItem>
          <MenuItem value="social">Social</MenuItem>
        </TextField>
        {filters.origin === 'social' && (
          <TextField
            select
            size="small"
            label="Platform"
            value={filters.platform}
            onChange={(e) => dispatch(setFilters({ platform: e.target.value, page: 1 }))}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All platforms</MenuItem>
            {PLATFORMS.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </TextField>
        )}
        {filters.origin === 'social' && fbCampaigns.length > 0 && (
          <TextField
            select
            size="small"
            label="Campaign"
            value={filters.campaignId}
            onChange={(e) =>
              dispatch(
                setFilters({ campaignId: e.target.value, adsetId: '', adId: '', page: 1 }),
              )
            }
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All campaigns</MenuItem>
            {fbCampaigns.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} ({c.count})
              </MenuItem>
            ))}
          </TextField>
        )}
        {filters.origin === 'social' && filters.campaignId && fbAdsets.length > 0 && (
          <TextField
            select
            size="small"
            label="Ad set"
            value={filters.adsetId}
            onChange={(e) => dispatch(setFilters({ adsetId: e.target.value, adId: '', page: 1 }))}
            sx={{ minWidth: 190 }}
          >
            <MenuItem value="">All ad sets</MenuItem>
            {fbAdsets.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.name} ({a.count})
              </MenuItem>
            ))}
          </TextField>
        )}
        {filters.origin === 'social' && filters.adsetId && fbAds.length > 0 && (
          <TextField
            select
            size="small"
            label="Ad"
            value={filters.adId}
            onChange={(e) => dispatch(setFilters({ adId: e.target.value, page: 1 }))}
            sx={{ minWidth: 190 }}
          >
            <MenuItem value="">All ads</MenuItem>
            {fbAds.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.name} ({a.count})
              </MenuItem>
            ))}
          </TextField>
        )}
        {isAdmin && (
          <TextField
            select
            size="small"
            label="Assigned to"
            value={filters.assignedTo}
            onChange={(e) => dispatch(setFilters({ assignedTo: e.target.value, page: 1 }))}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Everyone</MenuItem>
            {employees.map((e) => (
              <MenuItem key={e._id} value={e._id}>
                {e.name}
              </MenuItem>
            ))}
          </TextField>
        )}
      </FilterBar>
      <DataTable
        rows={items}
        columns={columns}
        loading={status === 'loading'}
        meta={meta}
        onPageModelChange={(model) => dispatch(setFilters(model))}
        onRowClick={(params) => navigate(`/leads/${params.row._id}`)}
        emptyTitle="No leads found"
        emptyDescription="Try adjusting filters, or create a lead manually."
      />
      <LeadFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
        projects={projects}
        employees={employees}
      />
    </>
  );
}
