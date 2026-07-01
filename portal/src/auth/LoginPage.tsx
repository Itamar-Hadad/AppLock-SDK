import { useState, type FormEvent } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Divider,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { apiFetch } from "../api/client";
import { useAuth } from "./AuthContext";

const GOOGLE_SIGN_IN_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`;

function GoogleLogo() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refresh } = useAuth();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error);
      return;
    }

    await refresh();
    navigate("/apps");
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
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sign in to your developer account
        </Typography>

        <Stack spacing={2}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
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
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />

          <Button type="submit" variant="contained" fullWidth size="large">
            Log in
          </Button>

          <Divider sx={{ fontSize: "0.75rem", color: "text.secondary" }}>or</Divider>

          {/* Google sign-in — must remain an <a> so tests find it as role="link" */}
          <Box
            component="a"
            href={GOOGLE_SIGN_IN_URL}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              py: 1.25,
              px: 2,
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 2,
              textDecoration: "none",
              color: "text.primary",
              cursor: "pointer",
              transition: "border-color 0.15s, background 0.15s",
              fontFamily: "inherit",
              fontSize: "0.9375rem",
              fontWeight: 500,
              "&:hover": {
                borderColor: "rgba(255,255,255,0.35)",
                bgcolor: "rgba(255,255,255,0.04)",
              },
            }}
          >
            <GoogleLogo />
            Sign in with Google
          </Box>

          <Stack direction="row" sx={{ justifyContent: "space-between", pt: 0.5 }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2" underline="hover">
              Forgot password?
            </Link>
            <Link component={RouterLink} to="/signup" variant="body2" underline="hover">
              Sign up
            </Link>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}