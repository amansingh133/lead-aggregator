import { useEffect, useState } from 'react';
import { Alert, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { LoadingState } from '../../components/LoadingState';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchStatus, toggleAttendance } from '../../features/attendance/attendanceSlice';
import { showToast } from '../../features/ui/uiSlice';
import { formatTime } from '../../utils/formatters';

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
  });
}

export default function AttendancePage() {
  const dispatch = useAppDispatch();
  const { todayStatus, status, toggleStatus } = useAppSelector((state) => state.attendance);
  const [geoError, setGeoError] = useState(null);

  useEffect(() => {
    dispatch(fetchStatus());
  }, [dispatch]);

  const handleToggle = async () => {
    setGeoError(null);
    try {
      const position = await getPosition();
      const result = await dispatch(
        toggleAttendance({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      );
      if (toggleAttendance.fulfilled.match(result)) {
        dispatch(showToast(`${result.payload.action === 'CHECK_IN' ? 'Checked in' : 'Checked out'} successfully`, 'success'));
        dispatch(fetchStatus());
      } else {
        dispatch(showToast(result.payload?.message || 'Action failed', 'error'));
      }
    } catch (err) {
      setGeoError(err.message || 'Could not get your location.');
    }
  };

  if (status === 'loading' && !todayStatus) return <LoadingState />;

  const attendance = todayStatus?.attendance;

  return (
    <>
      <PageHeader
        title="Attendance"
        actions={
          <Button component={RouterLink} to="/attendance/report">
            View monthly report
          </Button>
        }
      />
      <Card variant="outlined" sx={{ maxWidth: 480 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocationOnOutlinedIcon color="action" />
              <Typography variant="body2" color="text.secondary">
                Location access is required to check in/out.
              </Typography>
            </Stack>
            {geoError && <Alert severity="error">{geoError}</Alert>}

            <Stack direction="row" spacing={2}>
              <Chip
                label={todayStatus?.checkedIn ? `In: ${formatTime(attendance?.checkIn?.time)}` : 'Not checked in'}
                color={todayStatus?.checkedIn ? 'success' : 'default'}
              />
              <Chip
                label={todayStatus?.checkedOut ? `Out: ${formatTime(attendance?.checkOut?.time)}` : 'Not checked out'}
                color={todayStatus?.checkedOut ? 'success' : 'default'}
              />
            </Stack>

            <Button
              variant="contained"
              size="large"
              disabled={toggleStatus === 'loading' || todayStatus?.nextAction === 'DONE_FOR_TODAY'}
              onClick={handleToggle}
            >
              {todayStatus?.nextAction === 'CHECK_IN' && 'Check in'}
              {todayStatus?.nextAction === 'CHECK_OUT' && 'Check out'}
              {todayStatus?.nextAction === 'DONE_FOR_TODAY' && 'Done for today'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
