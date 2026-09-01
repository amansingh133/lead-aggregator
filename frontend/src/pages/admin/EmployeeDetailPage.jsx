import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { PageHeader } from "../../components/PageHeader";
import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearEmployeeDetail,
  fetchEmployeeDetail,
  fetchEmployeeMonthlyAttendance,
  updateEmployee,
  removeEmployee,
} from "../../features/admin/employeesSlice";
import { useForm } from "../../hooks/useForm";
import { useConfirm } from "../../hooks/useConfirm";
import { useAuth } from "../../hooks/useAuth";
import { showToast } from "../../features/ui/uiSlice";
import { formatTime } from "../../utils/formatters";
import { ROLE, ROLE_LABEL, manageableRoles } from "../../constants/roles";

const now = dayjs();
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: dayjs().month(i).format("MMMM"),
}));
const YEARS = Array.from({ length: 5 }, (_, i) => now.year() - i);

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const auth = useAuth();
  const { user: currentUser } = auth;
  const {
    current: employee,
    monthlyAttendance,
    status,
  } = useAppSelector((state) => state.employeeDetail);
  const isSelf = employee?._id === currentUser?._id;
  // Backend enforces this; here it's just to hide controls that would 403/404. Just checking
  const canManage =
    !!employee &&
    !employee.isPrimary &&
    !isSelf &&
    manageableRoles(auth).includes(employee.role);
  const [month, setMonth] = useState(now.month() + 1);
  const [year, setYear] = useState(now.year());
  const { values, handleChange, setValues } = useForm({
    name: "",
    mobileNumber: "",
    address: "",
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchEmployeeDetail(id));
    return () => dispatch(clearEmployeeDetail());
  }, [dispatch, id]);

  useEffect(() => {
    if (employee) {
      setValues({
        name: employee.name,
        mobileNumber: employee.mobileNumber,
        address: employee.address || "",
        isActive: employee.isActive,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee?._id]);

  useEffect(() => {
    dispatch(
      fetchEmployeeMonthlyAttendance({
        employeeId: id,
        params: { month, year },
      }),
    );
  }, [dispatch, id, month, year]);

  const handleSave = async () => {
    const result = await dispatch(updateEmployee({ id, payload: values }));
    if (updateEmployee.fulfilled.match(result)) {
      dispatch(showToast("Team member updated", "success"));
    } else {
      dispatch(showToast(result.payload?.message || "Update failed", "error"));
    }
  };

  const handleDeactivateOrDelete = async () => {
    const ok = await confirm({
      title: "Remove team member",
      message:
        employee.role === ROLE.ADMIN || employee.role === ROLE.SUPER_ADMIN
          ? `Delete the ${ROLE_LABEL[employee.role]} "${employee.name}"? This can't be undone.`
          : `Delete "${employee.name}"? If they have lead/attendance history, they'll need to be deactivated instead.`,
      confirmLabel: "Delete",
      severity: "error",
    });
    if (!ok) return;
    const result = await dispatch(removeEmployee(id));
    if (removeEmployee.fulfilled.match(result)) {
      dispatch(showToast("Team member deleted", "success"));
      navigate("/admin/employees");
    } else {
      dispatch(
        showToast(
          result.payload?.message ||
            "Could not delete — try deactivating instead",
          "error",
        ),
      );
    }
  };

  if (status === "loading" || !employee) return <LoadingState />;

  return (
    <>
      <PageHeader
        title={employee.name}
        breadcrumbs={[
          { label: "Team", to: "/admin/employees" },
          { label: employee.name },
        ]}
        actions={
          <>
            <Chip
              label={ROLE_LABEL[employee.role] || employee.role}
              color={
                employee.role === ROLE.SUPER_ADMIN
                  ? "secondary"
                  : employee.role === ROLE.ADMIN
                    ? "primary"
                    : "default"
              }
              variant={employee.role === ROLE.EMPLOYEE ? "outlined" : "filled"}
              size="small"
            />
            {employee.isPrimary && (
              <Chip label="Primary" color="warning" size="small" />
            )}
            <Chip label={employee.email} variant="outlined" size="small" />
            {canManage && (
              <Button color="error" onClick={handleDeactivateOrDelete}>
                Delete
              </Button>
            )}
          </>
        }
      />
      {isSelf && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This is your own account — you can't deactivate or delete it here.
        </Alert>
      )}
      {employee.isPrimary && !isSelf && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This is the primary Super Admin account and cannot be deactivated or
          deleted.
        </Alert>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Name"
                  value={values.name}
                  onChange={handleChange("name")}
                  fullWidth
                />
                <TextField
                  label="Mobile number"
                  value={values.mobileNumber}
                  onChange={handleChange("mobileNumber")}
                  fullWidth
                />
                <TextField
                  label="Address"
                  value={values.address}
                  onChange={handleChange("address")}
                  fullWidth
                />
                <TextField
                  select
                  label="Status"
                  value={values.isActive ? "true" : "false"}
                  onChange={(e) =>
                    handleChange("isActive")(e.target.value === "true")
                  }
                  disabled={isSelf || employee.isPrimary}
                  helperText={
                    isSelf
                      ? "You can't change your own active status."
                      : employee.isPrimary
                        ? "The primary Super Admin is always active."
                        : undefined
                  }
                  fullWidth
                >
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </TextField>
                <Stack direction="row">
                  <Button variant="contained" onClick={handleSave}>
                    Save changes
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly attendance
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField
                  select
                  size="small"
                  label="Month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  {MONTHS.map((m) => (
                    <MenuItem key={m.value} value={m.value}>
                      {m.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  {YEARS.map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Present:{" "}
                  <strong>{monthlyAttendance?.presentDays ?? 0}</strong>
                </Typography>
                <Typography variant="body2">
                  Hours: <strong>{monthlyAttendance?.totalHours ?? 0}</strong>
                </Typography>
              </Stack>
              {!monthlyAttendance?.days?.length ? (
                <EmptyState title="No records for this month" />
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>In</TableCell>
                        <TableCell>Out</TableCell>
                        <TableCell align="right">Hours</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlyAttendance.days.map((d) => (
                        <TableRow key={d.date}>
                          <TableCell>{d.date}</TableCell>
                          <TableCell>{formatTime(d.checkIn)}</TableCell>
                          <TableCell>{formatTime(d.checkOut)}</TableCell>
                          <TableCell align="right">{d.hoursWorked}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
