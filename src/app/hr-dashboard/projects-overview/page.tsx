'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout'; // Adjust path if needed
import { Typography, Table, Tag, Progress, Spin, notification, Empty, Input, Button, Space, Row, Col } from 'antd';
import api from '../../../lib/api'; // Adjust path if needed
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { isAxiosError } from 'axios';

const { Title, Text } = Typography;
const { Search } = Input;

// Define expected data structure from the backend (ProjectDetailsDto)
interface UserBasic {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

interface TaskBasic {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  assignee?: UserBasic | null;
  dueDate?: Date | string | null;
}

interface MilestoneBasic {
  id: string;
  title: string;
  tasks?: TaskBasic[]; // CRITICAL: Use TaskBasic for tasks
  createdAt: Date | string;
}

interface ProjectOverview { // Renamed to avoid conflict, closer to ProjectDetailsDto
  id: string;
  title: string;
  description?: string | null;
  status: string; // 'Planning' | 'In Progress' | 'Completed' | 'On Hold'
  mentor?: UserBasic | null;
  intern?: UserBasic | null; // The main assigned intern
  milestones?: MilestoneBasic[];
}

export default function HrProjectsOverviewPage() {
  const [projects, setProjects] = useState<ProjectOverview[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { status } = useSession();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects'); // CRITICAL FIX: Correct endpoint to fetch all projects for HR
      setProjects(res.data || []);
      setFilteredProjects(res.data || []);
    } catch (error) {
      console.error("Fetch Projects Error:", error);
      notification.error({
        message: 'Failed to load projects',
        description: isAxiosError(error) ? (error.response?.data?.message || error.message) : 'Could not fetch project data. Please check logs or network connection.',
      });
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
        fetchProjects();
    }
}, [status]);


  // Filter projects based on search term
  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = projects.filter(proj =>
      (proj.title && proj.title.toLowerCase().includes(lowerSearchTerm)) ||
      (proj.mentor && `${proj.mentor.firstName || ''} ${proj.mentor.lastName || ''}`.toLowerCase().includes(lowerSearchTerm)) ||
      (proj.intern && `${proj.intern.firstName || ''} ${proj.intern.lastName || ''}`.toLowerCase().includes(lowerSearchTerm))
    );
    setFilteredProjects(filtered);
  }, [searchTerm, projects]);


  // Helper to calculate project task progress with safety checks
  const calculateProgress = (project: ProjectOverview) => {
    let totalTasks = 0;
    let doneTasks = 0;
    if (project.milestones && Array.isArray(project.milestones)) {
      project.milestones.forEach(milestone => {
        if (milestone.tasks && Array.isArray(milestone.tasks)) {
          milestone.tasks.forEach(task => {
            totalTasks++;
            if (task?.status === 'Done') { // CRITICAL FIX: Check if task exists and has status
              doneTasks++;
            }
          });
        }
      });
    }
    const percent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    return { percent, done: doneTasks, total: totalTasks };
  };

  // Define table columns
  const columns: any[] = [
    {
      title: 'Project Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: ProjectOverview, b: ProjectOverview) => (a.title || '').localeCompare(b.title || ''),
      render: (text: string, record: ProjectOverview) => record.id ? <Link href={`/hr-dashboard/projects/${record.id}`}>{text || 'No Title'}</Link> : text || 'No Title', // CRITICAL FIX: Link to /hr-dashboard/projects/[id]
    },
    {
      title: 'Mentor',
      dataIndex: 'mentor',
      key: 'mentor',
      render: (mentor: ProjectOverview['mentor']) => mentor ? `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim() || mentor.email : 'N/A',
      sorter: (a: ProjectOverview, b: ProjectOverview) => {
        const nameA = a.mentor ? `${a.mentor.firstName || ''} ${a.mentor.lastName || ''}` : '';
        const nameB = b.mentor ? `${b.mentor.firstName || ''} ${b.mentor.lastName || ''}` : '';
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: 'Intern',
      dataIndex: 'intern',
      key: 'intern',
      render: (intern: ProjectOverview['intern']) => intern ? `${intern.firstName || ''} ${intern.lastName || ''}`.trim() || intern.email : 'N/A',
      sorter: (a: ProjectOverview, b: ProjectOverview) => {
        const nameA = a.intern ? `${a.intern.firstName || ''} ${a.intern.lastName || ''}` : '';
        const nameB = b.intern ? `${b.intern.firstName || ''} ${b.intern.lastName || ''}` : '';
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
          { text: 'Active', value: 'Active' },
          { text: 'In Progress', value: 'In Progress' }, // Assuming your backend returns this status
          { text: 'Completed', value: 'Completed' },
          { text: 'On Hold', value: 'On Hold' },
          { text: 'Planning', value: 'Planning' }, // Assuming this status is also possible
      ],
      onFilter: (value: string | number | boolean, record: ProjectOverview) => record.status === value,
      render: (status: string) => {
          let color = 'default';
          if (status === 'In Progress' || status === 'Active') color = 'processing';
          else if (status === 'Completed') color = 'success';
          else if (status === 'On Hold') color = 'warning';
          else if (status === 'Planning') color = 'blue';
          return <Tag color={color}>{status || 'N/A'}</Tag>;
      },
    },
    {
      title: 'Task Progress',
      key: 'progress',
      render: (_: any, record: ProjectOverview) => {
        const { percent, done, total } = calculateProgress(record);
        return (
          <div style={{minWidth: '100px'}}>
            <Progress percent={percent} size="small" status={percent === 100 ? 'success' : 'active'} />
            <Text type="secondary" style={{fontSize: '12px'}}>{done} / {total}</Text>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ProjectOverview) => record.id ? (
        <Link href={`/hr-dashboard/projects/${record.id}`}> {/* CRITICAL FIX: Link to /hr-dashboard/projects/[id] */}
          <Button size="small">View Details</Button>
        </Link>
      ) : null,
    },
  ];

  return (
    <MainLayout>
      <Title level={2}>Projects Overview</Title>
      <Text>View the status and progress of all ongoing internship projects.</Text>

       <Search
        placeholder="Search by project title, mentor name, or intern name..."
        allowClear
        enterButton="Search"
        size="large"
        onSearch={value => setSearchTerm(value)}
        onChange={e => setSearchTerm(e.target.value)}
        style={{ margin: '20px 0', maxWidth: '400px' }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}> <Spin size="large" /></div>
      ) : (
        <Table
          columns={columns}
          dataSource={filteredProjects}
          rowKey="id"
          locale={{ emptyText: <Empty description={searchTerm ? "No projects match your search." : "No projects found."} /> }}
          pagination={{ pageSize: 10 }}
        />
      )}
    </MainLayout>
  );
}