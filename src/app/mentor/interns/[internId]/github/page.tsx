'use client';
import MainLayout from '../../../../components/MainLayout';
import { Typography, Card, Spin, Alert, List, Tag, notification } from 'antd';
import { GithubOutlined, PlusOutlined, MinusOutlined, CalendarOutlined, GitlabOutlined } from '@ant-design/icons';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '../../../../../lib/api';
import { AxiosError } from 'axios';

const { Title, Text } = Typography;

interface GitHubMetric {
  id: string;
  githubUsername: string;
  repoName: string;
  commits: number;
  additions: number;
  deletions: number;
  fetchDate: string;
}

export default function InternGithubPage() {
  const params = useParams();
  const rawInternId = params.internId;
  const internId = Array.isArray(rawInternId) ? rawInternId[0] : rawInternId; // Ensure single string ID

  const [githubData, setGithubData] = useState<GitHubMetric[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!internId) { setError('Intern ID not provided.'); setLoading(false); return; }
    if (typeof internId !== 'string' || internId.length < 36) { // Basic UUID check
      setLoading(false);
      setError("Error: Invalid intern ID format.");
      return;
    }

    const fetchGithubData = async () => {
      try {
        setLoading(true); setError(null);
        // CRITICAL FIX: Correct API endpoint
        const response = await api.get<GitHubMetric[]>(`/analytics/github/${internId}`);
        setGithubData(response.data);
        if (response.data.length > 0) { notification.success({ message: `Loaded ${response.data.length} repo contributions.` }); }
      } catch (err: any) {
        let errorMessage = 'Failed to fetch GitHub data.';
        if (err instanceof AxiosError && err.response) {
            errorMessage = err.response.data?.message || err.response.data?.error || 'Ensure GitHub Token is valid and username configured.';
        } else if (err instanceof Error) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        console.error('GitHub Fetch Error:', err);
        notification.error({ message: 'GitHub Data Error', description: errorMessage });
      } finally { setLoading(false); }
    };
    fetchGithubData();
  }, [internId]);

  if (loading) return <MainLayout><Spin size="large" tip="Loading GitHub Contributions..." /></MainLayout>;
  if (error) return <MainLayout><Alert message="Error" description={error} type="error" showIcon /></MainLayout>;
  if (!githubData || githubData.length === 0) return (
    <MainLayout><Alert message="No GitHub Data Found" description="No contributions could be retrieved for this intern. Ensure their GitHub username is set and the GitHub token is configured in the backend." type="info" showIcon /></MainLayout>
  );

  const internGithubUsername = githubData[0]?.githubUsername || 'N/A';

  return (
    <MainLayout>
      <Title level={2}><GithubOutlined /> GitHub Contribution Overview for {internGithubUsername}</Title>
      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 3 }} dataSource={githubData}
        renderItem={item => (
          <List.Item>
            <Card title={<Text strong><GitlabOutlined /> {item.repoName}</Text>} style={{ marginBottom: 16 }}>
              <p><Text strong>Commits:</Text> <Tag color="blue">{item.commits}</Tag></p>
              <p><Text strong>Additions:</Text> <Tag color="green"><PlusOutlined /> {item.additions}</Tag></p>
              <p><Text strong>Deletions:</Text> <Tag color="red"><MinusOutlined /> {item.deletions}</Tag></p>
              <p><Text type="secondary"><CalendarOutlined /> Last Fetched: {new Date(item.fetchDate).toLocaleDateString()}</Text></p>
            </Card>
          </List.Item>
        )}
      />
    </MainLayout>
  );
}