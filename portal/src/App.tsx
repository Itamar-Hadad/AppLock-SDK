import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RequireAuth } from "./auth/RequireAuth";
import { LoginPage } from "./auth/LoginPage";
import { SignupPage } from "./auth/SignupPage";
import { ForgotPasswordPage } from "./auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./auth/ResetPasswordPage";
import { AppsPage } from "./apps/AppsPage";
import { DashboardPage } from "./dashboard/DashboardPage";
import { AlertsPage } from "./alerts/AlertsPage";
import { ConfigEditorPage } from "./config/ConfigEditorPage";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#818CF8",
      light: "#a5b4fc",
      dark: "#6366f1",
    },
    secondary: {
      main: "#34D399",
      light: "#6ee7b7",
      dark: "#10b981",
    },
    background: {
      default: "#0F0F1A",
      paper: "#1E1E2E",
    },
    error:   { main: "#F87171" },
    warning: { main: "#FBBF24" },
    success: { main: "#34D399" },
    text: {
      primary:   "#E2E8F0",
      secondary: "#94A3B8",
    },
    divider: "rgba(255,255,255,0.08)",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
          "&.MuiButton-containedPrimary": {
            background: "linear-gradient(135deg, #818CF8 0%, #6366f1 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #a5b4fc 0%, #818CF8 100%)",
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-root": {
            fontWeight: 700,
            color: "#94A3B8",
            textTransform: "uppercase",
            fontSize: "0.7rem",
            letterSpacing: "0.08em",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: "1px solid rgba(255,255,255,0.04)" },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background 0.15s",
          "&:hover": { backgroundColor: "rgba(129,140,248,0.05)" },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 700 } },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#13131F",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "none",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/signup"          element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/apps"                       element={<AppsPage />} />
            <Route path="/apps/:appId/dashboard"      element={<DashboardPage />} />
            <Route path="/apps/:appId/alerts"         element={<AlertsPage />} />
            <Route path="/apps/:appId/config"         element={<ConfigEditorPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/apps" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;