import { useState, type FormEvent } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, Link, Stack, TextField, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { apiFetch } from "../api/client";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await apiFetch("/api/auth/password-reset/request", { method: "POST", body: JSON.stringify({ email }) });
    setSent(true);
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0F0F1A 0%, #1a1040 55%, #0F0F1A 100%)",
        p: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 420,
          bgcolor: "rgba(30,30,46,0.88)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 3,
          p: { xs: 3, sm: 4 },
          animation: "fadeSlideUp 0.45s ease-out",
        }}
      >
        {/* Brand */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: "linear-gradient(135deg, #818CF8, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <LockOutlinedIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
            AppLock Portal
          </Typography>
        </Stack>

        <Typography variant="h5" sx={{ mb: 0.5 }}>
          Forgot password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          We'll send a reset link to your email
        </Typography>

        <Stack spacing={2}>
          {sent && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              If that email is registered, a reset link has been sent.
            </Alert>
          )}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />

          <Button type="submit" variant="contained" fullWidth size="large">
            Send reset link
          </Button>

          <Typography variant="body2" align="center" color="text.secondary">
            Remember it?{" "}
            <Link component={RouterLink} to="/login" underline="hover">
              Back to login
            </Link>
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}