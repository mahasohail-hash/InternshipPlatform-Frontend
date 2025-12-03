"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import MainLayout from "@/app/components/MainLayout";
import api from "@/lib/api";
import {
  Spin,
  Card,
  Typography,
  Row,
  Col,
  Alert,
  List,
  Button,
  Space,
  Skeleton,
  Tag,
  Progress,
  Statistic,
  Empty
} from "antd";
import {
  GithubOutlined,
  CodeOutlined,
  ForkOutlined,
  IeOutlined,
  SyncOutlined,
  PlusOutlined,
  MinusOutlined
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;

interface RepoData {
  name: string;
  html_url: string;
  description?: string;
  commits?: number;
  additions?: number;
  deletions?: number;
  openIssues?: number;
  stars?: number;
  forks?: number;
}

interface GithubSummary {
  totalCommits?: number;
  totalAdditions?: number;
  totalDeletions?: number;
  repos?: RepoData[];
}

export default function InternGithubPage() {
  const { internId } = useParams();
  const [data, setData] = useState<GithubSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- Data Fetching ---
  const fetchGithubData = useCallback(async () => {
    if (!internId) return;

    try {
      setLoading(true);
      if (!refreshing) setRefreshing(true);

      const res = await api.get<GithubSummary>(`/intern/${internId}/github`);
      setData(res.data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch GitHub data", err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [internId]);

  // --- Effects ---
  useEffect(() => {
    fetchGithubData();
  }, [fetchGithubData]);

  // --- Loading State ---
  if (!internId) {
    return (
      <MainLayout>
        <Alert
          type="warning"
          message="Intern ID not found"
          description="Cannot load GitHub data without an intern ID."
          showIcon
          style={{ margin: 24 }}
        />
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <Row gutter={[24, 24]} style={{ padding: 24 }}>
          <Col xs={24} md={12}>
            <Card title="Summary" bordered>
              <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
          </Col>
          <Col xs={24}>
            <Card title="Repositories" bordered>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          </Col>
        </Row>
      </MainLayout>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <MainLayout>
        <Alert
          type="error"
          message="Error loading GitHub data"
          description={
            <Space direction="vertical">
              <Text>{error}</Text>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={fetchGithubData}
                loading={refreshing}
              >
                Retry
              </Button>
            </Space>
          }
          showIcon
          style={{ margin: 24 }}
        />
      </MainLayout>
    );
  }

  // --- Empty State ---
  if (!data || (!data.repos && !data.totalCommits)) {
    return (
      <MainLayout>
        <Card style={{ margin: 24 }}>
          <Title level={3}>
            <GithubOutlined /> No GitHub Data Found
          </Title>
          <Paragraph>
            This intern doesn't have any GitHub activity recorded in our system.
          </Paragraph>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={fetchGithubData}
            loading={refreshing}
          >
            Refresh Data
          </Button>
        </Card>
      </MainLayout>
    );
  }

  // --- Main Render ---
  return (
    <MainLayout>
      <div style={{ padding: 24 }}>
        <Title level={2}>
          <GithubOutlined /> GitHub Contributions
        </Title>

        <Row gutter={[24, 24]}>
          {/* Summary Card */}
          <Col xs={24} md={12}>
            <Card title="Summary" bordered>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Statistic
                  title="Total Commits"
                  value={data.totalCommits || 0}
                  prefix={<CodeOutlined />}
                />

                <Statistic
                  title="Lines Added"
                  value={data.totalAdditions || 0}
                  prefix={<PlusOutlined />}
                />

                <Statistic
                  title="Lines Removed"
                  value={data.totalDeletions || 0}
                  prefix={<MinusOutlined />}
                />

                <Button
                  type="primary"
                  icon={<SyncOutlined spin={refreshing} />}
                  onClick={fetchGithubData}
                  loading={refreshing}
                  block
                >
                  Refresh Data
                </Button>
              </Space>
            </Card>
          </Col>

          {/* Repositories Card */}
          <Col xs={24}>
            <Card
              title={
                <Space>
                  <GithubOutlined /> Repositories
                  <Tag color="blue">{data.repos?.length || 0}</Tag>
                </Space>
              }
              bordered
            >
              {data.repos && data.repos.length > 0 ? (
                <List
                  dataSource={data.repos}
                  renderItem={(repo) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<GithubOutlined />}
                        title={
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontWeight: 500 }}
                          >
                            {repo.name}
                          </a>
                        }
                        description={
                          <Space size="small" wrap>
                            {repo.description || <Text type="secondary">No description</Text>}
                            {repo.stars !== undefined && (
                              <Tag icon={<CodeOutlined />} color="geekblue">
                                {repo.stars} stars
                              </Tag>
                            )}
                            {repo.forks !== undefined && (
                              <Tag icon={<ForkOutlined />} color="purple">
                                {repo.forks} forks
                              </Tag>
                            )}
                          </Space>
                        }
                      />
                      <Space wrap>
                        {repo.commits !== undefined && (
                          <Tag icon={<CodeOutlined />} color="green">
                            {repo.commits} commits
                          </Tag>
                        )}
                        {repo.additions !== undefined && (
                          <Tag icon={<PlusOutlined />} color="cyan">
                            +{repo.additions}
                          </Tag>
                        )}
                        {repo.deletions !== undefined && (
                          <Tag icon={<MinusOutlined />} color="volcano">
                            -{repo.deletions}
                          </Tag>
                        )}
                        {repo.openIssues !== undefined && (
                          <Tag icon={<IeOutlined />} color="red">
                            {repo.openIssues} issues
                          </Tag>
                        )}
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="No repositories found" />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
