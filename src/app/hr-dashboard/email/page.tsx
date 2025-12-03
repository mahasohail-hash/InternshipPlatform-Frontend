"use client";

import { useState, useEffect } from "react";
import { getSession, signIn } from "next-auth/react";
import { Select, Input, Button, message, Typography, Space } from "antd";
import dynamic from "next/dynamic";

const { TextArea } = Input;
const { Title } = Typography;

// Load React Quill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface UserOption {
  value: string; // email
  label: string; // name
}

export default function HREmailPage() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [role, setRole] = useState<"HR" | "MENTOR" | "INTERN">("INTERN");
  const [subject, setSubject] = useState("");
  const [messageContent, setMessageContent] = useState("");

  // Fetch users for dropdown (optional, or backend API)
  useEffect(() => {
    async function fetchUsers() {
      const session = await getSession();
      if (!session?.accessToken) return;

      const res = await fetch(`/api/users?role=${role}`, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();
      setUsers(data.map((u: any) => ({ value: u.email, label: u.name })));
    }
    fetchUsers();
  }, [role]);

  const handleSend = async () => {
    const session = await getSession();
    if (!session?.accessToken) {
      signIn();
      return;
    }

    if (!subject || !messageContent || (!selectedUsers.length && !role)) {
      message.error("Please fill all fields and select users or role.");
      return;
    }

    const payload = selectedUsers.length
      ? { to: selectedUsers, subject, html: messageContent }
      : { role, subject, html: messageContent };

    const endpoint = selectedUsers.length ? "/api/email/send" : "/api/email/send-bulk";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        message.success(selectedUsers.length ? "Emails sent!" : "Bulk emails sent!");
        setSubject("");
        setMessageContent("");
        setSelectedUsers([]);
      } else {
        const data = await res.json();
        message.error(`Failed: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      message.error(`Error: ${err}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Title level={2}>HR Email Dashboard</Title>

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Select
          mode="multiple"
          placeholder="Select users (leave empty to send by role)"
          options={users}
          value={selectedUsers}
          onChange={setSelectedUsers}
          style={{ width: "100%" }}
        />

        {!selectedUsers.length && (
          <Select
            value={role}
            onChange={(val) => setRole(val)}
            style={{ width: "200px" }}
            options={[
              { value: "INTERN", label: "Intern" },
              { value: "MENTOR", label: "Mentor" },
              { value: "HR", label: "HR" },
            ]}
          />
        )}

        <Input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <ReactQuill
          theme="snow"
          value={messageContent}
          onChange={setMessageContent}
          style={{ height: "200px" }}
        />

        <Button type="primary" onClick={handleSend}>
          Send Email
        </Button>
      </Space>
    </div>
  );
}
