"use client";
import { Form, Input, Button, Typography } from "antd";

const { Title, Text } = Typography;

interface Props {
  title: string;
  onSubmit: (values: any) => void;
  submitText: string;
  loading?: boolean;
  extra?: React.ReactNode;
  children?: React.ReactNode;
}

export default function AuthForm({ title, onSubmit, submitText, loading, extra, children }: Props) {
  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 8 }}>
      <Title level={2} style={{ textAlign: 'center' }}>{title}</Title>
      <Form layout="vertical" onFinish={onSubmit}>
        {children}
        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            {submitText}
          </Button>
        </Form.Item>
        {extra && <div style={{ marginTop: 12 }}>{extra}</div>}
      </Form>
    </div>
  );
}
