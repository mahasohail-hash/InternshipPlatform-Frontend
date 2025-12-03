"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Card, Spin, Typography, Tag, notification, Row, Col, Empty } from "antd";
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

// --- Type Definitions ---
interface SentimentTimeline {
  date: string;
  score: "positive" | "neutral" | "negative";
}

interface EmotionData {
  [key: string]: number;
}

interface TopicData {
  topic: string;
  frequency: number;
}

interface NlpReport {
  overallSentiment: "positive" | "neutral" | "negative" | string;
  sentimentSummary: string;
  sentimentTimeline: SentimentTimeline[];
  emotions: EmotionData;
  keywords: string[];
  topics: TopicData[];
}
// --- End Type Definitions ---

export default function InternNlpReport({ params }: { params: { id: string } }) {
  const { id } = params;
  const [data, setData] = useState<NlpReport | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchNlp = async () => {
      try {
        const res = await api.get<NlpReport>(`/analytics/intern/${id}/nlp`);
        setData(res.data);
      } catch (err: any) {
        notification.error({
          message: "Failed to load NLP report",
          description: err?.response?.data?.message || "NLP service could not load.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchNlp();
  }, [id]);

  // --- Data Processing ---
  const sentimentInfo = useMemo(() => {
    if (!data) return { color: "default", emoji: "❔" };

    const overall = (data.overallSentiment || "N/A").toLowerCase();
    let color = "default";
    let emoji = "❔";

    if (overall === "positive") {
      color = "green";
      emoji = "😊";
    } else if (overall === "neutral") {
      color = "blue";
      emoji = "😐";
    } else if (overall === "negative") {
      color = "red";
      emoji = "😞";
    }

    return { color, emoji };
  }, [data]);

  const chartData = useMemo(() => {
    if (!data?.sentimentTimeline) return [];

    return data.sentimentTimeline.map((s) => ({
      date: new Date(s.date).toLocaleDateString(),
      score: s.score === "positive" ? 1 : s.score === "negative" ? -1 : 0,
      label: s.score,
    }));
  }, [data]);

  const radarData = useMemo(() => {
    if (!data?.emotions) return [];

    return Object.keys(data.emotions).map((k) => ({
      subject: k,
      A: Math.max(0, Math.min(1, Number(data.emotions[k]) || 0)),
      fullMark: 1,
    }));
  }, [data]);

  const topicData = useMemo(() => {
    if (!data?.topics) return [];

    return data.topics.map((t) => ({
      topic: t.topic,
      frequency: t.frequency || 0,
    }));
  }, [data]);

  // --- Loading State ---
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  // --- Empty State ---
  if (!data) {
    return (
      <Card>
        <Title level={3}>NLP Analysis</Title>
        <Empty description="No NLP data available" />
      </Card>
    );
  }

  // --- Main Content ---
  return (
    <Card style={{ padding: 20 }}>
      <Title level={3}>
        <span>
          <RobotOutlined style={{ marginRight: 8 }} />
          NLP Analysis Report
        </span>
      </Title>

      <Card
        title={
          <span>
            <RobotOutlined style={{ marginRight: 8 }} />
            AI Summary
          </span>
        }
        style={{
          marginBottom: 20,
          borderLeft: "4px solid #1677ff",
        }}
      >
        <Text strong>{data.sentimentSummary || "No summary available."}</Text>
      </Card>

      <Row gutter={16}>
        {/* Left Column */}
        <Col xs={24} lg={12}>
          {/* Overall Sentiment */}
          <Card title="Overall Sentiment" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Text strong>Detected Sentiment: </Text>
              <Tag color={sentimentInfo.color} style={{ fontSize: 14, padding: "4px 10px", margin: "0 8px" }}>
                {data.overallSentiment}
              </Tag>
              <span style={{ fontSize: 22 }}>{sentimentInfo.emoji}</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">{data.sentimentSummary || "No NLP summary available for this intern."}</Text>
            </div>
          </Card>

          {/* Sentiment Trend */}
          <Card title="Sentiment Trend" style={{ marginBottom: 20 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[-1, 1]} ticks={[-1, 0, 1]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8884d8"
                    strokeWidth={3}
                    name="Sentiment Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No sentiment timeline available" />
            )}
          </Card>

          {/* Top Keywords */}
          <Card title="Top Keywords" style={{ marginBottom: 20 }}>
            {data.keywords && data.keywords.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.keywords.map((k) => (
                  <Tag key={k} color="geekblue">
                    {k}
                  </Tag>
                ))}
              </div>
            ) : (
              <Empty description="No keywords found" />
            )}
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={12}>
          {/* Emotion Radar */}
          <Card title="Emotion Radar" style={{ marginBottom: 20 }}>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 1]} />
                  <Radar
                    name="Emotion"
                    dataKey="A"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No emotion data available" />
            )}
          </Card>

          {/* Topic Frequencies */}
          <Card title="Topic Frequencies">
            {topicData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topicData}>
                  <XAxis dataKey="topic" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="frequency" fill="#82ca9d" name="Frequency" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No topic data available" />
            )}
          </Card>
        </Col>
      </Row>
    </Card>
  );
}
