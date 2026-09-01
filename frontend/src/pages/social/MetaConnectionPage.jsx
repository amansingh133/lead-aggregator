import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { PageHeader } from '../../components/PageHeader';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchMetaConnections,
  startMetaOAuth,
  disconnectMeta,
} from '../../features/social/metaConnectionSlice';
import { useConfirm } from '../../hooks/useConfirm';
import { useAuth } from '../../hooks/useAuth';
import { showToast } from '../../features/ui/uiSlice';
import { formatDateTime } from '../../utils/formatters';

export default function MetaConnectionPage() {
  const dispatch = useAppDispatch();
  const confirm = useConfirm();
  const { isSuperAdmin } = useAuth();
  const { connections, status } = useAppSelector((state) => state.metaConnection);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    dispatch(fetchMetaConnections());
  }, [dispatch]);

  const handleConnect = async () => {
    setConnecting(true);
    const result = await dispatch(startMetaOAuth());
    if (startMetaOAuth.fulfilled.match(result) && result.payload?.authUrl) {
      window.location.assign(result.payload.authUrl);
      return; // leaving the page
    }
    setConnecting(false);
    dispatch(showToast(result.payload?.message || 'Could not start Facebook sign-in', 'error'));
  };

  const handleDisconnect = async (conn) => {
    const ok = await confirm({
      title: 'Disconnect Page',
      message: `Disconnect "${conn.pageName || conn.pageId}"? Real-time lead delivery is turned off and new Facebook leads from this Page stop arriving until it is reconnected.`,
      confirmLabel: 'Disconnect',
      severity: 'error',
    });
    if (!ok) return;
    const result = await dispatch(disconnectMeta(conn.id));
    if (disconnectMeta.fulfilled.match(result)) {
      dispatch(showToast('Page disconnected', 'success'));
    } else {
      dispatch(showToast(result.payload?.message || 'Disconnect failed', 'error'));
    }
  };

  const connectLabel = connections.length === 0 ? 'Connect account' : 'Connect another account';
  const adsExpired = (conn) =>
    conn.userTokenExpiresAt && new Date(conn.userTokenExpiresAt) < new Date();
  // A long-lived user token usually has no numeric expiry, so presence of ad
  // accounts (or the ads_read scope) is the real "ads access" signal here —
  // not userTokenExpiresAt.
  const hasAdsAccess = (conn) =>
    (conn.adAccounts?.length ?? 0) > 0 || (conn.grantedScopes || []).includes('ads_read');

  return (
    <>
      <PageHeader
        title="Meta Connections"
        actions={
          <Button
            startIcon={<FacebookIcon />}
            variant="contained"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? 'Opening Facebook…' : connectLabel}
          </Button>
        }
      />

      {status === 'loading' && connections.length === 0 ? (
        <LoadingState />
      ) : connections.length === 0 ? (
        <EmptyState
          title="No Facebook Pages connected"
          description='Click "Connect account", sign in with Facebook, and choose the Page(s) whose Lead Ads should flow into this app.'
        />
      ) : (
        <Grid container spacing={2}>
          {connections.map((conn) => (
            <Grid item xs={12} sm={6} md={4} key={conn.id}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="subtitle1">{conn.pageName || conn.pageId}</Typography>
                    <Chip
                      size="small"
                      color={conn.webhookSubscribed ? 'success' : 'warning'}
                      label={conn.webhookSubscribed ? 'Real-time on' : 'Real-time off'}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Page ID: {conn.pageId}
                  </Typography>

                  {conn.adAccounts?.length > 0 && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      {conn.adAccounts.map((a) => (
                        <Chip
                          key={a.id}
                          size="small"
                          variant="outlined"
                          label={`${a.name || a.id}${a.currency ? ` · ${a.currency}` : ''}`}
                        />
                      ))}
                    </Stack>
                  )}

                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Connected: {formatDateTime(conn.lastValidatedAt)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={adsExpired(conn) ? 'error' : 'text.secondary'}
                      sx={{ display: 'block' }}
                    >
                      {adsExpired(conn)
                        ? 'Ads access expired — reconnect to sync campaigns'
                        : !hasAdsAccess(conn)
                        ? 'Ads access not granted'
                        : conn.userTokenExpiresAt
                        ? `Ads access valid until ${formatDateTime(conn.userTokenExpiresAt)}`
                        : 'Ads access granted'}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                    <Button size="small" component={RouterLink} to="/social/campaigns">
                      Campaigns
                    </Button>
                    <Button size="small" onClick={handleConnect} disabled={connecting}>
                      Reconnect
                    </Button>
                    {isSuperAdmin && (
                      <Button
                        size="small"
                        color="error"
                        startIcon={<LinkOffIcon />}
                        onClick={() => handleDisconnect(conn)}
                      >
                        Disconnect
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}
