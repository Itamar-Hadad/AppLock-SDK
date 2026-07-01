import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { apiFetch } from "../api/client";

interface Alert {
  _id: string;
  deviceId: string;
  failCount: number;
  firstSeen: string;
  lastSeen: string;
  status: string;
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, { bgcolor: string; color: string; border: string }> = {
    OPEN:    { bgcolor: "rgba(248,113,113,0.15)", color: "#F87171", border: "1px solid rgba(248,113,113,0.3)" },
    HANDLED: { bgcolor: "rgba(52,211,153,0.15)",  color: "#34D399", border: "1px solid rgba(52,211,153,0.3)"  },
    IGNORED: { bgcolor: "rgba(148,163,184,0.12)", color: "#94A3B8", border: "1px solid rgba(148,163,184,0.2)" },
  };
  const sx = styles[status] ?? styles.IGNORED;
  return <Chip label={status} size="small" sx={{ ...sx, fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.04em" }} />;
}

export function AlertsPage() {
  const { appId } = useParams<{ appId: string }>();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    apiFetch(`/api/alerts/${appId}`)
      .then((response) => response.json())
      .then(setAlerts);
  }, [appId]);

  async function updateStatus(alertId: string, status: "HANDLED" | "IGNORED") {
    const response = await apiFetch(`/api/alerts/${appId}/${alertId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    const updated = await response.json();
    setAlerts((current) => current.map((alert) => (alert._id === alertId ? updated : alert)));
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 1100, mx: "auto" }}>
      <Link
        component={RouterLink}
        to={`/apps/${appId}/dashboard`}
        underline="hover"
        variant="body2"
        sx={{ color: "text.secondary", display: "inline-block", mb: 3, "&:hover": { color: "primary.light" } }}
      >
        ← Dashboard
      </Link>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
        <NotificationsActiveIcon sx={{ color: "warning.main" }} />
        <Typography variant="h5">Alerts</Typography>
        {alerts.length > 0 && (
          <Chip
            label={alerts.length}
            size="small"
            sx={{ bgcolor: "rgba(251,191,36,0.15)", color: "warning.main", border: "1px solid rgba(251,191,36,0.3)" }}
          />
        )}
      </Stack>

      {alerts.length === 0 ? (
        <Paper
          sx={{
            p: 5,
            textAlign: "center",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 2,
          }}
        >
          <Typography color="text.secondary">No alerts</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Device ID</TableCell>
                <TableCell>Failed attempts</TableCell>
                <TableCell>First seen</TableCell>
                <TableCell>Last seen</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow
                  key={alert._id}
                  sx={alert.status === "OPEN" ? { bgcolor: "rgba(248,113,113,0.04)" } : undefined}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {alert.deviceId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={alert.failCount}
                      size="small"
                      sx={{ bgcolor: "rgba(248,113,113,0.15)", color: "error.main", border: "1px solid rgba(248,113,113,0.3)" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(alert.firstSeen).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(alert.lastSeen).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={alert.status} />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => updateStatus(alert._id, "HANDLED")}
                        sx={{ color: "success.main", borderColor: "rgba(52,211,153,0.4)", "&:hover": { borderColor: "success.main", bgcolor: "rgba(52,211,153,0.06)" } }}
                      >
                        Handled
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => updateStatus(alert._id, "IGNORED")}
                        sx={{ color: "text.secondary", borderColor: "rgba(148,163,184,0.3)", "&:hover": { borderColor: "text.secondary", bgcolor: "rgba(148,163,184,0.06)" } }}
                      >
                        Ignored
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}