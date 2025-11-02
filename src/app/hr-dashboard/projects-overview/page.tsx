'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout'; // Adjust path if needed
import { Typography, Table, Tag, Progress, Spin, notification, Empty, Input, Button } from 'antd';
import api from '../../../lib/api'; // Adjust path if needed
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const { Title, Text } = Typography;
const { Search } = Input;

// Define expected data structure from the backend
interface Project {
  id: string;
  title: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
  mentor?: { firstName: string; lastName: string }; // Made mentor optional
  interns?: { id: string; firstName: string; lastName: string }[]; // Made interns optional
  milestones?: Milestone[]; // Made milestones optional
}

interface Milestone {
  id: string;
  title: string;
  tasks?: Task[]; // Made tasks optional
}

interface Task {
  id: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
}

export default function HrProjectsOverviewPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
    const { status } = useSession();
  const fetchProjects = async () => {
    setLoading(true);

    try {
      const res = await api.get('api/projects');
      setProjects(res.data || []); // Ensure projects is always an array
      setFilteredProjects(res.data || []);
    } catch (error) {
      console.error("Fetch Projects Error:", error); // Log the actual error
      notification.error({
        message: 'Failed to load projects',
        description: 'Could not fetch project data. Please check logs or network connection.',
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
if (typeof window === 'undefined') {
    return (
        <MainLayout>
            <Spin size="large" tip="Initializing..." />
        </MainLayout>
    );
}

  // Filter projects based on search term
  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = projects.filter(proj =>
      (proj.title && proj.title.toLowerCase().includes(lowerSearchTerm)) || // Check if title exists
      (proj.mentor && `${proj.mentor.firstName} ${proj.mentor.lastName}`.toLowerCase().includes(lowerSearchTerm))
    );
    setFilteredProjects(filtered);
  }, [searchTerm, projects]);


  // Helper to calculate project task progress with safety checks
  const calculateProgress = (project: Project) => {
    let totalTasks = 0;
    let doneTasks = 0;
    // --- Safety Check ---
    if (project.milestones && Array.isArray(project.milestones)) {
project.milestones.forEach(milestone => {
 // If tasks are not loaded (backend fixed), this prevents crash
if (milestone.tasks && Array.isArray(milestone.tasks)) {
 milestone.tasks.forEach(task => {
 totalTasks++;
 if (task?.status === 'Done') {
 doneTasks++;
 }
 }); }
 });
 } else {
      // Return 0 if milestones are not loaded (expected behavior after the backend fix)
      return { percent: 0, done: 0, total: 0 };
    }
    // --------------------
    const percent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    return { percent, done: doneTasks, total: totalTasks };
  };

  // Define table columns
  const columns: any[] = [ // Use any[] type for columns temporarily for debugging if needed
    {
      title: 'Project Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: Project, b: Project) => (a.title || '').localeCompare(b.title || ''), // Add safety check
      render: (text: string, record: Project) => record.id ? <Link href={`/hr-dashboard/projects/${record.id}`}>{text || 'No Title'}</Link> : text || 'No Title', // Add safety check
    },
    {
      title: 'Mentor',
      dataIndex: 'mentor',
      key: 'mentor',
      render: (mentor: Project['mentor']) => mentor ? `${mentor.firstName} ${mentor.lastName}`: 'N/A',
      sorter: (a: Project, b: Project) => {
        const nameA = a.mentor ? `${a.mentor.firstName} ${a.mentor.lastName}` : '';
        const nameB = b.mentor ? `${b.mentor.firstName} ${b.mentor.lastName}` : '';
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: 'Interns Assigned',
      dataIndex: 'interns',
      key: 'interns',
      render: (interns: Project['interns']) => interns?.length || 0,
      align: 'center' as const,
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        filters: [
            { text: 'Planning', value: 'Planning' },
            { text: 'In Progress', value: 'In Progress' },
            { text: 'Completed', value: 'Completed' },
            { text: 'On Hold', value: 'On Hold' },
        ],
        onFilter: (value: string | number | boolean, record: Project) => record.status === value,
        render: (status: string) => {
            let color = 'default';
            if (status === 'In Progress') color = 'processing';
            else if (status === 'Completed') color = 'success';
            else if (status === 'On Hold') color = 'warning';
            return <Tag color={color}>{status || 'N/A'}</Tag>; // Add safety check
        },
    },
    {
      title: 'Task Progress',
      key: 'progress',
      render: (_: any, record: Project) => {
        // calculateProgress now has safety checks
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
      render: (_: any, record: Project) => record.id ? ( // Add safety check for record.id
<Link href={`/hr-dashboard/projects-overview/${record.id}`}>
          <Button size="small">View Details</Button>
        </Link>
      ) : null, // Render nothing if no ID
    },
  ];

  return (
    <MainLayout>
      <Title level={2}>Projects Overview</Title>
      <Text>View the status and progress of all ongoing internship projects.</Text>

       <Search
        placeholder="Search by project title or mentor name..."
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
          columns={columns} // This prop is correct
          dataSource={filteredProjects}
          rowKey="id"
          locale={{ emptyText: <Empty description={searchTerm ? "No projects match your search." : "No projects found."} /> }}
          pagination={{ pageSize: 10 }}
        />
      )}
    </MainLayout>
  );
}

