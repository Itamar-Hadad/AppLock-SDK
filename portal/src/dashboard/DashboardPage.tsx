import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Box,
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
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import DevicesIcon from "@mui/icons-material/Devices";
import { apiFetch } from "../api/client";

interface DailyTrendPoint {
  date: string;
  unlocks: number;
}

interface MethodBreakdown {
  pin: number;
  pattern: number;
  biometric: number;
}

interface SuspiciousDevice {
  deviceId: string;
  failCount: number;
  lastSeen: string;
}

interface Analytics {
  unlocksToday: number;
  failedAttemptsToday: number;
  biometricPercentage: number;
  hourlyUnlocks: number[];
  dailyTrend: DailyTrendPoint[];
  methodBreakdown: MethodBreakdown;
  suspiciousDevices: SuspiciousDevice[];
}

const STAT_CARDS = [
  {
    key: "unlocksToday" as const,
    label: "Unlocks today",
    icon: LockOpenOutlinedIcon,
    gradient: "linear-gradient(135deg, #6366f1 0%, #818CF8 100%)",
    format: (v: number) => String(v),
  },
  {
    key: "failedAttemptsToday" as const,
    label: "Failed attempts",
    icon: WarningAmberIcon,
    gradient: "linear-gradient(135deg, #dc2626 0%, #F87171 100%)",
    format: (v: number) => String(v),
  },
  {
    key: "biometricPercentage" as const,
    label: "Biometric usage",
    icon: FingerprintIcon,
    gradient: "linear-gradient(135deg, #0891b2 0%, #67e8f9 100%)",
    format: (v: number) => `${v}%`,
  },
] as const;

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper
      sx={{
        p: 3,
        mt: 3,
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 2,
        animation: "fadeIn 0.5s ease-out",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

export function DashboardPage() {
  const { appId } = useParams<{ appId: string }>();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    apiFetch(`/api/analytics/${appId}`)
      .then((response) => response.json())
      .then(setAnalytics);
  }, [appId]);

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 1100, mx: "auto" }}>
      {/* Navigation */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to="/apps"
          underline="hover"
          variant="body2"
          sx={{ color: "text.secondary", "&:hover": { color: "primary.light" } }}
        >
          ← Your apps
        </Link>
        <Link
          component={RouterLink}
          to={`/apps/${appId}/alerts`}
          underline="hover"
          variant="body2"
          sx={{ color: "text.secondary", "&:hover": { color: "primary.light" } }}
        >
          Alerts
        </Link>
        <Link
          component={RouterLink}
          to={`/apps/${appId}/config`}
          underline="hover"
          variant="body2"
          sx={{ color: "text.secondary", "&:hover": { color: "primary.light" } }}
        >
          Config
        </Link>
      </Stack>

      {/* Stat cards */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        {STAT_CARDS.map(({ key, label, icon: Icon, gradient, format }, idx) => (
          <Paper
            key={key}
            sx={{
              flex: 1,
              p: 2.5,
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 2,
              animation: "fadeSlideUp 0.4s ease-out",
              animationDelay: `${idx * 0.07}s`,
              animationFillMode: "both",
            }}
          >
            <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                  {analytics === null ? "—" : format(analytics[key])}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ color: "#fff", fontSize: 22 }} />
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* Hourly chart */}
      <ChartCard title="Unlocks by hour">
        <BarChart
          height={260}
          series={[{ data: analytics?.hourlyUnlocks ?? Array(24).fill(0), label: "Unlocks", color: "#818CF8" }]}
          xAxis={[{ data: Array.from({ length: 24 }, (_, h) => h), scaleType: "band" }]}
          sx={{ "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": { stroke: "rgba(255,255,255,0.15)" } }}
        />
      </ChartCard>

      {/* 7-day trend */}
      <ChartCard title="Unlocks over the last 7 days">
        <LineChart
          height={260}
          series={[{
            data: analytics?.dailyTrend?.map((p) => p.unlocks) ?? Array(7).fill(0),
            label: "Unlocks",
            color: "#34D399",
            area: true,
          }]}
          xAxis={[{
            data: analytics?.dailyTrend?.map((p) => p.date) ?? Array(7).fill(""),
            scaleType: "band",
          }]}
          sx={{ "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": { stroke: "rgba(255,255,255,0.15)" } }}
        />
      </ChartCard>

      {/* Method breakdown */}
      <ChartCard title="Unlocks by method">
        <PieChart
          height={260}
          series={[{
            data: [
              { id: "pin",       label: "PIN",        value: analytics?.methodBreakdown?.pin       ?? 0, color: "#818CF8" },
              { id: "pattern",   label: "Pattern",    value: analytics?.methodBreakdown?.pattern   ?? 0, color: "#34D399" },
              { id: "biometric", label: "Biometric",  value: analytics?.methodBreakdown?.biometric ?? 0, color: "#67e8f9" },
            ],
          }]}
        />
      </ChartCard>

      {/* Suspicious devices */}
      <Paper sx={{ p: 3, mt: 3, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
          <DevicesIcon sx={{ color: "warning.main", fontSize: 20 }} />
          <Typography variant="h6">Suspicious devices</Typography>
          {!!analytics?.suspiciousDevices?.length && (
            <Chip
              label={analytics.suspiciousDevices.length}
              size="small"
              sx={{ bgcolor: "rgba(251,191,36,0.15)", color: "warning.main", border: "1px solid rgba(251,191,36,0.3)", ml: 0.5 }}
            />
          )}
        </Stack>

        {!analytics?.suspiciousDevices?.length ? (
          <Typography color="text.secondary" variant="body2">
            No suspicious devices
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Device ID</TableCell>
                  <TableCell>Failed attempts</TableCell>
                  <TableCell>Last seen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics.suspiciousDevices.map((device) => (
                  <TableRow key={device.deviceId}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {device.deviceId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={device.failCount}
                        size="small"
                        sx={{ bgcolor: "rgba(248,113,113,0.15)", color: "error.main", border: "1px solid rgba(248,113,113,0.3)" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(device.lastSeen).toLocaleString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}