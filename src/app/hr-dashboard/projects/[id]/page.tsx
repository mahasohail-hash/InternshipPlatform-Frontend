"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import api from '../../../../lib/api';
import MainLayout from '../../../components/MainLayout';
import {
  Typography, Spin, Result, Card, Descriptions, notification, List, Tag, Space, Divider,
  Button, Avatar, Tooltip, Progress, Empty
} from 'antd';
import {
  ProjectOutlined, UserOutlined, MailOutlined, CalendarOutlined, CheckCircleOutlined,
  SyncOutlined, ExclamationCircleOutlined, ArrowLeftOutlined, WarningOutlined
} from '@ant-design/icons';
import { AxiosError } from 'axios';
import Link from 'next/link';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

// ===============================
// Status Mapping
// ===============================

const statusIconMap = {
  'done': <CheckCircleOutlined style={{ color: 'green' }} />,
  'in progress': <SyncOutlined spin style={{ color: '#1677ff' }} />,
  'blocked': <ExclamationCircleOutlined style={{ color: 'red' }} />,
  'to do': <CalendarOutlined />,
  'overdue': <WarningOutlined style={{ color: 'red' }} />
};

const statusColorMap = {
  'done': 'success',
  'in progress': 'processing',
  'blocked': 'error',
  'to do': 'default',
  'overdue': 'error'
};

const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  try {
    return dayjs(dateInput).format('MMM D, YYYY');
  } catch {
    return 'Invalid Date';
  }
};

const getFullName = (user) => {
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
};

const getStatusIcon = (status) => {
  const normalized = status.toLowerCase();
  return statusIconMap[normalized] || statusIconMap['to do'];
};

const getStatusColor = (status) => {
  const normalized = status.toLowerCase();
  return statusColorMap[normalized] || statusColorMap['to do'];
};

const getTaskStatus = (task) => {
  if (!task.dueDate) return task.status.toLowerCase();
  const overdue = dayjs().isAfter(dayjs(task.dueDate));
  return overdue && task.status.toLowerCase() !== 'done'
    ? 'overdue'
    : task.status.toLowerCase();
};

