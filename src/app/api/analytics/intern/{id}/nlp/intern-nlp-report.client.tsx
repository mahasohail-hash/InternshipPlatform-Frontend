// app/api/analytics/intern/[id]/nlp/intern-nlp-report.client.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Card, Spin, Typography, Tag, notification, Row, Col } from "antd";
import { RobotOutlined } from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import api from "@/lib/api";

const { Title, Text } = Typography;

export default function InternNlpReport({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNlp = async () => {
      if (!id) {
        notification.error({ message: 'Intern ID is missing.' });
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/analytics/intern/${id}/nlp`);
        setData(res.data);
      } catch (err: any) {
        const message = err?.response?.data?.message || err.message || 'Failed to load NLP report';
        notification.error({
          message: "Failed to load NLP report",
          description: message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNlp();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <Title level={3}>NLP Analysis</Title>
        <Text>No NLP data available.</Text>
      </Card>
    );
  }

  const overall = (data?.overallSentiment || "N/A").toLowerCase();
  let sentimentColor: string = "default";
  if (overall === "positive") sentimentColor = "green";
  if (overall === "neutral") sentimentColor = "blue";
  if (overall === "negative") sentimentColor = "red";
  const sentimentEmoji =
    overall === "positive" ? "😊" : overall === "neutral" ? "😐" : overall === "negative" ? "😞" : "❔";

  const chartData = (data?.sentimentTimeline || []).map((s: any) => ({
    date: new Date(s.date).toLocaleDateString(),
    score: s.score === "positive" ? 1 : s.score === "negative" ? -1 : 0,
    label: s.score,
  }));

  const emotions = data?.emotions || {};
  const radarData = Object.keys(emotions).map((k) => ({
    subject: k,
    A: Math.max(0, Number(emotions[k]) || 0),
    fullMark: 1,
  }));

  const topicData = (data?.topics || []).map((t: any) => ({
    topic: t.topic,
    frequency: t.frequency || 0,
  }));

  return (
    <Card style={{ padding: 20 }}>
      <Title level={3}>NLP Analysis Report</Title>
      <Card
        title={
          <span>
            <RobotOutlined style={{ marginRight: 8 }} /> AI Summary
          </span>
        }
        style={{
          marginBottom: 20,
          borderLeft: "4px solid #1677ff",
        }}
      >
        <Text strong>{data?.sentimentSummary || "No summary available."}</Text>
      </Card>
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Overall Sentiment" style={{ marginBottom: 20 }}>
            <Text strong>Detected Sentiment: </Text>
            <Tag color={sentimentColor} style={{ fontSize: 14, padding: "4px 10px" }}>
              {overall}
            </Tag>
            <span style={{ fontSize: 22, marginLeft: 10 }}>{sentimentEmoji}</span>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">{data?.sentimentSummary || "No NLP summary available for this intern."}</Text>
            </div>
          </Card>
          <Card title="Sentiment Trend Line Chart" style={{ marginBottom: 20 }}>
            {chartData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[-1, 1]} ticks={[-1, 0, 1]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Text type="secondary">No sentiment timeline available.</Text>
            )}
          </Card>
          <Card title="Top Keywords" style={{ marginBottom: 20 }}>
            {data?.keywords?.length ? (
              data.keywords.map((k: string) => (
                <Tag key={k} color="geekblue" style={{ marginBottom: 6 }}>
                  {k}
                </Tag>
              ))
            ) : (
              <Text type="secondary">No keywords found.</Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Emotion Radar" style={{ marginBottom: 20 }}>
            {radarData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 1]} />
                  <Radar name="emotion" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <Text type="secondary">No emotion data available.</Text>
            )}
          </Card>
          <Card title="Topic Frequencies">
            {topicData.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topicData}>
                  <XAxis dataKey="topic" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="frequency" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text type="secondary">No topic data available.</Text>
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  );
}
