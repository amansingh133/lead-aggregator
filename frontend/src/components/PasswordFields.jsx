import { useEffect, useState } from 'react';
import { Stack, TextField } from '@mui/material';

/**
 * "New password" + "Confirm new password" pair with inline match/length
 * validation, shared by the public reset page and the profile change-
 * password dialog. Reports `{ value, valid }` up via onChange whenever
 * either field changes.
 */
export function PasswordFields({ onChange, minLength = 6, newLabel = 'New password' }) {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);

  const tooShort = pw.length > 0 && pw.length < minLength;
  const mismatch = confirm.length > 0 && pw !== confirm;
  const valid = pw.length >= minLength && pw === confirm;

  useEffect(() => {
    onChange?.({ value: pw, valid });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pw, confirm]);

  return (
    <Stack spacing={2}>
      <TextField
        label={newLabel}
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        onBlur={() => setTouched(true)}
        error={touched && tooShort}
        helperText={touched && tooShort ? `At least ${minLength} characters` : ' '}
        fullWidth
        required
      />
      <TextField
        label="Confirm new password"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={mismatch}
        helperText={mismatch ? 'Passwords do not match' : ' '}
        fullWidth
        required
      />
    </Stack>
  );
}
