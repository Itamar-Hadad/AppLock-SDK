import { Outlet, useNavigate } from "react-router-dom";
import { AppBar, Avatar, Box, Button, Stack, Toolbar, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../auth/AuthContext";

export function AuthenticatedLayout() {
  const { developer, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const initials = developer?.displayName
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky">
        <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}>
          {/* Brand */}
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                background: "linear-gradient(135deg, #818CF8, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <LockOutlinedIcon sx={{ color: "#fff", fontSize: 17 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1rem" }}>
              AppLock Portal
            </Typography>
          </Stack>

          {/* User + logout */}
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: "0.75rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #818CF8, #6366f1)",
              }}
            >
              {initials}
            </Avatar>
            {/* Keep the name as visible text — test checks for it */}
            <Typography variant="body2" sx={{ color: "text.secondary", display: { xs: "none", sm: "block" } }}>
              {developer?.displayName}
            </Typography>
            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
              size="small"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                "&:hover": { color: "text.primary", bgcolor: "rgba(255,255,255,0.06)" },
              }}
            >
              Log out
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Outlet />
    </Box>
  );
}