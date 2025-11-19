"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, Badge, Spin, Row, Col, Typography, notification } from "antd";

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

export default function InternInsightsPage() {
  const { internId } = useParams<{ internId: string }>();

  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const insightsRes = await api.get(`/analytics/summary/${internId}`);
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

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );

  if (!insights) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Title level={4} type="secondary">No insights available for this intern.</Title>
      </div>
    );
  }

  const taskData = [
    {
      name: "Completed",
      value: insights?.tasks?.completed ?? 0
    },
    {
      name: "Pending",
      // FIX: Ensure insights?.tasks?.total is also treated as 0 if null/undefined
      value: (insights?.tasks?.total ?? 0) - (insights?.tasks?.completed ?? 0)
    }
  ];

  const COLORS = ["#00C49F", "#FF8042"];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 25 }}>
        Intern Insights Dashboard
      </h1>

      <Card title="AI Performance Insight" style={{ marginBottom: 20 }}>
        <p>{insights?.nlp?.sentimentSummary || "No AI insight available."}</p>
      </Card>

      <Card title="Evaluation Summary" style={{ marginBottom: 20 }}>
        {/* Placeholder for evaluations, assuming your backend insights service will populate this */}
        <p>No evaluation available.</p>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Task List" style={{ marginBottom: 20 }}>
            {insights?.tasks?.list?.length ? (
              insights.tasks.list.map((task: any) => (
                <Card key={task.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontWeight: 600 }}>{task.title}</p>
                      <p style={{ color: "#777" }}>{task.summary}</p>
                    </div>
                    <Badge
                      color={task.status === "completed" ? "green" : "blue"}
                      text={task.status}
                    />
                  </div>
                </Card>
              ))
            ) : (
              <p>No tasks found.</p>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Task Status Breakdown">
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
          </Card>
        </Col>
      </Row>

      <Card title="GitHub Contributions" style={{ marginTop: 20 }}>
        {insights?.github?.repos?.length ? (
          <Row gutter={16}>
            {insights.github.repos.map((repo: any) => (
              <Col xs={24} md={12} lg={8} key={repo.name}>
                <Card
                  title={repo.name}
                  extra={<a href={repo.url} target="_blank" rel="noopener noreferrer">View</a>}
                >
                  <p>{repo.description || "No description"}</p>

                  <p><strong>Stars:</strong> {repo.stars}</p>
                  <p><strong>Forks:</strong> {repo.forks}</p>
                  <p><strong>Total Commits:</strong> {repo.totalCommits}</p>

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
                    <p>No commit history.</p>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <p>No GitHub data found.</p>
        )}
      </Card>
    </div>
  );
}