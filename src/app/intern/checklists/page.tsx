'use client';
import React, { useEffect, useState } from 'react';
import { Card, Typography, List, Checkbox, Spin, Alert, Button, notification } from 'antd';
import api from '../../../lib/api';
import { AxiosError } from 'axios';

const { Title, Text } = Typography;

interface ChecklistItem {
id: string;
title: string;
isCompleted: boolean;
}

interface InternChecklist {
id: string;
template: { id: string; name: string };
items: ChecklistItem[];
isCompleted: boolean;
}

export default function InternChecklistPage() {
const [checklists, setChecklists] = useState<InternChecklist[]>([]);
const [loading, setLoading] = useState(true);
const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
const [updatingChecklistId, setUpdatingChecklistId] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
const fetchChecklists = async () => {
try {
const res = await api.get('/checklists/intern/me');
setChecklists(res.data || []);
} catch (err) {
console.error(err);
setError('Failed to load your checklists.');
} finally {
setLoading(false);
}
};
fetchChecklists();
}, []);

const toggleItem = async (itemId: string, isCompleted: boolean) => {
setUpdatingItemId(itemId);
try {
await api.patch(`/checklists/items/${itemId}`, { isCompleted });
setChecklists(prev =>
prev.map(cl => ({
...cl,
items: cl.items.map(item =>
item.id === itemId ? { ...item, isCompleted } : item
),
isCompleted: cl.items.every(item =>
item.id === itemId ? isCompleted : item.isCompleted
),
}))
);
} catch (err) {
console.error(err);
let msg = 'Failed to update item.';
if (err instanceof AxiosError && err.response) {
msg = err.response.data?.message || msg;
}
notification.error({ message: 'Error', description: msg });
} finally {
setUpdatingItemId(null);
}
};

const markAll = async (checklist: InternChecklist, completed: boolean) => {
setUpdatingChecklistId(checklist.id);
try {
await Promise.all(
checklist.items
.filter(item => item.isCompleted !== completed)
.map(item => api.patch(`/checklists/items/${item.id}`, { isCompleted: completed }))
);
setChecklists(prev =>
prev.map(cl =>
cl.id === checklist.id
? {
...cl,
items: cl.items.map(item => ({ ...item, isCompleted: completed })),
isCompleted: completed,
}
: cl
)
);
notification.success({
message: completed ? 'Checklist Completed' : 'Checklist Incomplete',
description: `All items in "${checklist.template.name}" are now ${completed ? 'complete' : 'incomplete'}.`,
});
} catch (err) {
console.error(err);
let msg = completed
? 'Failed to mark all items as complete.'
: 'Failed to mark all items as incomplete.';
if (err instanceof AxiosError && err.response) {
msg = err.response.data?.message || msg;
}
notification.error({ message: 'Error', description: msg });
} finally {
setUpdatingChecklistId(null);
}
};

if (loading) return <Spin tip="Loading your checklists..." style={{ marginTop: 50 }} />;
if (error) return <Alert message="Error" description={error} type="error" showIcon />;

return (
<div style={{ maxWidth: 800, margin: '40px auto', padding: '20px' }}> <Title level={2}>Your Onboarding Checklists</Title>

```
  {checklists.length === 0 ? (
    <Alert message="No checklists assigned yet." type="info" showIcon />
  ) : (
    checklists.map(checklist => {
      const borderColor = checklist.isCompleted ? 'green' : '#f0f0f0';
      return (
        <Card
          key={checklist.id}
          title={checklist.template?.name || 'Unnamed Template'}
          extra={
            <>
              <Button
                type="link"
                onClick={() => markAll(checklist, true)}
                disabled={checklist.isCompleted || updatingChecklistId === checklist.id}
              >
                Mark All Complete
              </Button>
              <Button
                type="link"
                onClick={() => markAll(checklist, false)}
                disabled={!checklist.isCompleted || updatingChecklistId === checklist.id}
              >
                Mark All Incomplete
              </Button>
            </>
          }
          style={{ marginBottom: 20, border: `1px solid ${borderColor}` }}
        >
          {checklist.items.length === 0 ? (
            <Text type="secondary">No items in this checklist.</Text>
          ) : (
            <List
              dataSource={checklist.items}
              renderItem={item => (
                <List.Item key={item.id}>
                  <Checkbox
                    checked={item.isCompleted}
                    disabled={updatingItemId === item.id}
                    onChange={e => toggleItem(item.id, e.target.checked)}
                  >
                    {item.title || 'Untitled Item'}
                  </Checkbox>
                </List.Item>
              )}
            />
          )}
        </Card>
      );
    })
  )}
</div>


);
}
