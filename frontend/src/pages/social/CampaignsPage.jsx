import { Fragment, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchCampaigns, syncCampaignLeads } from '../../features/social/campaignsSlice';
import { fetchMetaConnections } from '../../features/social/metaConnectionSlice';
import { campaignApi } from '../../api/endpoints/campaignApi';
import { showToast } from '../../features/ui/uiSlice';

// Meta returns objective / status / optimization goal as raw enum strings
// (newer "Outcome-Driven" OUTCOME_LEADS, older LEAD_GENERATION, ACTIVE,
// CAMPAIGN_PAUSED, ...). Show human labels instead of the codes.
const OBJECTIVE_LABELS = {
  OUTCOME_LEADS: 'Leads',
  OUTCOME_SALES: 'Sales',
  OUTCOME_ENGAGEMENT: 'Engagement',
  OUTCOME_AWARENESS: 'Awareness',
  OUTCOME_TRAFFIC: 'Traffic',
  OUTCOME_APP_PROMOTION: 'App promotion',
  LEAD_GENERATION: 'Lead generation',
  CONVERSIONS: 'Conversions',
  LINK_CLICKS: 'Link clicks',
  POST_ENGAGEMENT: 'Post engagement',
  BRAND_AWARENESS: 'Brand awareness',
  REACH: 'Reach',
  MESSAGES: 'Messages',
  VIDEO_VIEWS: 'Video views',
};
const prettyEnum = (raw) =>
  !raw
    ? '—'
    : raw
        .replace(/^OUTCOME_/, '')
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/^\w/, (c) => c.toUpperCase());
const formatObjective = (raw) => (raw && OBJECTIVE_LABELS[raw]) || prettyEnum(raw);

function StatusChip({ value }) {
  if (!value) return '—';
  return <Chip size="small" variant="outlined" label={prettyEnum(value)} />;
}

const errText = (e, fallback) => e?.response?.data?.message || fallback;

