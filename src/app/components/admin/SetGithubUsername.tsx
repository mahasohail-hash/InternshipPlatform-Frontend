// src/components/admin/SetGithubUsernameModal.tsx
"use client";

import React, { useState } from 'react';
import { Modal, Form, Input, Button, notification } from 'antd';
import api from '../../../lib/api';

interface SetGithubUsernameModalProps {
  visible: boolean;
  userId?: string | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function SetGithubUsernameModal({
  visible,
  userId,
  onClose,
  onSaved,
}: SetGithubUsernameModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const save = async (values: { githubUsername: string }) => {
    if (!userId) {
      notification.error({ message: 'User ID is missing.' });
      return;
    }

    setLoading(true);

    try {
      await api.patch(`/users/interns/${userId}`, {
        github_username: values.githubUsername,
      });
      notification.success({ message: 'GitHub username saved successfully!' });
      onSaved?.();
      onClose();
    } catch (err: any) {
      notification.error({
        message: 'Failed to save GitHub username',
        description: err.response?.data?.message || 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Set GitHub Username"
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      <Form
        form={form}
        onFinish={save}
        layout="vertical"
        initialValues={{ githubUsername: '' }}
      >
        <Form.Item
          name="githubUsername"
          label="GitHub Username"
          rules={[{ required: true, message: 'Enter GitHub username' }]}
        >
          <Input placeholder="e.g., mahasohail" />
        </Form.Item>
        <Form.Item>
          <Button htmlType="submit" type="primary" loading={loading}>
            Save
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
