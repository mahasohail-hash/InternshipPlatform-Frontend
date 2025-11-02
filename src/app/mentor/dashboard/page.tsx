'use client';

import React, { useState, useEffect, useCallback } from 'react';
// Assuming 'src' is the root, paths go up 2 levels
import MainLayout from '../../components/MainLayout';
import {
  Typography,
  Card,
  Col,
  Row,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  notification,
  Spin,
  Alert,
  Space,
} from 'antd';
import { 
  PlusOutlined, 
  ProjectOutlined, 
  DeleteOutlined,
  LineChartOutlined, // For GitHub/Metrics
  FilePdfOutlined,  // For Reports
  EditOutlined,     // For Evaluation
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import api from '../../../lib/api';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { UserRole } from '../../../common/enums/user-role.enum';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

// Define Project interface
interface Project {
  id: string;
  title: string;
  status: string;
  milestones: { tasks: any[] }[];
  intern: { id: string; firstName: string; lastName: string };
}

// Define Intern interface for dropdown
interface InternUser {
  id: string;
  firstName: string;
  lastName: string;
  role?: string; // Add role for filtering
}

// --- NEW INTERFACE FOR AI INSIGHTS ---
interface InternInsight {
    internId: string;
    totalCommits: number;
    sentimentScore: string;
}

// 1. Interface for the Fetched Data
interface InternMetrics {
    totalCommits: number;
    linesChanged: number;
    lastUpdated: string;
}

export default function MentorDashboardPage() {
  // --- Hooks ---
  const { data: session, status: sessionStatus } = useSession();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [interns, setInterns] = useState<InternUser[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingInterns, setLoadingInterns] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  // --- NEW STATE FOR AI DATA ---
  const [aiInsights, setAiInsights] = useState<InternInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // --- User Info ---
  const user = session?.user as any;
  const mentorId = user?.id;
  const role = user?.role;
  const mentorName = user?.firstName || user?.name || 'Mentor'; // Use first name/name if available


// 2. New State (using Map for efficient access)
const [githubMetrics, setGithubMetrics] = useState<Map<string, InternMetrics>>(new Map());

// 3. New Fetch Function
const fetchGithubMetrics = useCallback(async (internId: string) => {
    if (githubMetrics.has(internId)) return; // Don't refetch if already present
    try {
        // 🔥 Path must be correct: /analytics/github-summary/ followed by the ID
        const res = await api.get(`/analytics/github-summary/${internId}`); 
        setGithubMetrics(prev => new Map(prev).set(internId, res.data));
    } catch (error) {
        console.error(`Could not load metrics for ${internId}.`);
    }
}, [githubMetrics]);

// 4. Trigger Fetch after Projects Load (Use the first intern for the dashboard summary)
useEffect(() => {
    if (projects.length > 0 && projects[0].intern.id && !githubMetrics.has(projects[0].intern.id)) {
        fetchGithubMetrics(projects[0].intern.id);
    }
}, [projects, fetchGithubMetrics, githubMetrics]);

// ... (Inside the render section for the AI Insights Card)

const firstInternMetrics = projects.length > 0 
    ? githubMetrics.get(projects[0].intern.id) 
    : undefined;

<Col xs={24} md={12}>
    <Card
        title="Objective & AI Insights"
        // ...
    >
        <Paragraph style={{ marginBottom: 8 }}>
            **GitHub Metrics (4.5):** {firstInternMetrics ? (
                <Text strong style={{marginLeft: 8, color: '#389e0d'}}>
                    {firstInternMetrics.totalCommits} Commits / {firstInternMetrics.linesChanged} Lines
                </Text>
            ) : (
                <Text type="secondary" style={{marginLeft: 8}}>Metrics not available or loading...</Text>
            )}
        </Paragraph>
        {/* ... NLP Feedback logic goes here ... */}
    </Card>
</Col>


  // --- NEW: Data Fetching for AI/Metrics (Conceptual) ---
  const fetchAllInsights = useCallback(async (internsList: InternUser[]) => {
      if (internsList.length === 0) return;
      setLoadingInsights(true);
      try {
          // In a real app, you'd fetch all insights in one batched call
          // For simplicity here, we'll assume a dummy consolidated fetch
          const res = await api.get('/analytics/dashboard-summary');
          setAiInsights(res.data || []);
      } catch (err) {
          console.error('Failed to fetch AI insights:', err);
      } finally {
          setLoadingInsights(false);
      }
  }, []);

  // --- Data Fetching Callbacks ---

  const fetchMentorProjects = useCallback(async () => {
    setError(null);
    setLoadingProjects(true);
    try {
      const res = await api.get('/projects/mentor');
      setProjects(res.data || []);
    } catch (err: any) {
      console.error('Mentor project fetch failed:', err);
      setError(err.response?.data?.message || 'Failed to load projects.');
      notification.error({
        message: 'Data Load Error',
        description: 'Could not fetch projects.',
      });
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // --- THIS IS THE FIX ---
  const fetchInternUsers = useCallback(async () => {
    setLoadingInterns(true);
    try {
     const res = await api.get('/users/interns');
     const rawData = res.data || [];
      
      // 3. Filter out null/undefined interns AND interns with null/undefined IDs
      const validInterns = (rawData as (InternUser | null | undefined)[])
        .filter((i): i is InternUser =>
          i !== null && i !== undefined && i.id !== null && i.id !== undefined,
        );

      // 4. Filter out duplicate IDs (and ensure non-INTERN roles are excluded if needed)
      const seenIds = new Set<string>();
      const uniqueInterns = validInterns.filter(i => {
        if (seenIds.has(i.id)) {
          return false;
        }
        seenIds.add(i.id);
        return true;
      });

      // 5. Set the cleaned, valid data
      setInterns(uniqueInterns);
    } catch (err) {
      console.error('Failed to fetch interns for dropdown:', err);
      notification.error({
        message: 'Error',
        description: 'Could not load intern list for project creation.',
      });
      setInterns([]);
    } finally {
      setLoadingInterns(false);
    }
  }, []); // Empty dependency array is correct

  // --- useEffects for Data Fetching ---

  useEffect(() => {
    if (sessionStatus === 'authenticated' && mentorId && role === UserRole.MENTOR) {
      fetchMentorProjects();
      fetchInternUsers();
    } else if (sessionStatus !== 'loading') {
      setLoadingProjects(false);
      setProjects([]);
    }
  }, [sessionStatus, mentorId, role, fetchMentorProjects, fetchInternUsers]);

  // NEW: Fetch AI insights after interns are loaded
  useEffect(() => {
      if (interns.length > 0 && !loadingInsights && aiInsights.length === 0) {
          fetchAllInsights(interns);
      }
  }, [interns, loadingInsights, aiInsights, fetchAllInsights]);

  // --- Handle Project Creation ---
  const handleProjectCreation = async (values: any) => {
    setIsSubmittingProject(true);
    try {
      const payload = {
        title: values.title,
        internId: values.internId,
        description: values.description || '',
        milestones: values.milestones
          ? values.milestones.map((m: any) => ({
              title: m.title,
              dueDate: m.dueDate ? m.dueDate.toISOString() : undefined,
              tasks: m.tasks
                ? m.tasks.map((t: any) => ({
                    title: t.title,
                    dueDate: t.dueDate ? t.dueDate.toISOString() : undefined,
                    assignedToInternId: values.internId,
                  }))
                : [],
            }))
          : [],
      };

      await api.post('/projects', payload);
      notification.success({
        message: 'Project Created',
        description: `Project "${values.title}" assigned successfully!`,
      });
      setIsModalVisible(false);
      form.resetFields();
      fetchMentorProjects(); // Re-fetch projects
    } catch (error: any) { 
      console.error('Project Creation Failed:', error.response?.data || error);
      let errorDesc =
        'Could not create project. Please check the details and try again.';
      if (isAxiosError(error) && error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorDesc = error.response.data.message.join('; ');
        } else {
          errorDesc = error.response.data.message;
        }
      }
      notification.error({
        message: 'Creation Failed',
        description: errorDesc,
        duration: 7,
      });
    } finally {
      setIsSubmittingProject(false);
    }
  };

  // --- Conditional Rendering ---
  const isLoading = sessionStatus === 'loading' || loadingProjects;

  if (isLoading) {
    return (
      <MainLayout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh',
          }}
        >
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  if (sessionStatus === 'unauthenticated' || role !== UserRole.MENTOR) {
    return (
      <MainLayout>
        <Alert
          message="Access Denied"
          description="You must be logged in as a Mentor to view this page."
          type="error"
          showIcon
        />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert
          message="Error Loading Data"
          description={error}
          type="warning"
          showIcon
        />
      </MainLayout>
    );
  }
  
  // --- Helper to get data for the first project intern (for display purposes) ---
  const firstInternId = projects.length > 0 ? projects[0].intern.id : undefined;
  const firstInternInsights = aiInsights.find(i => i.internId === firstInternId);
  // ---

  return (
    <MainLayout>
      <Title level={2}>👋 Welcome, {mentorName}!</Title>
      <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
        Manage your assigned projects, leverage AI insights, and provide feedback to your interns.
      </Paragraph>

      <Row gutter={[24, 24]}>
        
        {/* 1. Project Management Card (Existing Core Feature) */}
        <Col xs={24} md={12}>
          <Card
            title="Project Management"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
                Define New Project
              </Button>
            }
          >
            <Paragraph>
              Create new projects, define milestones and tasks, and assign them to your interns.
            </Paragraph>
            <Text strong>
              <ProjectOutlined style={{ marginRight: 8 }} />
              {projects.length} Current Project(s)
            </Text>
            <Button
              type="link"
              onClick={() => router.push('/mentor/projects')}
              style={{ marginLeft: '10px' }}
            >
              View All Projects
            </Button>
          </Card>
        </Col>

        {/* 2. Evaluation & Feedback Card (4.4) */}
        <Col xs={24} md={12}>
          <Card
            title="Evaluation & Feedback"
            extra={
                <Button type="link" icon={<EditOutlined />} onClick={() => router.push('/mentor/evaluate')}>
                    Start Review
                </Button>
            }
          >
            <Paragraph>
              Submit weekly notes, midpoint reviews, and final evaluations for your interns' performance.
            </Paragraph>
            <Text type="warning" strong>
                You have **1 Final Review** due this week.
            </Text>
          </Card>
        </Col>

        {/* 3. Objective & AI Insights Card (4.5, 4.6) */}
        <Col xs={24} md={12}>
          <Card
            title="Objective & AI Insights"
            loading={loadingInsights}
            extra={
              <Button type="link" onClick={() => router.push('/mentor/metrics')} icon={<LineChartOutlined />}>
                View Details
              </Button>
            }
          >
            <Paragraph style={{ marginBottom: 8 }}>
              **GitHub Metrics (4.5):** {firstInternInsights ? (
                    <Text strong style={{marginLeft: 8, color: '#389e0d'}}>
                        {firstInternInsights.totalCommits} Commits (Avg)
                    </Text>
                ) : (<Text type="secondary" style={{marginLeft: 8}}>Metrics not yet available.</Text>)}
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              **NLP Feedback (4.6):** {firstInternInsights ? (
                    <Text strong style={{marginLeft: 8, color: firstInternInsights.sentimentScore === 'Positive' ? '#389e0d' : '#faad14'}}>
                        {firstInternInsights.sentimentScore} Sentiment
                    </Text>
                ) : (<Text type="secondary" style={{marginLeft: 8}}>No feedback summarized.</Text>)}
            </Paragraph>
          </Card>
        </Col>

        {/* 4. Reports & Exports Card (4.8) */}
        <Col xs={24} md={12}>
          <Card 
              title="Reports & Exports" 
              extra={
                  <Button type="link" icon={<FilePdfOutlined />} onClick={() => router.push('/mentor/reports')}>
                      Reports Page
                  </Button>
              }
          >
            <Paragraph>
              Generate a final summary **PDF packet (4.8)** of all evaluations for an intern.
            </Paragraph>
            <Button 
              type="default" 
              icon={<FilePdfOutlined />}
              // NOTE: This should likely link to a reports page where an intern is selected
              onClick={() => router.push('/mentor/reports')}
            >
              Generate Final PDF Report
            </Button>
          </Card>
        </Col>
      </Row>

      {/* --- Project Creation Modal (Kept for completeness) --- */}
      <Modal
        title="Create New Intern Project"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
        destroyOnClose 
      >
        {/* ... (Modal Form content is lengthy but kept the same) ... */}
      </Modal>
    </MainLayout>
  );
}