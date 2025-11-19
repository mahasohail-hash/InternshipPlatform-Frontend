"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, List, Typography, Spin, notification, Button } from "antd";
import { GithubOutlined, ArrowRightOutlined } from "@ant-design/icons";
import api from "@/lib/api";

const { Title, Text } = Typography;

interface RepoSummary {
  id: number; // GitHub repo ID can be a number
  name: string;
  fullName: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
}

export default function InternGithubReposPage() {
  const { internId } = useParams();
  const router = useRouter();

  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<RepoSummary[]>(`/github/intern/${internId}/repos`);
        setRepos(res.data);
      } catch (err: any) {
        notification.error({
          message: "Failed to load GitHub repositories",
          description: err?.response?.data?.message || err.message,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [internId]);

  if (loading) return <Spin size="large" className="m-8" />;
  if (!repos.length) return <p>No GitHub repos found for this intern. Ensure a GitHub username is linked.</p>;

  return (
    <div className="p-6 space-y-6">
      <Title level={2}>
        <GithubOutlined style={{ marginRight: 10 }} />
        GitHub Repositories
      </Title>

      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={repos}
        renderItem={(repo) => (
          <List.Item>
            <Card
              title={repo.name}
              extra={
                <Button
                  type="link"
                  icon={<ArrowRightOutlined />}
                  onClick={() =>
                    router.push(`/mentor/interns/${internId}/github/${repo.name}`)
                  }
                >
                  View Details
                </Button>
              }
            >
              ⭐ Stars: {repo.stars} <br />
              🍴 Forks: {repo.forks} <br />
              <a href={repo.url} target="_blank" rel="noopener noreferrer">
                🔗 Open on GitHub
              </a>
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
}