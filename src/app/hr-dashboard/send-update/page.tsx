'use client';
import { useState } from 'react';
import { Form, Input, Button, Select, Card, notification } from 'antd';
import api from '@/lib/api';

export default function SendUpdatePage({ interns }: { interns: { id: string; email: string }[] }) {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await api.post('/auth/send-update', { ...values, internIds: values.interns });
      notification.success({ message: 'Emails sent successfully!' });
    } catch (e: any) {
      notification.error({ message: 'Error', description: e?.message });
    } finally { setLoading(false); }
  };

  return (
    <Card title="Send Update to Interns" style={{ width: 600, margin: 'auto', marginTop: 40 }}>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="message" label="Message" rules={[{ required: true }]}>
          <Input.TextArea rows={4} />
        </Form.Item>
        <Form.Item name="interns" label="Select Interns" rules={[{ required: true }]}>
          <Select mode="multiple" options={interns.map(i => ({ label: i.email, value: i.id }))} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>Send Emails</Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
