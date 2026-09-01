import { useEffect, useRef, useState } from 'react';
import { Button } from '@mui/material';

/**
 * "Resend code" control shared by both password flows. Starts disabled with
 * a live countdown; when pressed it calls `onResend` (which should return
 * the thunk result / a promise) and restarts the countdown. If the backend
 * replies 429 OTP_RESEND_TOO_SOON it just restarts the countdown quietly.
 */
export function ResendOtpButton({ onResend, cooldownSeconds = 30, disabled = false }) {
  const [remaining, setRemaining] = useState(cooldownSeconds);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef(null);

  const startCountdown = (from = cooldownSeconds) => {
    setRemaining(from);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startCountdown();
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = async () => {
    setBusy(true);
    try {
      await onResend?.();
    } finally {
      setBusy(false);
      startCountdown();
    }
  };

  const waiting = remaining > 0;

  return (
    <Button
      type="button"
      size="small"
      onClick={handleClick}
      disabled={disabled || busy || waiting}
    >
      {waiting ? `Resend code in ${remaining}s` : 'Resend code'}
    </Button>
  );
}
