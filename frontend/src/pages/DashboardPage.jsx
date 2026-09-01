import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { PageHeader } from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { StatusChip } from '../components/StatusChip';
import { ROLE } from '../constants/roles';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { fetchSummary, fetchFollowUps, fetchVisits } from '../features/dashboard/dashboardSlice';
import { fetchEmployees } from '../features/admin/employeesSlice';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatters';
import { Link as RouterLink } from 'react-router-dom';

function SummaryCard({ label, value }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { isAdmin } = useAuth();
  const { summary, followUps, visits, status } = useAppSelector((state) => state.dashboard);
  const employees = useAppSelector((state) => state.employees.items);
  const [employeeId, setEmployeeId] = useState('');
  const [followUpTab, setFollowUpTab] = useState('pending');
  const [visitTab, setVisitTab] = useState('today');

  const scope = isAdmin && employeeId ? { employeeId } : {};

  useEffect(() => {
    if (isAdmin) dispatch(fetchEmployees({ limit: 100, role: ROLE.EMPLOYEE }));
  }, [dispatch, isAdmin]);

  useEffect(() => {
    dispatch(fetchSummary(scope));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, employeeId]);

  useEffect(() => {
    dispatch(fetchFollowUps({ ...scope, type: followUpTab }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, employeeId, followUpTab]);

  useEffect(() => {
    dispatch(fetchVisits({ ...scope, type: visitTab }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, employeeId, visitTab]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={
          isAdmin && (
            <TextField
              select
              size="small"
              label="Employee"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">All employees</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp._id} value={emp._id}>
                  {emp.name}
                </MenuItem>
              ))}
            </TextField>
          )
        }
      />

      {status === 'loading' && !summary ? (
        <LoadingState />
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <SummaryCard label="Total leads" value={summary?.totalLeads ?? 0} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <SummaryCard label="Conversion rate" value={`${summary?.conversionRate ?? 0}%`} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <SummaryCard label="Converted" value={summary?.statusCounts?.Converted ?? 0} />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            {Object.entries(summary?.statusCounts || {}).map(([status_, count]) => (
              <Grid item key={status_} xs={6} sm={4} md={3} lg={2}>
                <Card variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <StatusChip status={status_} />
                    <Typography variant="h5" sx={{ mt: 1 }}>
                      {count}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <Tabs value={followUpTab} onChange={(_, v) => setFollowUpTab(v)} sx={{ px: 2 }}>
                  <Tab value="pending" label="Overdue" />
                  <Tab value="today" label="Today" />
                  <Tab value="tomorrow" label="Tomorrow" />
                </Tabs>
                <Box sx={{ px: 1 }}>
                  {followUps.length === 0 ? (
                    <EmptyState title="No follow-ups" description="Nothing scheduled in this range." />
                  ) : (
                    <List dense>
                      {followUps.map((lead) => (
                        <ListItem
                          key={lead._id}
                          component={RouterLink}
                          to={`/leads/${lead._id}`}
                          sx={{ color: 'text.primary' }}
                        >
                          <ListItemText
                            primary={lead.name}
                            secondary={`${lead.project?.name || '—'} · Due ${formatDate(lead.nextFollowUpDate)} · ${
                              lead.assignedTo?.name || 'Unassigned'
                            }`}
                          />
                          <StatusChip status={lead.status} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <Tabs value={visitTab} onChange={(_, v) => setVisitTab(v)} sx={{ px: 2 }}>
                  <Tab value="today" label="Today" />
                  <Tab value="tomorrow" label="Tomorrow" />
                </Tabs>
                <Box sx={{ px: 1 }}>
                  {visits.length === 0 ? (
                    <EmptyState title="No visits planned" />
                  ) : (
                    <List dense>
                      {visits.map((lead) => (
                        <ListItem
                          key={lead._id}
                          component={RouterLink}
                          to={`/leads/${lead._id}`}
                          sx={{ color: 'text.primary' }}
                        >
                          <ListItemText
                            primary={lead.name}
                            secondary={`${lead.project?.name || '—'} · ${formatDate(lead.visitDate)}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}
    </>
  );
}
