'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, message, Typography, Spin } from 'antd';

const { Title } = Typography;

// This is a placeholder for your project data structure
interface ProjectData {
  title: string;
  description: string;
  internId: string; // The form will be populated with this
  milestones: any[]; 
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  
  // 'id' here is the projectId from the URL (e.g., "abc-123")
  const id = params.id as string; 

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch project data using the projectId
  useEffect(() => {
    if (id) {
      const fetchProject = async () => {
        try {
          setLoading(true);
          // We use the projectId to get the project
          const response = await fetch(`/api/projects/${id}`, {
            // headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch project data');
          }
          const data = await response.json();
          // data now contains the project, internId, and all other info
          setProject(data);
        } catch (error) {
          console.error(error);
          message.error('Could not load project data.');
        } finally {
          setLoading(false);
        }
      };
      fetchProject();
    }
  }, [id]); // Re-run if the 'id' (projectId) changes

  // 2. Handle the form submission
  const handleFormSubmit = async (values: ProjectData) => {
    try {
      // We use the projectId to know which project to update
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': 'Bearer YOUR_JWT_TOKEN'
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      message.success('Project updated successfully!');
      router.push('/mentor/dashboard');
    } catch (error) {
      console.error(error);
      message.error('An error occurred. Please try again.');
    }
  };

  if (loading) {
    return <Spin tip="Loading project..." fullscreen />;
  }

  if (!project) {
    return <Card><Title level={3}>Project not found.</Title></Card>;
  }

  return (
    <Card>
      <Title level={3}>Edit Project: {project.title}</Title>
      
      {/* You will build/use your ProjectForm component here.
        'project' has all the data you need, including the 'internId'.
      */}
      
      {/* <ProjectForm 
        initialValues={project} 
        onSubmit={handleFormSubmit} 
      /> */}
      
      <pre>{JSON.stringify(project, null, 2)}</pre>
      <p>Your edit form component will go here.</p>
      <p>The **internId** is: **{project.internId}**</p>
    </Card>
  );
}