"use client";

import { useEffect, useState } from "react";
import { Card, Spin, notification } from "antd";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";
import api from "@/lib/api";

export default function RepoTimeSeriesChart({ internId }: { internId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/analytics/github-timeseries/${internId}`);
        setData(res.data);
      } catch (err) {
        notification.error({ message: "Failed to load time series data" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [internId]);

  return (
    <Card title="GitHub Activity Over Time">
      {loading ? (
        <Spin />
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="commits" stroke="#1890ff" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
