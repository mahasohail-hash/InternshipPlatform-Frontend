"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Card, Badge, Spin, Row, Col, Typography, notification, Empty } from "antd";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";

const { Title, Text } = Typography;

// --- Type Definitions ---
interface Task {
  id: string;
  title: string;
  summary: string;
  status: "completed" | "pending";
}

interface TaskSummary {
  total: number;
  completed: number;
  list: Task[];
}

interface GitHubRepo {
  name: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  totalCommits: number;
  timeseries: Array<{ date: string; commits: number }>;
}

interface GitHubSummary {
  repos: GitHubRepo[];
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
}

interface NlpSummary {
  sentimentSummary: string;
  overallSentiment: string;
  sentimentScore: number;
  keyThemes: string[];
}

interface InternInsights {
  nlp?: NlpSummary;
  tasks?: TaskSummary;
  github?: GitHubSummary;
  evaluations?: any[];
}
// --- End Type Definitions ---

export default function InternInsightsPage() {
  const { internId } = useParams<{ internId: string }>();
  const [insights, setInsights] = useState<InternInsights | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
  useEffect(() => {
    async function load() {
      try {
        const insightsRes = await api.get<InternInsights>(`/analytics/summary/${internId}`);
        setInsights(insightsRes.data);
      } catch (error: any) {
        notification.error({
          message: "Failed to load intern insights",
          description: error?.response?.data?.message || error.message,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [internId]);

  // --- Data Processing ---
  const taskData = useMemo(() => {
    if (!insights?.tasks) return [];

    return [
      {
        name: "Completed",
        value: insights.tasks.completed,
      },
      {
        name: "Pending",
        value: (insights.tasks.total ?? 0) - (insights.tasks.completed ?? 0),
      }
    ];
  }, [insights]);

  const COLORS = ["#00C49F", "#FF8042"];

  // --- Loading State ---
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  // --- Empty State ---
  if (!insights) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Title level={4} type="secondary">No insights available for this intern.</Title>
      </div>
    );
  }

  // --- Main Content ---
  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Intern Insights Dashboard</Title>

      {/* AI Performance Insight */}
      <Card title="AI Performance Insight" style={{ marginBottom: 20 }}>
        <Text>
          {insights?.nlp?.sentimentSummary || "No AI insight available."}
        </Text>
      </Card>

      {/* Evaluation Summary */}
      <Card title="Evaluation Summary" style={{ marginBottom: 20 }}>
        {insights?.evaluations?.length ? (
          <ul>
            {insights.evaluations.map((evaluation, index) => (
              <li key={index}>
                <Text strong>{evaluation.type || 'Evaluation'}:</Text> {evaluation.summary || 'No summary'}
              </li>
            ))}
          </ul>
        ) : (
          <Text>No evaluations available.</Text>
        )}
      </Card>

      {/* Task List and Status Breakdown */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Task List" style={{ marginBottom: 20 }}>
            {insights?.tasks?.list?.length ? (
              insights.tasks.list.map((task) => (
                <Card key={task.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <Text strong>{task.title}</Text>
                      <Text type="secondary">{task.summary}</Text>
                    </div>
                    <Badge
                      color={task.status === "completed" ? "green" : "blue"}
                      text={task.status}
                    />
                  </div>
                </Card>
              ))
            ) : (
              <Empty description="No tasks found" />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Task Status Breakdown">
            {taskData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={taskData}
                    dataKey="value"
                    nameKey="name"
                    label
                  >
                    {taskData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No task data available" />
            )}
          </Card>
        </Col>
      </Row>

      {/* GitHub Contributions */}
      <Card title="GitHub Contributions" style={{ marginTop: 20 }}>
        {insights?.github?.repos?.length ? (
          <Row gutter={16}>
            {insights.github.repos.map((repo) => (
              <Col xs={24} md={12} lg={8} key={repo.name}>
                <Card
                  title={repo.name}
                  extra={<a href={repo.url} target="_blank" rel="noopener noreferrer">View</a>}
                  style={{ marginBottom: 16 }}
                >
                  <Text type="secondary">{repo.description || "No description"}</Text>
                  <div style={{ margin: "12px 0" }}>
                    <Text strong>Stars:</Text> {repo.stars}<br />
                    <Text strong>Forks:</Text> {repo.forks}<br />
                    <Text strong>Total Commits:</Text> {repo.totalCommits}
                  </div>

                  {/* Commit Line Chart */}
                  {repo.timeseries?.length ? (
                    <div style={{ width: "100%", height: 200 }}>
                      <ResponsiveContainer>
                        <LineChart data={repo.timeseries}>
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
                  ) : (
                    <Text type="secondary">No commit history available</Text>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="No GitHub data found" />
        )}
      </Card>
    </div>
  );
}
