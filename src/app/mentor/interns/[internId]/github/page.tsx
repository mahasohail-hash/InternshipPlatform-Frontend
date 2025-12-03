"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Spin, notification, Alert, Typography, Row, Col, Empty, Space } from 'antd';
import { GithubOutlined, SyncOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../../../../../lib/api';

const { Title, Text } = Typography;

interface GitHubMetric {
  id: string;
  github_username: string;
  repoName: string;
  commits: number;
  additions: number;
  deletions: number;
  fetchDate: string;
}

interface InternGithubStatus {
  hasGithubUsername: boolean;
  githubUsername?: string;
  verified: boolean;
}

export default function InternGithubPage() {
  const params = useParams();
  const router = useRouter();
  const { internId } = params;
  const [githubData, setGithubData] = useState<GitHubMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [githubStatus, setGithubStatus] = useState<InternGithubStatus | null>(null);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    if (!internId) {
      setError('Intern ID missing in URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check GitHub status
      const statusRes = await api.get<InternGithubStatus>(`/users/interns/${internId}/github-status`);
      setGithubStatus(statusRes.data);

      if (!statusRes.data.hasGithubUsername) {
        setError('GitHub username not set for this intern.');
        setLoading(false);
        return;
      }

      if (!statusRes.data.verified) {
        setError(`GitHub username "${statusRes.data.githubUsername}" is not valid or doesn't exist.`);
        setLoading(false);
        return;
      }

      // Fetch existing metrics
      const metricsRes = await api.get<GitHubMetric[]>(`/github/intern/${internId}/metrics`);

      if (metricsRes.data.length === 0) {
        // If no metrics, fetch fresh data
        try {
          await api.post(`/github/intern/fetch/${internId}`);
          const freshMetricsRes = await api.get<GitHubMetric[]>(`/github/intern/${internId}/metrics`);
          setGithubData(freshMetricsRes.data);
        } catch (err: any) {
          console.error('Error fetching GitHub data:', err);
          setError(err?.response?.data?.message || 'Failed to fetch GitHub data. Please check the GitHub username and try again.');
        }
      } else {
        setGithubData(metricsRes.data);
      }
    } catch (err: any) {
      console.error('Fetch Error:', err);
      setError(err?.response?.data?.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, [internId]);

  // --- Data Refresh ---
  const handleRefreshData = useCallback(async () => {
    if (!internId) return;

    setLoading(true);
    try {
      await api.post(`/github/intern/fetch/${internId}`);
      const res = await api.get<GitHubMetric[]>(`/github/intern/${internId}/metrics`);
      setGithubData(res.data);
      notification.success({
        message: 'GitHub data refreshed successfully!',
        description: 'The latest GitHub contributions have been fetched.'
      });
    } catch (err: any) {
      notification.error({
        message: 'Failed to refresh GitHub data',
        description: err?.response?.data?.message || 'Check intern\'s GitHub username and backend token validity.'
      });
    } finally {
      setLoading(false);
    }
  }, [internId]);

  // --- Effects ---
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Render Helpers ---
  const renderErrorState = () => {
    if (!githubStatus) return null;

    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message="Failed to load data" description={error} showIcon />

        {!githubStatus.hasGithubUsername && (
          <Button
            type="primary"
            style={{ marginTop: 16 }}
            onClick={() => router.push(`/mentor/interns/${internId}/edit`)}
            icon={<GithubOutlined />}
          >
            Set GitHub Username
          </Button>
        )}

        {githubStatus.hasGithubUsername && !githubStatus.verified && (
          <Space direction="vertical" style={{ marginTop: 16, width: '100%' }}>
            <Alert
              type="warning"
              message="GitHub Username Verification Failed"
              description={`The GitHub username "${githubStatus.githubUsername}" is not valid or doesn't exist.`}
              showIcon
              icon={<ExclamationCircleOutlined />}
            />
            <Button
              type="primary"
              onClick={() => router.push(`/mentor/interns/${internId}/edit`)}
              icon={<GithubOutlined />}
            >
              Update GitHub Username
            </Button>
          </Space>
        )}

        {githubStatus.hasGithubUsername && githubStatus.verified && error?.includes('Failed to fetch GitHub data') && (
          <Space direction="vertical" style={{ marginTop: 16, width: '100%' }}>
            <Alert
              type="warning"
              message="GitHub Data Fetch Failed"
              description="We couldn't fetch GitHub data. This could be due to API rate limits or other issues."
              showIcon
              icon={<ExclamationCircleOutlined />}
            />
            <Button
              type="primary"
              onClick={handleRefreshData}
              icon={<SyncOutlined />}
              loading={loading}
            >
              Try Again
            </Button>
          </Space>
        )}
      </div>
    );
  };

  const renderEmptyState = () => {
    if (!githubStatus) return null;

    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="info"
          message="No GitHub data available"
          description={
            <div>
              <p>No GitHub contributions found for username: <strong>{githubStatus.githubUsername}</strong></p>
              <p>This could be because:</p>
              <ul>
                <li>The username might not have any recent activity</li>
                <li>GitHub API might be experiencing issues</li>
              </ul>
              <p>Try refreshing the data.</p>
            </div>
          }
          showIcon
        />
        <Button
          type="primary"
          style={{ marginTop: 16 }}
          onClick={handleRefreshData}
          icon={<SyncOutlined />}
          loading={loading}
        >
          Refresh GitHub Data
        </Button>
      </div>
    );
  };

  // --- Loading State ---
  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <Spin size="large" tip="Loading GitHub data..." />
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return renderErrorState();
  }

  // --- Empty State ---
  if (githubData.length === 0 && githubStatus?.hasGithubUsername && githubStatus?.verified) {
    return renderEmptyState();
  }

  // --- Loading Fallback ---
  if (githubData.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  // --- Main Content ---
  const internGithubUsername = githubData[0]?.github_username || 'N/A';
  const totalCommits = githubData.reduce((sum, repo) => sum + repo.commits, 0);
  const totalAdditions = githubData.reduce((sum, repo) => sum + repo.additions, 0);
  const totalDeletions = githubData.reduce((sum, repo) => sum + repo.deletions, 0);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <Space>
          <GithubOutlined />
          GitHub Contributions for {internGithubUsername}
        </Space>
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>Total Commits:</Text> {totalCommits}
          </Col>
          <Col span={8}>
            <Text strong>Total Additions:</Text> {totalAdditions}
          </Col>
          <Col span={8}>
            <Text strong>Total Deletions:</Text> {totalDeletions}
          </Col>
        </Row>

        <Button
          type="primary"
          style={{ marginTop: 16 }}
          onClick={handleRefreshData}
          loading={loading}
          icon={<SyncOutlined />}
        >
          Refresh GitHub Data
        </Button>
      </Card>

      <Title level={3}>Repository Contributions</Title>

      {githubData.length > 0 ? (
        <Row gutter={[16, 16]}>
          {githubData.map((repo) => (
            <Col xs={24} sm={12} md={8} key={repo.id}>
              <Card
                title={repo.repoName}
                style={{ marginBottom: 16, cursor: 'pointer' }}
                hoverable
                onClick={() => router.push(`/mentor/interns/${internId}/github/${repo.repoName}`)}
              >
                <Text strong>Commits:</Text> {repo.commits}<br />
                <Text strong>Additions/Deletions:</Text> +{repo.additions} / -{repo.deletions}<br />
                <Text strong>Last Fetched:</Text> {new Date(repo.fetchDate).toLocaleDateString()}
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="No repository data available" />
      )}
    </div>
  );
}
