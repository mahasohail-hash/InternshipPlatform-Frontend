'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../../components/MainLayout';
import {
    Typography,
    Card,
    Button,
    Select,
    notification,
    Spin,
    Alert,
    Space,
    Divider,
    Form,
    Row,
    Col,
    Result,
} from 'antd';
import { FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import api from '../../../lib/api';
import { UserRole } from '../../../common/enums/user-role.enum'; // CRITICAL FIX: Correct import path
import { AxiosError } from 'axios';

const { Title, Paragraph } = Typography;
const { Option } = Select;

interface InternUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string; // Add email if fetched
    role: UserRole; // Add role
}

export default function MentorReportsPage() {
    const { data: session, status: sessionStatus } = useSession();
    const [interns, setInterns] = useState<InternUser[]>([]);
    const [loadingInterns, setLoadingInterns] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [form] = Form.useForm();

    const mentorRole = session?.user?.role;

    // --- Data Fetching ---
    const fetchInternUsers = useCallback(async () => {
        if (sessionStatus !== 'authenticated') return;
        setLoadingInterns(true);
        try {
            // CRITICAL FIX: Fetch all users and filter for interns or use a dedicated intern endpoint
            const res = await api.get('/users');
            const validInterns = (res.data || []).filter((u: InternUser) => u.role === UserRole.INTERN);
            setInterns(validInterns);
        } catch (err: any) {
            console.error('Failed to fetch interns for reports:', err);
            notification.error({ message: 'Error', description: err.response?.data?.message || 'Could not load intern list.' });
        } finally {
            setLoadingInterns(false);
        }
    }, [sessionStatus]);

    useEffect(() => {
        if (sessionStatus === 'authenticated' && mentorRole === UserRole.MENTOR) {
            fetchInternUsers();
        } else if (sessionStatus === 'unauthenticated') {
            setLoadingInterns(false);
        }
    }, [sessionStatus, mentorRole, fetchInternUsers]);


    // --- Core Action: PDF Generation (Feature 4.8) ---
    const handleGeneratePdf = async (values: { internId: string }) => {
        const internId = values.internId;

        setIsGenerating(true);
        notification.info({ message: 'Generating PDF report...', description: 'Your download should start shortly.', duration: 0 }); // Indefinite message

        try {
            // CRITICAL FIX: This URL must match your ReportsController route
            // And expect a blob response to handle download client-side
            const response = await api.get(`/reports/final-packet/${internId}`, {
                responseType: 'blob', // IMPORTANT: This tells Axios to expect binary data
            });

            // Create a Blob from the response data
            const blob = new Blob([response.data], { type: 'application/pdf' });

            // Create a temporary URL for the Blob and trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Intern_Report_${internId}.pdf`; // Suggested filename
            document.body.appendChild(a);
            a.click(); // Programmatically click the link
            window.URL.revokeObjectURL(url); // Clean up the URL
            document.body.removeChild(a); // Clean up the anchor tag

            notification.success({
                message: 'Report Download Started',
                description: 'Your PDF report is downloading now. Please check your downloads.',
                duration: 5,
            });

        } catch (error: any) {
            console.error('PDF Download Failed:', error.response?.data || error.message);
            let errorMessage = 'Could not generate the PDF report.';
            if (error instanceof AxiosError && error.response) {
                // Try to parse error message from blob if it's a JSON string
                if (error.response.data instanceof Blob) {
                    const errorText = await error.response.data.text();
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.message || errorMessage;
                    } catch {
                        errorMessage = errorText || errorMessage;
                    }
                } else {
                    errorMessage = error.response.data?.message || errorMessage;
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            notification.error({
                message: 'Download Failed',
                description: errorMessage,
                duration: 7,
            });
        } finally {
            setIsGenerating(false);
            notification.destroy(); // Close indefinite loading notification
        }
    };


    if (sessionStatus === 'loading' || loadingInterns) {
        return <MainLayout><Spin tip="Loading data..." size="large" /></MainLayout>;
    }
    if (sessionStatus === 'unauthenticated' || mentorRole !== UserRole.MENTOR) {
        return <MainLayout><Result status="403" title="Access Denied"   /></MainLayout>;
    }


    return (
        <MainLayout>
            <Title level={2}><FilePdfOutlined /> Final Reports & Exports</Title>
            <Paragraph type="secondary">
                Generate the official PDF packet containing all evaluations and AI metrics for an intern.
            </Paragraph>
            <Divider />

            <Card title="Generate Intern Packet (4.8)">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleGeneratePdf}
                >
                    <Row gutter={24}>
                        <Col xs={24} sm={16} lg={12}>
                            <Form.Item
                                name="internId"
                                label="Select Intern for Report"
                                rules={[{ required: true, message: 'Please select an intern to generate the report.' }]}
                            >
                                <Select
                                    placeholder="Choose intern"
                                    disabled={interns.length === 0 || isGenerating}
                                    loading={loadingInterns}
                                >
                                    {interns.map(i => (
                                        <Option key={i.id} value={i.id}>
                                            {i.firstName} {i.lastName} ({i.email})
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8} lg={4}>
                            <Form.Item label=" ">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    size="large"
                                    loading={isGenerating}
                                    icon={<DownloadOutlined />}
                                    style={{ width: '100%' }}
                                    disabled={!form.getFieldValue('internId') || isGenerating}
                                >
                                    Generate PDF
                                </Button>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>

        </MainLayout>
    );
}