import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import TuneIcon from "@mui/icons-material/Tune";
import { apiFetch } from "../api/client";

interface Config {
  maxAttempts: number;
  lockoutSeconds: number;
  timeoutSeconds: number;
  alertThreshold: number;
  methods: string[];
}

function toggleMethod(methods: string[], method: string): string[] {
  return methods.includes(method) ? methods.filter((m) => m !== method) : [...methods, method];
}

export function ConfigEditorPage() {
  const { appId } = useParams<{ appId: string }>();
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch(`/api/config/${appId}`)
      .then((response) => response.json())
      .then(setConfig);
  }, [appId]);

  function updateConfig(next: Config) {
    setConfig(next);
    setSaved(false);
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    await apiFetch(`/api/config/${appId}`, { method: "PUT", body: JSON.stringify(config) });
    setSaving(false);
    setSaved(true);
  }

  if (!config) {
    return null;
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 680, mx: "auto" }}>
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
        <TuneIcon sx={{ color: "primary.light" }} />
        <Typography variant="h5">Config</Typography>
      </Stack>

      <Paper sx={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        {/* Security section */}
        <Box sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.1em", fontSize: "0.7rem" }}>
            Security limits
          </Typography>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField
              label="Max attempts"
              type="number"
              value={config.maxAttempts}
              onChange={(e) => updateConfig({ ...config, maxAttempts: Number(e.target.value) })}
              helperText="Wrong entries before lockout is triggered"
              fullWidth
            />
            <TextField
              label="Lockout seconds"
              type="number"
              value={config.lockoutSeconds}
              onChange={(e) => updateConfig({ ...config, lockoutSeconds: Number(e.target.value) })}
              helperText="How long the lockout lasts"
              fullWidth
            />
            <TextField
              label="Alert after"
              type="number"
              value={config.alertThreshold}
              onChange={(e) => updateConfig({ ...config, alertThreshold: Number(e.target.value) })}
              helperText="Failed attempts per device before a suspicious-device alert is raised"
              fullWidth
            />
          </Stack>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

        {/* Behaviour section */}
        <Box sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.1em", fontSize: "0.7rem" }}>
            Behaviour
          </Typography>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField
              label="Timeout seconds"
              type="number"
              value={config.timeoutSeconds}
              onChange={(e) => updateConfig({ ...config, timeoutSeconds: Number(e.target.value) })}
              helperText="Idle time before the app auto-locks"
              fullWidth
            />
          </Stack>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

        {/* Methods section */}
        <Box sx={{ p: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.1em", fontSize: "0.7rem" }}>
            Unlock methods
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            {(["pin", "biometric", "pattern"] as const).map((method) => (
              <FormControlLabel
                key={method}
                control={
                  <Checkbox
                    checked={config.methods.includes(method)}
                    onChange={() => updateConfig({ ...config, methods: toggleMethod(config.methods, method) })}
                    sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
                  />
                }
                label={method.charAt(0).toUpperCase() + method.slice(1)}
                sx={{ mr: 0 }}
              />
            ))}
          </Stack>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />

        {/* Footer */}
        <Box sx={{ p: 3, bgcolor: "rgba(255,255,255,0.02)" }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Changes take effect on the next app launch.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saved ? <CheckIcon /> : undefined}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            {saved && (
              <Typography variant="body2" color="success.main" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CheckIcon sx={{ fontSize: 16 }} />
                Saved
              </Typography>
            )}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}