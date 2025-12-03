"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Button,
  Typography,
  Spin,
  notification,
  Tabs,
  Alert,
  Tooltip as AntdTooltip
} from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { GithubOutlined } from "@ant-design/icons";
import api from "@/lib/api";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface TimeSeriesData {
  date: string;
  commits: number;
}

interface RepoDetails {
  name: string;
  stars: number;
  forks: number;
  url: string;
  timeseries: TimeSeriesData[];
}

export default function RepoDetailsPage() {
  const { internId, repoId: repoName } = useParams();
  const router = useRouter();
  const [repo, setRepo] = useState<RepoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Helper Functions ---
  const parseDateAuto = useCallback((d: string): Date | null => {
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  // --- Data Fetching ---
  const fetchRepoDetails = useCallback(async () => {
    if (!internId || !repoName) {
      setError('Intern ID or Repository name missing in URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.get<RepoDetails>(
        `/analytics/github/${internId}/repo/${repoName}`
      );
      setRepo(res.data);
    } catch (err: any) {
      console.error('Error loading repo details:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to load repository details.');
      notification.error({
        message: "Failed to load repository details",
        description: err?.response?.data?.message || err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [internId, repoName]);

  // --- Data Processing ---
  const dailyData = useMemo(() => {
    if (!repo) return [];
    return repo.timeseries.map((p) => {
      const d = parseDateAuto(p.date);
      return {
        date: d ? d.toLocaleDateString() : p.date,
        commits: p.commits,
      };
    });
  }, [repo, parseDateAuto]);

  const weeklyData = useMemo(() => {
    if (!repo) return [];
    const map: Record<string, number> = {};
    for (const p of repo.timeseries) {
      const d = parseDateAuto(p.date);
      if (!d) continue;
      const yearStart = new Date(d.getFullYear(), 0, 1);
      const diff = d.getTime() - yearStart.getTime();
      const oneWeek = 1000 * 60 * 60 * 24 * 7;
      const weekNumber = Math.ceil(diff / oneWeek);
      const weekId = `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
      map[weekId] = (map[weekId] || 0) + p.commits;
    }
    return Object.entries(map)
      .map(([week, commits]) => ({ week, commits }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [repo, parseDateAuto]);

  const monthlyData = useMemo(() => {
    if (!repo) return [];
    const map: Record<string, number> = {};
    for (const p of repo.timeseries) {
      const d = parseDateAuto(p.date);
      if (!d) continue;
      const month = `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
      map[month] = (map[month] || 0) + p.commits;
    }
    return Object.entries(map)
      .map(([month, commits]) => ({ month, commits }))
      .sort((a, b) => {
        const dateA = new Date(a.month.replace(' ', ' 1, '));
        const dateB = new Date(b.month.replace(' ', ' 1, '));
        return dateA.getTime() - dateB.getTime();
      });
  }, [repo, parseDateAuto]);

  const heatmapData = useMemo(() => {
    if (!repo) return [];
    const maxCommitsPerDay = Math.max(...dailyData.map(d => d.commits), 1);
    return dailyData.map((day) => ({
      ...day,
      intensity: day.commits / maxCommitsPerDay,
    }));
  }, [dailyData]);

  // --- Effects ---
  useEffect(() => {
    fetchRepoDetails();
  }, [fetchRepoDetails]);

  // --- Render Helpers ---
  const renderHeatmapTooltip = useCallback((day: { date: string; commits: number }) => (
    <AntdTooltip title={`${day.date}: ${day.commits} commits`}>
      <div>{day.date}</div>
    </AntdTooltip>
  ), []);

  // --- Loading/Error States ---
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="large" tip="Loading repository details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          message="Failed to load repository details"
          description={error}
          showIcon
        />
        <Button
          type="primary"
          style={{ marginTop: 16 }}
          onClick={() => router.push(`/mentor/interns/${internId}/github`)}
        >
          Back to GitHub Overview
        </Button>
      </div>
    );
  }

  if (!repo) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="info"
          message="No repository data found"
          description={`No data found for repository: ${repoName}`}
          showIcon
        />
        <Button
          type="primary"
          style={{ marginTop: 16 }}
          onClick={() => router.push(`/mentor/interns/${internId}/github`)}
        >
          Back to GitHub Overview
        </Button>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>{repo.name}</Title>

      <Card style={{ marginBottom: 16 }}>
        <Text strong>Stars:</Text> {repo.stars} <br />
        <Text strong>Forks:</Text> {repo.forks} <br />
        <br />
        <Button
          type="primary"
          icon={<GithubOutlined />}
          onClick={() => window.open(repo.url, "_blank")}
        >
          Open on GitHub
        </Button>
      </Card>

      <Tabs defaultActiveKey="daily">
        {/* Daily Commits Tab */}
        <TabPane tab="Daily Commits" key="daily">
          <Card>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="commits"
                    stroke="#1890ff"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabPane>

        {/* Weekly Commits Tab */}
        <TabPane tab="Weekly Commits" key="weekly">
          <Card>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={weeklyData}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="commits">
                    {weeklyData.map((_, i) => (
                      <Cell key={i} fill="#82ca9d" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabPane>

        {/* Monthly Commits Tab */}
        <TabPane tab="Monthly Commits" key="monthly">
          <Card>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="commits">
                    {monthlyData.map((_, i) => (
                      <Cell key={i} fill="#ffc658" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabPane>

        {/* Activity Heatmap Tab */}
        <TabPane tab="Activity Heatmap" key="heatmap">
          <Card>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: '100%' }}>
              {heatmapData.map((day, i) => {
                const heatColors = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
                const colorIndex = Math.min(
                  heatColors.length - 1,
                  Math.floor(day.intensity * heatColors.length)
                );
                return (
                  <AntdTooltip
                    key={i}
                    title={`${day.date}: ${day.commits} commits`}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 2,
                        background: heatColors[colorIndex],
                      }}
                    />
                  </AntdTooltip>
                );
              })}
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}