// ===============================
// MAIN COMPONENT
// ===============================

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!projectId || sessionStatus === 'loading') {
      setLoading(false);
      return;
    }

    if (typeof projectId !== 'string' || projectId.length < 36) {
      setLoading(false);
      setError("Error: Invalid project ID format.");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/projects/${projectId}`);
        setProject(res.data);
      } catch (err) {
        let message = "Could not load project details.";

        if (err instanceof AxiosError) {
          message =
            err.response?.status === 404
              ? "Project not found."
              : err.response?.status === 401 || err.response?.status === 403
              ? "You do not have permission to view this project."
              : err.response?.data?.message || err.message;
        }

        setError(message);
        notification.error({ message: 'Load Error', description: message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [projectId, sessionStatus]);

  // Progress calculation
  const calculateProjectProgress = () => {
    if (!project?.milestones) return { percent: 0, completed: 0, total: 0 };
    let total = 0, completed = 0;

    project.milestones.forEach(m =>
      m.tasks.forEach(t => {
        total++;
        if (t.status.toLowerCase() === 'done') completed++;
      })
    );
    return {
      percent: total ? Math.round((completed / total) * 100) : 0,
      completed,
      total
    };
  };

  if (loading) {
    return (
      <MainLayout>
        <div style={{
          height: '60vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Spin size="large" tip="Loading beautiful project page..." />
        </div>
      </MainLayout>
    );
  }

  if (error || !project) {
    return (
      <MainLayout>
        <Result
          status={error?.includes("not found") ? "404" : "error"}
          title={error || "Unable to load project"}
          extra={
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} type="primary">
              Go Back
            </Button>
          }
        />
      </MainLayout>
    );
  }

  const progress = calculateProjectProgress();

  // ===============================
  // SUCCESS UI — PREMIUM BEAUTIFUL DESIGN
  // ===============================

  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>

        {/* BACK BUTTON */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          type="text"
          style={{ marginTop: 5 }}
        >
          Back to Projects
        </Button>

        {/* HEADER */}
        <div
          style={{
            padding: 30,
            borderRadius: 16,
            background: "linear-gradient(135deg, #e0f3ff 0%, #f9fbff 100%)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)"
          }}
        >
          <Title level={2} style={{ marginBottom: 0 }}>
            <ProjectOutlined /> {project.title}
          </Title>

          {project.description && (
            <Paragraph type="secondary" style={{ marginTop: 8 }}>
              {project.description}
            </Paragraph>
          )}
        </div>

        {/* PROGRESS */}
        <Card
          style={{
            borderRadius: 16,
            border: "1px solid #dbe7ff",
            background: "white",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}
        >
          <Text strong style={{ fontSize: 16 }}>Overall Progress</Text>
          <Tooltip title={`${progress.completed} of ${progress.total} tasks`}>
            <Progress
              percent={progress.percent}
              status={
                progress.percent === 100
                  ? "success"
                  : progress.percent < 40
                  ? "exception"
                  : "active"
              }
              strokeColor={
                progress.percent === 100
                  ? "#52c41a"
                  : progress.percent < 40
                  ? "#ff4d4f"
                  : "#1677ff"
              }
              style={{ marginTop: 12 }}
            />
          </Tooltip>
          <Text type="secondary">
            {progress.completed} / {progress.total} completed
          </Text>
        </Card>

        {/* DETAILS */}
        <Card
          bordered={false}
          style={{
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }}
        >
          <Descriptions title="Assignment Details" size="middle" column={2}>

            <Descriptions.Item label="Project Status">
              <Tag color={getStatusColor(project.status)}>
                {project.status}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Mentor">
              {project.mentor ? (
                <Link href={`/hr-dashboard/manage-users/${project.mentor.id}`}>
                  <Space>
                    <Avatar style={{ background: "#1677ff" }}>
                      {project.mentor.firstName?.[0]}{project.mentor.lastName?.[0]}
                    </Avatar>
                    <Text>{getFullName(project.mentor)}</Text>
                  </Space>
                </Link>
              ) : (
                <Text type="secondary">Not Assigned</Text>
              )}
            </Descriptions.Item>

            {project.interns?.length > 0 && (
              <Descriptions.Item label="Intern(s)">
                <Avatar.Group maxCount={4}>
                  {project.interns.map(i => (
                    <Tooltip title={getFullName(i)} key={i.id}>
                      <Link href={`/hr-dashboard/interns/${i.id}`}>
                        <Avatar style={{ background: "#52c41a" }}>
                          {i.firstName?.[0]}{i.lastName?.[0]}
                        </Avatar>
                      </Link>
                    </Tooltip>
                  ))}
                </Avatar.Group>
              </Descriptions.Item>
            )}

          </Descriptions>
        </Card>

        {/* MILESTONES */}
        <Title level={3}>Milestones & Tasks</Title>

        {project.milestones?.length ? (
          <List
            itemLayout="vertical"
            dataSource={project.milestones.sort(
              (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix()
            )}
            renderItem={(milestone) => (
              <List.Item>
                <Card
                  style={{
                    borderRadius: 16,
                    background: "#ffffff",
                    border: "1px solid #eef3ff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                  }}
                  title={
                    <Space>
                      <Text strong style={{ fontSize: 16 }}>{milestone.title}</Text>
                      <Text type="secondary">({milestone.tasks.length} tasks)</Text>
                    </Space>
                  }
                >
                  {milestone.tasks.length ? (
                    <List
                      size="small"
                      dataSource={milestone.tasks}
                      renderItem={(task) => {
                        const taskStatus = getTaskStatus(task);
                        const overdue = task.dueDate && dayjs().isAfter(dayjs(task.dueDate));
                        return (
                          <List.Item>
                            <List.Item.Meta
                              avatar={getStatusIcon(taskStatus)}
                              title={
                                <Space>
                                  <Text strong>{task.title}</Text>
                                  {overdue && (
                                    <Tooltip title="Task overdue">
                                      <WarningOutlined style={{ color: 'red' }} />
                                    </Tooltip>
                                  )}
                                </Space>
                              }
                              description={
                                <Space>
                                  {task.assignee && (
                                    <Tag icon={<UserOutlined />}>
                                      {getFullName(task.assignee)}
                                    </Tag>
                                  )}
                                  {task.dueDate && (
                                    <Text type={overdue ? "danger" : "secondary"}>
                                      Due: {formatDate(task.dueDate)}
                                    </Text>
                                  )}
                                </Space>
                              }
                            />
                            <Tag color={getStatusColor(taskStatus)}>
                              {taskStatus}
                            </Tag>
                          </List.Item>
                        );
                      }}
                    />
                  ) : (
                    <Empty description="No tasks available" />
                  )}
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Result status="info" title="No Milestones" subTitle="Add some to begin." />
        )}

      </Space>
    </MainLayout>
  );
}
