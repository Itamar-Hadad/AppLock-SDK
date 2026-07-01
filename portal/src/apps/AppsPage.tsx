import { useEffect, useState, type FormEvent } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
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
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { apiFetch } from "../api/client";

interface App {
  appId: string;
  name: string;
  packageName: string;
  revoked: boolean;
  requestsToday: number;
  lastSdkVersion: string | null;
}

interface NewAppCredentials {
  appId: string;
  apiKey: string;
}

const dialogPaperSx = {
  bgcolor: "background.paper",
  backgroundImage: "none",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 3,
  minWidth: 380,
};

const revokeDialogPaperSx = {
  bgcolor: "background.paper",
  backgroundImage: "none",
  border: "1px solid rgba(248,113,113,0.25)",
  borderRadius: 3,
  minWidth: 380,
};

export function AppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [newCredentials, setNewCredentials] = useState<NewAppCredentials | null>(null);
  const [appToRevoke, setAppToRevoke] = useState<App | null>(null);

  function loadApps() {
    return apiFetch("/api/apps")
      .then((response) => response.json())
      .then(setApps);
  }

  useEffect(() => {
    loadApps();
  }, []);

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    const response = await apiFetch("/api/apps", { method: "POST", body: JSON.stringify({ name, packageName }) });
    const credentials = await response.json();
    setFormOpen(false);
    setName("");
    setPackageName("");
    setNewCredentials(credentials);
  }

  function handleDismissCredentials() {
    setNewCredentials(null);
    loadApps();
  }

  async function handleConfirmRevoke() {
    await apiFetch(`/api/apps/${appToRevoke?.appId}/revoke`, { method: "POST" });
    setAppToRevoke(null);
    loadApps();
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 1100, mx: "auto" }}>
      <Stack direction="row" sx={{ mb: 3, justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h5">Your apps</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage registered apps and their API keys
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
          size="large"
        >
          Register new app
        </Button>
      </Stack>

      <TableContainer component={Paper} sx={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Package name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requests today</TableCell>
              <TableCell>SDK version</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.appId}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {app.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                    {app.packageName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={app.revoked ? "Revoked" : "Active"}
                    size="small"
                    sx={{
                      bgcolor: app.revoked ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)",
                      color: app.revoked ? "error.main" : "success.main",
                      border: "1px solid",
                      borderColor: app.revoked ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{app.requestsToday}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {app.lastSdkVersion ?? "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button
                      component={RouterLink}
                      to={`/apps/${app.appId}/dashboard`}
                      size="small"
                      variant="outlined"
                      sx={{
                        borderColor: "rgba(129,140,248,0.4)",
                        color: "primary.light",
                        "&:hover": { borderColor: "primary.main" },
                      }}
                    >
                      View dashboard
                    </Button>
                    {!app.revoked && (
                      <Button
                        color="error"
                        size="small"
                        variant="outlined"
                        onClick={() => setAppToRevoke(app)}
                        sx={{ borderColor: "rgba(248,113,113,0.4)", "&:hover": { borderColor: "error.main" } }}
                      >
                        Revoke key
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Register dialog ── */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} slotProps={{ paper: { sx: dialogPaperSx } }}>
        <Box component="form" onSubmit={handleRegister}>
          <DialogTitle>Register new app</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
              <TextField
                label="Package name"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                required
                fullWidth
                placeholder="com.example.myapp"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setFormOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained">Register</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ── Credentials dialog ── */}
      <Dialog open={newCredentials !== null} onClose={handleDismissCredentials} slotProps={{ paper: { sx: { ...dialogPaperSx, minWidth: 420 } } }}>
        <DialogTitle>App registered</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }} color="text.secondary">
            Copy your API key now — it will not be shown again.
          </Typography>
          <Stack spacing={1.5}>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.04)", borderRadius: 2, p: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                App ID
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                {newCredentials?.appId}
              </Typography>
            </Box>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.04)", borderRadius: 2, p: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                API key
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                {newCredentials?.apiKey}
              </Typography>
            </Box>
            <Button
              onClick={() => navigator.clipboard.writeText(newCredentials?.apiKey ?? "")}
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              sx={{ alignSelf: "flex-start" }}
            >
              Copy API key
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleDismissCredentials} variant="contained">Done</Button>
        </DialogActions>
      </Dialog>

      {/* ── Revoke confirm dialog ── */}
      <Dialog open={appToRevoke !== null} onClose={() => setAppToRevoke(null)} slotProps={{ paper: { sx: revokeDialogPaperSx } }}>
        <DialogTitle>Revoke key for {appToRevoke?.name}?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This cannot be undone. Apps using the current apiKey will immediately stop authenticating.
            The appId and its historical data are unaffected.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAppToRevoke(null)} color="inherit">Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmRevoke}>Revoke</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}