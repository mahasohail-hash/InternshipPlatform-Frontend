'use client';

import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../components/MainLayout'; // Adjust path if needed
import {
  Typography,
  Table,
  Tag,
  Spin,
  notification,
  Empty,
  Input,
  Button,
  Card,
  Form,
  Select,
  DatePicker,
  Space,
  Tooltip,
  Avatar,
  Row,
  Col
} from 'antd';
import type { TableProps } from 'antd';
import { UserOutlined, ClockCircleOutlined, StarFilled, FilterOutlined, ClearOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../../../lib/api'; // Adjust path if needed
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// --- Interfaces ---
interface UserRef {
  id: string;
  firstName: string;
  lastName: string;
}
interface Evaluation {
  id: string;
  score: number;
  feedbackText: string;
  type: 'Weekly Note' | 'Midpoint Review' | 'Final Review' | 'Self-Review'; // Updated types
  createdAt: string; // CRITICAL FIX: Changed from 'date' to 'createdAt' to match backend
  intern: UserRef;
  mentor?: UserRef; // Mentor can be optional for Self-Review
}
interface FilterValues {
  internName?: string;
  mentorName?: string;
  type?: Evaluation['type'][];
  dateRange?: [dayjs.Dayjs | null, dayjs.Dayjs | null];
}
// ---

export default function HrEvaluationsReportPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({});
  const [form] = Form.useForm();

  // --- Data Fetching ---
  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const urlToFetch = '/evaluations'; // CRITICAL FIX: Correct API endpoint (Controller is 'evaluations')
      console.log('Attempting to fetch from URL:', urlToFetch);
      const res = await api.get(urlToFetch);
      setEvaluations(res.data || []);
    } catch (error) {
      console.error("Fetch Evaluations Error:", error);
      notification.error({
        message: 'Failed to load evaluations',
        description: 'Could not fetch data. Please check network and backend logs.',
      });
      setEvaluations([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);
  // ---

  // --- Filtering Logic ---
  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(ev => {
      const internFullName = `${ev.intern?.firstName || ''} ${ev.intern?.lastName || ''}`.toLowerCase();
      const mentorFullName = `${ev.mentor?.firstName || ''} ${ev.mentor?.lastName || ''}`.toLowerCase(); // Check if mentor exists
      
      const lowerInternFilter = filters.internName?.toLowerCase() || '';
      const lowerMentorFilter = filters.mentorName?.toLowerCase() || '';
      const selectedTypes = filters.type || [];
      const [startDate, endDate] = filters.dateRange || [null, null];

      const evaluationDate = dayjs(ev.createdAt); // Use createdAt

      if (lowerInternFilter && !internFullName.includes(lowerInternFilter)) return false;
      if (lowerMentorFilter && !mentorFullName.includes(lowerMentorFilter)) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(ev.type)) return false;
      if (startDate && endDate && !evaluationDate.isBetween(startDate.startOf('day'), endDate.endOf('day'), null, '[]')) return false;

      return true;
    });
  }, [evaluations, filters]);

  const handleFilter = (values: FilterValues) => {
    setFilters(values);
  };

  const handleResetFilters = () => {
    form.resetFields();
    setFilters({});
  };
  // ---

  // --- Table Columns ---
  const columns: TableProps<Evaluation>['columns'] = [
    {
      title: 'Intern',
      key: 'intern',
      sorter: (a, b) => `${a.intern?.firstName || ''} ${a.intern?.lastName || ''}`.localeCompare(`${b.intern?.firstName || ''} ${b.intern?.lastName || ''}`),
      render: (_, record) => record.intern ? (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#87d068' }}>{(record.intern.firstName || '?').charAt(0)}</Avatar>
          <Text>{record.intern.firstName} {record.intern.lastName}</Text>
        </Space>
      ) : <Text type="secondary">N/A</Text>,
      width: 200,
    },
    {
      title: 'Mentor',
      key: 'mentor',
      sorter: (a, b) => `${a.mentor?.firstName || ''} ${a.mentor?.lastName || ''}`.localeCompare(`${b.mentor?.firstName || ''} ${b.mentor?.lastName || ''}`),
      render: (_, record) => record.mentor ? (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{record.mentor.firstName} {record.mentor.lastName}</Text>
        </Space>
      ) : (record.type === 'Self-Review' ? <Text type="secondary">N/A (Self)</Text> : <Text type="secondary">N/A</Text>),
      width: 200,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt', // CRITICAL FIX: Changed to 'createdAt'
      key: 'date',
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      render: (createdAt: string) => (
        <Space>
          <ClockCircleOutlined style={{color: '#8c8c8c'}} />
          <Text>{dayjs(createdAt).format('YYYY-MM-DD')}</Text>
        </Space>
      ),
      width: 150,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Weekly Note', value: 'Weekly Note' },
        { text: 'Midpoint Review', value: 'Midpoint Review' },
        { text: 'Final Review', value: 'Final Review' },
        { text: 'Self-Review', value: 'Self-Review' },
      ],
      onFilter: (value, record) => record.type === value,
      render: (type: Evaluation['type']) => {
        let color = 'default';
        if (type === 'Midpoint Review') color = 'processing';
        else if (type === 'Final Review') color = 'success';
        else if (type === 'Weekly Note') color = 'blue';
        else if (type === 'Self-Review') color = 'purple';
        return <Tag color={color}>{type || 'Unknown'}</Tag>;
      },
      width: 130,
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      sorter: (a, b) => (a.score ?? 0) - (b.score ?? 0),
      render: (score: number | null | undefined) => {
        let color = '#f5222d'; // Red
        let displayScore: string | number = '-';
        if (typeof score === 'number') {
            displayScore = score;
            if (score >= 4) color = '#52c41a'; // Green
            else if (score >= 3) color = '#faad14'; // Gold
        }
        return (
          <Tag color={color} icon={<StarFilled />} style={{ fontWeight: 'bold' }}>
            {displayScore} / 5
          </Tag>
        );
      },
      align: 'center',
      width: 120,
    },
    {
      title: 'Feedback',
      dataIndex: 'feedbackText',
      key: 'feedback',
      render: (text: string) => (
        <Paragraph
          style={{ marginBottom: 0, maxWidth: '300px' }}
          ellipsis={{
            tooltip: {
              title: text || 'No feedback provided', // CRITICAL FIX: Correct tooltip object structure
              placement: 'topLeft'
            }
          }}
        >
          {text || '-'}
        </Paragraph>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Evaluation) => (
        <Tooltip title="View Full Evaluation Details">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => notification.info({message: `View details for eval ${record.id}`})} // Placeholder
          >
            View
          </Button>
        </Tooltip>
      ),
      width: 100,
      align: 'center',
    },
  ];
  // ---

  return (
    <MainLayout>
      <Title level={2}>Evaluations Report</Title>
      <Paragraph type="secondary">View and filter performance evaluations across all interns. Use the filters below to narrow down the results.</Paragraph>

      {/* Filter Card */}
      <Card style={{ margin: '20px 0', background: '#fafafa', border: '1px solid #e8e8e8' }}>
        <Form form={form} layout="vertical" onFinish={handleFilter}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="internName" label="Intern Name">
                <Input placeholder="Search by Intern" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="mentorName" label="Mentor Name">
                <Input placeholder="Search by Mentor" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="type" label="Evaluation Type">
                <Select mode="multiple" placeholder="Filter by Type(s)" allowClear style={{ width: '100%' }}>
                  <Option value="Weekly Note">Weekly Note</Option>
                  <Option value="Midpoint Review">Midpoint Review</Option>
                  <Option value="Final Review">Final Review</Option>
                  <Option value="Self-Review">Self-Review</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="dateRange" label="Date Range">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24} style={{ textAlign: 'right', marginTop: '10px' }}>
              <Space>
                <Button onClick={handleResetFilters} icon={<ClearOutlined />}>Reset Filters</Button>
                <Button type="primary" htmlType="submit" icon={<FilterOutlined />}>Apply Filters</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Evaluations Table */}
      <Spin spinning={loading} size="large" tip="Loading evaluations...">
        <Table
          columns={columns}
          dataSource={filteredEvaluations}
          rowKey="id"
          locale={{
            emptyText: (
              <Empty
                description={
                  evaluations.length > 0 ?
                  "No evaluations match the current filters." :
                  "No evaluations found in the system."
                }
              />
            )
          }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            pageSizeOptions: ['15', '30', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
          scroll={{ x: 1000 }}
          style={{marginTop: '20px'}}
        />
      </Spin>
    </MainLayout>
  );
}