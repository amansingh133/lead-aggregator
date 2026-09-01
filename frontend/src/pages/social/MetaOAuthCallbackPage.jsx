import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import { PageHeader } from '../../components/PageHeader';
import { LoadingState } from '../../components/LoadingState';
import { useAppDispatch } from '../../app/hooks';
import {
  exchangeMetaOAuth,
  finalizeMetaConnections,
  fetchMetaConnections,
} from '../../features/social/metaConnectionSlice';
import { showToast } from '../../features/ui/uiSlice';

export default function MetaOAuthCallbackPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const fbError = params.get('error_description') || params.get('error');
  const code = params.get('code');
  const state = params.get('state');

  const [phase, setPhase] = useState('exchanging'); // exchanging | pick | error
  const [errorMsg, setErrorMsg] = useState(fbError || null);
  const [session, setSession] = useState(null); // { sessionId, pages }
  const [selected, setSelected] = useState({}); // pageId -> bool
  const [submitting, setSubmitting] = useState(false);
  // The OAuth `code` is single-use. React StrictMode (dev) runs this effect
  // twice; without this the second run re-POSTs the same code and Facebook
  // rejects it ("This authorization code has been used"). Caching the
  // in-flight dispatch on a ref (refs survive StrictMode's remount) means
  // exactly one exchange happens and whichever mount is alive renders it.
  const exchangePromiseRef = useRef(null);

  useEffect(() => {
    if (fbError) {
      setPhase('error');
      return;
    }
    if (!code || !state) {
      setErrorMsg('Missing sign-in details from Facebook.');
      setPhase('error');
      return;
    }
    if (!exchangePromiseRef.current) {
      exchangePromiseRef.current = dispatch(exchangeMetaOAuth({ code, state }));
    }
    let alive = true;
    exchangePromiseRef.current.then((res) => {
      if (!alive) return;
      if (exchangeMetaOAuth.fulfilled.match(res)) {
        setSession(res.payload);
        setSelected(Object.fromEntries((res.payload.pages || []).map((p) => [p.id, true])));
        setPhase('pick');
      } else {
        setErrorMsg(res.payload?.message || 'Could not complete Facebook sign-in.');
        setPhase('error');
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chosenIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected],
  );

  const handleConnect = async () => {
    setSubmitting(true);
    const res = await dispatch(
      finalizeMetaConnections({ sessionId: session.sessionId, pageIds: chosenIds }),
    );
    setSubmitting(false);
    if (finalizeMetaConnections.fulfilled.match(res)) {
      const n = res.payload?.connected?.length || 0;
      dispatch(showToast(`${n} Page${n === 1 ? '' : 's'} connected`, 'success'));
      dispatch(fetchMetaConnections());
      navigate('/social/meta', { replace: true });
    } else {
      dispatch(showToast(res.payload?.message || 'Could not connect the selected Pages', 'error'));
    }
  };

  return (
    <>
      <PageHeader
        title="Connect Facebook"
        breadcrumbs={[{ label: 'Meta Connections', to: '/social/meta' }, { label: 'Connect' }]}
      />

      {phase === 'exchanging' && <LoadingState />}

      {phase === 'error' && (
        <Stack spacing={2} sx={{ maxWidth: 520 }}>
          <Alert severity="error">{errorMsg || 'Facebook sign-in was cancelled or failed.'}</Alert>
          <Button variant="contained" onClick={() => navigate('/social/meta', { replace: true })}>
            Back to Meta Connections
          </Button>
        </Stack>
      )}

      {phase === 'pick' && session && (
        <Card variant="outlined" sx={{ maxWidth: 560 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Choose the Pages to connect
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Lead Ads submissions on the selected Pages will flow into this app in real time.
            </Typography>
            <Stack>
              {session.pages.map((p) => (
                <FormControlLabel
                  key={p.id}
                  control={
                    <Checkbox
                      checked={Boolean(selected[p.id])}
                      onChange={(e) =>
                        setSelected((s) => ({ ...s, [p.id]: e.target.checked }))
                      }
                    />
                  }
                  label={`${p.name || 'Untitled Page'} (${p.id})`}
                />
              ))}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleConnect}
                disabled={submitting || chosenIds.length === 0}
              >
                {submitting ? 'Connecting…' : `Connect ${chosenIds.length || ''} selected`}
              </Button>
              <Button onClick={() => navigate('/social/meta', { replace: true })}>Cancel</Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </>
  );
}