// Ads in one ad set — mounted only while that ad set is expanded.
function AdList({ adsetId, connectionId }) {
  const [state, setState] = useState({ status: 'loading', items: [], error: '' });

  useEffect(() => {
    let alive = true;
    campaignApi
      .ads(adsetId, connectionId)
      .then((res) => alive && setState({ status: 'ok', items: res.data, error: '' }))
      .catch(
        (e) =>
          alive && setState({ status: 'error', items: [], error: errText(e, 'Failed to load ads') }),
      );
    return () => {
      alive = false;
    };
  }, [adsetId, connectionId]);

  if (state.status === 'loading') {
    return (
      <Box sx={{ py: 1, pl: 2 }}>
        <CircularProgress size={16} />
      </Box>
    );
  }
  if (state.status === 'error') {
    return (
      <Typography variant="caption" color="error" sx={{ pl: 2 }}>
        {state.error}
      </Typography>
    );
  }
  if (state.items.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ pl: 2 }}>
        No ads in this ad set.
      </Typography>
    );
  }
  return (
    <Table size="small" sx={{ '& td': { border: 0 } }}>
      <TableBody>
        {state.items.map((ad) => (
          <TableRow key={ad.id}>
            <TableCell sx={{ pl: 2, width: '65%' }}>{ad.name || ad.id}</TableCell>
            <TableCell>
              <StatusChip value={ad.effectiveStatus || ad.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Ad sets in one campaign — mounted only while that campaign is expanded.
function AdSetList({ campaignId, connectionId }) {
  const [state, setState] = useState({ status: 'loading', items: [], error: '' });
  const [open, setOpen] = useState({}); // adsetId -> bool

  useEffect(() => {
    let alive = true;
    campaignApi
      .adSets(campaignId, connectionId)
      .then((res) => alive && setState({ status: 'ok', items: res.data, error: '' }))
      .catch(
        (e) =>
          alive &&
          setState({ status: 'error', items: [], error: errText(e, 'Failed to load ad sets') }),
      );
    return () => {
      alive = false;
    };
  }, [campaignId, connectionId]);

  if (state.status === 'loading') {
    return (
      <Box sx={{ py: 1.5, pl: 2 }}>
        <CircularProgress size={18} />
      </Box>
    );
  }
  if (state.status === 'error') {
    return (
      <Typography variant="body2" color="error" sx={{ pl: 2, py: 1 }}>
        {state.error}
      </Typography>
    );
  }
  if (state.items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ pl: 2, py: 1 }}>
        No ad sets in this campaign.
      </Typography>
    );
  }
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: 40 }} />
          <TableCell>Ad set</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Optimization</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {state.items.map((as) => {
          const isOpen = Boolean(open[as.id]);
          return (
            <Fragment key={as.id}>
              <TableRow hover>
                <TableCell>
                  <IconButton
                    size="small"
                    aria-label={isOpen ? 'Collapse ad set' : 'Expand ad set'}
                    onClick={() => setOpen((o) => ({ ...o, [as.id]: !o[as.id] }))}
                  >
                    {isOpen ? (
                      <KeyboardArrowDownIcon fontSize="small" />
                    ) : (
                      <KeyboardArrowRightIcon fontSize="small" />
                    )}
                  </IconButton>
                </TableCell>
                <TableCell>{as.name || as.id}</TableCell>
                <TableCell>
                  <StatusChip value={as.effectiveStatus || as.status} />
                </TableCell>
                <TableCell>{prettyEnum(as.optimizationGoal)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ py: 0, border: 0 }} colSpan={4}>
                  <Collapse in={isOpen} unmountOnExit>
                    <Box sx={{ my: 1 }}>
                      {isOpen && <AdList adsetId={as.id} connectionId={connectionId} />}
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function CampaignsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, status, error } = useAppSelector((s) => s.campaigns);
  const { connections } = useAppSelector((s) => s.metaConnection);
  const hasConnections = connections.length > 0;
  const [syncingId, setSyncingId] = useState(null);
  const [open, setOpen] = useState({}); // campaignId -> bool

  useEffect(() => {
    dispatch(fetchMetaConnections());
    dispatch(fetchCampaigns());
  }, [dispatch]);

  const handleSync = async (row) => {
    setSyncingId(row.id);
    const result = await dispatch(
      syncCampaignLeads({ campaignId: row.id, connectionId: row.connectionId }),
    );
    setSyncingId(null);
    if (syncCampaignLeads.fulfilled.match(result)) {
      const { created, scanned } = result.payload;
      dispatch(
        showToast(
          created > 0
            ? `${created} new lead${created === 1 ? '' : 's'} captured (${scanned} scanned)`
            : `No new leads (${scanned} scanned)`,
          created > 0 ? 'success' : 'info',
        ),
      );
    } else {
      dispatch(showToast(result.payload?.message || 'Lead sync failed', 'error'));
    }
  };

  let content;
  if (status === 'loading' && items.length === 0) {
    content = <LoadingState />;
  } else if (items.length === 0) {
    content = (
      <Paper variant="outlined">
        <EmptyState
          title={hasConnections ? 'No campaigns found' : 'Connect a Meta ad account first'}
          description={
            hasConnections
              ? error?.message ||
                'Your connected ad accounts have no Lead Ads campaigns, or a token lacks ads_read.'
              : 'Go to Meta Connections to link a Facebook Ad Account.'
          }
        />
      </Paper>
    );
  } else {
    content = (
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 44 }} />
              <TableCell>Campaign</TableCell>
              <TableCell>Page</TableCell>
              <TableCell>Ad account</TableCell>
              <TableCell>Objective</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Leads</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row) => {
              const isOpen = Boolean(open[row.id]);
              return (
                <Fragment key={row.id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        aria-label={isOpen ? 'Collapse campaign' : 'Expand campaign'}
                        onClick={() => setOpen((o) => ({ ...o, [row.id]: !o[row.id] }))}
                      >
                        {isOpen ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{row.name || '—'}</TableCell>
                    <TableCell>{row.pageName || '—'}</TableCell>
                    <TableCell>{row.adAccountName || '—'}</TableCell>
                    <TableCell>{formatObjective(row.objective)}</TableCell>
                    <TableCell>
                      <StatusChip value={row.effectiveStatus} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Button
                        size="small"
                        startIcon={<DownloadIcon />}
                        disabled={syncingId === row.id}
                        onClick={() => handleSync(row)}
                      >
                        {syncingId === row.id ? 'Syncing…' : 'Sync'}
                      </Button>
                      <Button
                        size="small"
                        onClick={() =>
                          navigate(
                            `/leads?origin=social&platform=facebook&campaignId=${row.id}`,
                          )
                        }
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{ py: 0, border: 0, bgcolor: 'action.hover' }}
                      colSpan={7}
                    >
                      <Collapse in={isOpen} unmountOnExit>
                        <Box sx={{ m: 1, ml: 4 }}>
                          {isOpen && (
                            <AdSetList campaignId={row.id} connectionId={row.connectionId} />
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <>
      <PageHeader
        title="Campaigns"
        actions={
          <Button
            component={RouterLink}
            to="/leads?origin=social&platform=facebook"
            startIcon={<PeopleAltOutlinedIcon />}
          >
            View Facebook leads
          </Button>
        }
      />
      {content}
    </>
  );
}
