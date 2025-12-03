"use client";
import React, { useEffect, useState, useCallback } from 'react';
import MainLayout from '../../components/MainLayout';
import api from '../../../lib/api';
import {
Spin,
Card,
Typography,
Row,
Col,
Alert,
List,
Tag,
Button,
message,
Empty,
Space,
Progress
} from 'antd';
import { CheckCircleOutlined, CheckCircleFilled, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ChecklistItem {
id: string;
title: string;
isCompleted: boolean;
}

interface ChecklistTemplate {
title: string;
description?: string;
}

interface Checklist {
id: string;
template: ChecklistTemplate;
items: ChecklistItem[];
isCompleted: boolean;
progress?: number;
}

export default function InternDashboardPage() {
const [checklists, setChecklists] = useState<Checklist[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [updatingItems, setUpdatingItems] = useState<string[]>([]);

const fetchChecklists = useCallback(async () => {
setLoading(true);
setError(null);
try {
const res = await api.get<Checklist[]>('/checklists/intern/me');
const checklistsWithProgress = res.data.map(cl => {
const completedItems = cl.items.filter(item => item.isCompleted).length;
const progress = cl.items.length > 0 ? Math.round((completedItems / cl.items.length) * 100) : 0;
return { ...cl, progress };
});
setChecklists(checklistsWithProgress);
} catch (err: any) {
const errMsg = err?.response?.data?.message ?? err.message ?? 'Failed to load checklists';
setError(errMsg);
message.error({ content: errMsg, duration: 5 });
} finally {
setLoading(false);
}
}, []);

const toggleItem = useCallback(async (itemId: string, isCompleted: boolean) => {
setUpdatingItems(prev => [...prev, itemId]);
setChecklists(prev => prev.map(cl => ({
...cl,
items: cl.items.map(i => i.id === itemId ? { ...i, isCompleted } : i),
progress: Math.round((cl.items.map(i => i.id === itemId ? { ...i, isCompleted } : i).filter(i => i.isCompleted).length / cl.items.length) * 100)
})));

try {  
  await api.patch(`/checklists/items/${itemId}`, { isCompleted });  
  message.success('Item status updated');  
} catch (err: any) {  
  const errMsg = err?.response?.data?.message ?? 'Failed to update item';  
  message.error({ content: errMsg, duration: 5 });  
  fetchChecklists();  
} finally {  
  setUpdatingItems(prev => prev.filter(id => id !== itemId));  
}  


}, [fetchChecklists]);

// --- Complete All / Undo All ---
const toggleAllItems = useCallback(async (checklist: Checklist, markComplete: boolean) => {
const itemIds = checklist.items.map(i => i.id);
setUpdatingItems(prev => [...prev, ...itemIds]);

// Optimistic update  
setChecklists(prev => prev.map(cl => cl.id === checklist.id  
  ? { ...cl, items: cl.items.map(i => ({ ...i, isCompleted: markComplete })), progress: markComplete ? 100 : 0 }  
  : cl  
));  

try {  
  await Promise.all(itemIds.map(id => api.patch(`/checklists/items/${id}`, { isCompleted: markComplete })));  
  message.success(markComplete ? 'All items completed' : 'All items reverted');  
} catch (err: any) {  
  const errMsg = err?.response?.data?.message ?? 'Failed to update checklist items';  
  message.error({ content: errMsg, duration: 5 });  
  fetchChecklists();  
} finally {  
  setUpdatingItems(prev => prev.filter(id => !itemIds.includes(id)));  
}  


}, [fetchChecklists]);

useEffect(() => { fetchChecklists(); }, [fetchChecklists]);

if (loading) {
return <MainLayout><div style={{ padding: 24, textAlign: 'center' }}><Spin tip="Loading your checklists..." size="large" /></div></MainLayout>;
}

if (error) {
return <MainLayout><div style={{ padding: 24 }}><Alert type="error" message="Error loading checklists" description={error} showIcon action={<Button size="small" onClick={fetchChecklists}>Retry</Button>} /></div></MainLayout>;
}

if (checklists.length === 0) {
return <MainLayout><div style={{ padding: 24 }}><Empty description={<Space direction="vertical" align="center"><Title level={3}>No checklists assigned</Title><Text type="secondary">You don't have any checklists assigned yet.</Text><Text type="secondary">Please check back later or contact your mentor.</Text></Space>} /></div></MainLayout>;
}

return ( <MainLayout>
<div style={{ padding: 24 }}> <Title level={2}>Your Checklists</Title>
<Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>Track your progress and complete your assigned tasks</Text>

    <Row gutter={[16, 16]}>  
      {checklists.map(checklist => {  
        const allCompleted = checklist.items.every(i => i.isCompleted);  
        return (  
          <Col xs={24} md={12} lg={8} key={checklist.id}>  
            <Card  
              title={<Space direction="vertical"><Space>{checklist.isCompleted ? <CheckCircleFilled style={{ color: '#52c41a' }} /> : <ClockCircleOutlined style={{ color: '#1890ff' }} />}<Text strong>{checklist.template.title}</Text></Space>{checklist.template.description && <Text type="secondary" style={{ fontSize: 12 }}>{checklist.template.description}</Text>}</Space>}  
              extra={<Tag color={checklist.isCompleted ? 'green' : 'blue'}>{checklist.isCompleted ? 'Completed' : `${checklist.progress}% Complete`}</Tag>}  
            >  
              {checklist.progress !== undefined && <Progress percent={checklist.progress} status={checklist.isCompleted ? 'success' : 'active'} strokeColor={checklist.isCompleted ? '#52c41a' : '#1890ff'} style={{ marginBottom: 16 }} />}  

              <div style={{ textAlign: 'right', marginBottom: 8 }}>  
                <Button  
                  size="small"  
                  onClick={() => toggleAllItems(checklist, !allCompleted)}  
                  loading={checklist.items.some(i => updatingItems.includes(i.id))}  
                >  
                  {allCompleted ? 'Undo All' : 'Complete All'}  
                </Button>  
              </div>  

              <List dataSource={checklist.items} renderItem={item => (  
                <List.Item actions={[<Button type={item.isCompleted ? 'default' : 'primary'} size="small" onClick={() => toggleItem(item.id, !item.isCompleted)} icon={item.isCompleted ? undefined : <CheckCircleOutlined />} loading={updatingItems.includes(item.id)}>{item.isCompleted ? 'Undo' : 'Complete'}</Button>]}>  
                  <List.Item.Meta title={<Text delete={item.isCompleted}>{item.title}</Text>} description={<Tag color={item.isCompleted ? 'green' : 'blue'}>{item.isCompleted ? 'Completed' : 'Pending'}</Tag>} />  
                </List.Item>  
              )} />  
            </Card>  
          </Col>  
        );  
      })}  
    </Row>  

    <div style={{ textAlign: 'center', marginTop: 24 }}>  
      <Button type="primary" onClick={fetchChecklists} icon={<SyncOutlined />}>Refresh Checklists</Button>  
    </div>  
  </div>  
</MainLayout>  


);
}
