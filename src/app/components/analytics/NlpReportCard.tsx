"use client";

import { Card, Tag, Typography } from "antd";

const { Text } = Typography;

export default function NlpReportCard({ data }: { data: any }) {
  return (
    <Card title="NLP Report">
      <div>
        <Text strong>Top Keywords:</Text>
        <br />
        {data.keywords?.map((k: string) => (
          <Tag key={k}>{k}</Tag>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <Text strong>Dominant Topics:</Text>
        <br />
        {data.topics?.map((t: any) => (
          <div key={t.topic}>
            {t.topic} — {t.frequency}
          </div>
        ))}
      </div>
    </Card>
  );
}
