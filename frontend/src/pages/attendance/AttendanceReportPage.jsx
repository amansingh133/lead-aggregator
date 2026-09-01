import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Card,
  CardContent,
  Grid,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { PageHeader } from '../../components/PageHeader';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchMonthlyReport } from '../../features/attendance/attendanceSlice';
import { formatTime } from '../../utils/formatters';

const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: dayjs().month(i).format('MMMM') }));
const now = dayjs();
const YEARS = Array.from({ length: 5 }, (_, i) => now.year() - i);

export default function AttendanceReportPage() {
  const dispatch = useAppDispatch();
  const { monthlyReport, status } = useAppSelector((state) => state.attendance);
  const [month, setMonth] = useState(now.month() + 1);
  const [year, setYear] = useState(now.year());

  useEffect(() => {
    dispatch(fetchMonthlyReport({ month, year }));
  }, [dispatch, month, year]);

  return (
    <>
      <PageHeader title="My Attendance Report" />
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <TextField select size="small" label="Month" value={month} onChange={(e) => setMonth(e.target.value)} fullWidth>
            {MONTHS.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} sm={3}>
          <TextField select size="small" label="Year" value={year} onChange={(e) => setYear(e.target.value)} fullWidth>
            {YEARS.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {status === 'loading' && !monthlyReport ? (
        <LoadingState />
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Present days
                  </Typography>
                  <Typography variant="h5">{monthlyReport?.presentDays ?? 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total hours
                  </Typography>
                  <Typography variant="h5">{monthlyReport?.totalHours ?? 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {!monthlyReport?.days?.length ? (
            <EmptyState title="No attendance records for this month" />
          ) : (
            <TableContainer component={Card} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Check-in</TableCell>
                    <TableCell>Check-out</TableCell>
                    <TableCell align="right">Hours worked</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyReport.days.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell>{day.date}</TableCell>
                      <TableCell>{formatTime(day.checkIn)}</TableCell>
                      <TableCell>{formatTime(day.checkOut)}</TableCell>
                      <TableCell align="right">{day.hoursWorked}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </>
  );
}
