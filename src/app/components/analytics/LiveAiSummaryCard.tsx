"use client";

import { useEffect, useState } from "react";
import { Card, Spin, Typography, notification } from "antd";
import api from "@/lib/api";

const { Title, Text } = Typography;

export default function LiveAiSummaryCard({ internId }: { internId: string }) {
  const [summary, setSummary] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const res = await api.post(`/ai/summary/${internId}`);
        setSummary(res.data.summary);
      } catch (err) {
        notification.error({ message: "Failed to load AI summary" });
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [internId]);

  return (
    <Card title="AI Summary">
      {loading ? <Spin /> : <Text>{summary || "No summary available"}</Text>}
    </Card>
  );
}
