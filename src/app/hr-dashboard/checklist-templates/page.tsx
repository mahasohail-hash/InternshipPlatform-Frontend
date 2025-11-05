'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/MainLayout'; // Adjust path if needed
import {
  Typography,
  Button,
  Modal,
  Form,
  Input,
  Table,
  Space,
  notification,
  Popconfirm,
  Spin,
  Empty,
  Card,
  List,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusCircleOutlined,
  DeleteFilled,
} from '@ant-design/icons';
import api from '../../../lib/api'; // Adjust path if needed
// --- Import react-hook-form types ---
import {
  useForm,
  Controller,
  useFieldArray,
  Control,
  FieldErrors,
  UseFieldArrayAppend,
  UseFieldArrayRemove,
  FieldArrayWithId
} from 'react-hook-form';
// ------------------------------------
import { isAxiosError } from 'axios';

const { Title, Text } = Typography;

// --- TypeScript Interfaces ---
interface ChecklistTemplateItem {
  id?: string; // Optional for new items
  title: string;
  text: string; // Corresponds to entity's 'description'
}

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  items: ChecklistTemplateItem[];
}

interface TemplateFormData {
  name: string;
  description: string;
  items: ChecklistTemplateItem[];
}

// --- Reusable Template Form Component ---
interface TemplateFormProps {
  control: Control<TemplateFormData>;
  errors: FieldErrors<TemplateFormData>;
  fields: FieldArrayWithId<TemplateFormData, "items", "id">[];
  append: UseFieldArrayAppend<TemplateFormData, "items">;
  remove: UseFieldArrayRemove;
}

const TemplateForm = ({
  control,
  errors,
  fields,
  append,
  remove,
}: TemplateFormProps) => {
  return (
    <>
      {/* Template Name Input */}
      <Form.Item label="Template Name" required validateStatus={errors.name ? 'error' : ''} help={errors.name?.message as string}>
        <Controller
          name="name"
          control={control}
          rules={{ required: 'Template Name is required' }}
          render={({ field }) => <Input {...field} placeholder="e.g., Week 1 Onboarding" />}
        />
      </Form.Item>

      {/* Template Description Input */}
      <Form.Item label="Description" validateStatus={errors.description ? 'error' : ''} help={errors.description?.message as string}>
        <Controller
          name="description"
          control={control}
          render={({ field }) => <Input.TextArea {...field} rows={2} placeholder="Optional: Describe the purpose of this template" />}
        />
      </Form.Item>

      {/* Checklist Items Section */}
      <Title level={5} style={{ marginTop: 20 }}>Checklist Items</Title>
      <List
        locale={{ emptyText: "No items added yet." }}
        dataSource={fields}
        renderItem={(field, index) => (
          <List.Item
            key={field.id}
            actions={[
              <Button
                type="text"
                danger
                icon={<DeleteFilled />}
                onClick={() => remove(index)}
                aria-label={`Remove item ${index + 1}`}
              />,
            ]}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* Item Title Input */}
              <Form.Item
                label={`Item ${index + 1}: Title`}
                required
                validateStatus={errors.items?.[index]?.title ? 'error' : ''}
                help={errors.items?.[index]?.title?.message as string}
                style={{ marginBottom: 8 }}
              >
                <Controller
                  name={`items.${index}.title`}
                  control={control}
                  rules={{ required: 'Item title is required' }}
                  render={({ field }) => <Input {...field} placeholder="e.g., 'Setup Developer Environment'" />}
                />
              </Form.Item>
              {/* Item Text Input (maps to description in backend) */}
              <Form.Item
                label={`Item ${index + 1}: Text/Description`}
                required
                validateStatus={errors.items?.[index]?.text ? 'error' : ''}
                help={errors.items?.[index]?.text?.message as string}
                style={{ marginBottom: 0 }}
              >
                <Controller
                  name={`items.${index}.text`} // Frontend uses 'text'
                  control={control}
                  rules={{ required: 'Item text/description is required' }}
                  render={({ field }) => (
                    <Input.TextArea
                      {...field}
                      rows={2}
                      placeholder="e.g., 'Install VS Code, Node.js, and clone the repository...'"
                    />
                  )}
                />
              </Form.Item>
            </Space>
          </List.Item>
        )}
      />
      {/* Add Item Button */}
      <Button
        type="dashed"
        onClick={() => append({ title: '', text: '' })}
        icon={<PlusCircleOutlined />}
        style={{ marginTop: 16, width: '100%' }}
      >
        Add Checklist Item
      </Button>
    </>
  );
};

// --- Main Page Component ---
export default function ChecklistTemplatesPage() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Setup react-hook-form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TemplateFormData>({
    defaultValues: {
      name: '',
      description: '',
      items: [],
    },
  });

  // Setup useFieldArray for managing the dynamic 'items' list
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'items',
  });

  // Fetch templates from the backend
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('checklists/templates'); // CRITICAL FIX: Correct API endpoint
      setTemplates(res.data);
    } catch (error) {
      console.error("Failed to load templates:", error);
      notification.error({
        message: 'Failed to load templates',
        description: isAxiosError(error) ? (error.response?.data?.message || error.message) : 'Your session might be invalid. Please log out and log back in.',
      });
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch templates when the component mounts
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Show the Create/Edit modal
  const handleShowModal = (template: ChecklistTemplate | null = null) => {
    if (template) {
      setEditingTemplate(template);
      // Map existing items correctly, ensure defaults for safety (backend 'description' to frontend 'text')
      const formItems = template.items?.map(item => ({
          id: item.id,
          title: item.title || '',
          text: (item as any).description || '' // CRITICAL FIX: Map description to text
      })) || [];
      reset({
        name: template.name || '',
        description: template.description || '',
        items: formItems,
      });
      replace(formItems); // Reset useFieldArray state
    } else {
      setEditingTemplate(null);
      // Start new form with one empty item
      const initialItems = [{ title: '', text: '' }];
      reset({ name: '', description: '', items: initialItems });
      replace(initialItems); // Reset useFieldArray state
    }
    setIsModalOpen(true);
  };

  // Close the modal and reset state
  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    reset(); // Reset form to default values
    replace([]); // Clear field array
  };

  // Handle form submission (Create or Update)
  const onSubmit = async (data: TemplateFormData) => {
    setIsSubmitting(true);
    // Ensure items array exists and is an array
const itemsToSubmit = Array.isArray(data.items) ? data.items : [];
    try {
        let payload: any = {
            name: data.name,
            description: data.description,
            // CRITICAL FIX: Map frontend 'text' to backend 'description' for items
            items: itemsToSubmit.map(item => ({
                id: item.id, // Keep ID for updates
                title: item.title,
                description: item.text, // Backend entity uses 'description'
            })),
        };

       if (editingTemplate) {
            await api.patch(`/checklists/templates/${editingTemplate.id}`, payload); 
            notification.success({ message: 'Template updated successfully' });
        } else {
            // 🔥 FIX: Correctly destructure and omit 'id' for new items.
            // This ensures that new items (which shouldn't have an ID) are sent cleanly.
            payload.items = payload.items.map(({ id, ...rest }: any) => {
                // Return 'rest' only, effectively excluding 'id' if it was undefined
                return rest; 
            });
            
            await api.post('checklists/templates', payload); 
            notification.success({ message: 'Template created successfully' });
        }
        fetchTemplates();
        handleCancel();
    } catch (error) {
        let msg = 'An unknown error occurred';
      // ... (error handling logic)
      notification.error({ message: 'Operation Failed', description: msg });
    } finally {
        setIsSubmitting(false);
    }
  };

  // Handle deleting a template
  const handleDelete = async (templateId: string) => {
     try {
      await api.delete(`/checklists/templates/${templateId}`); // CRITICAL FIX: Correct endpoint
      notification.success({ message: 'Success', description: 'Template deleted.' });
      fetchTemplates(); // Refresh table data
    } catch (error) {
        let msg = 'Failed to delete template.';
         if (isAxiosError(error) && error.response) {
             if(error.response.status === 500 && error.response.data.message?.includes('constraint')) {
                 msg = 'Cannot delete template. It might be in use by intern checklists. Remove assignments first.'
             } else {
                 msg = error.response.data.message || msg;
             }
         }
      notification.error({ message: 'Deletion Failed', description: msg });
    }
  };

  // Define columns for the templates table
  const columns = [
     {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
       ellipsis: true,
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => items?.length || 0,
      align: 'center' as const,
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center' as const,
      width: 200,
      render: (_: any, record: ChecklistTemplate) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleShowModal(record)}
            aria-label={`Edit template ${record.name}`}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this template?"
            description="This action cannot be undone and might fail if the template is in use."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes, Delete"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} aria-label={`Delete template ${record.name}`}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
         <Title level={2}>Manage Checklist Templates</Title>
        <Text>
          Create and manage the reusable checklist blueprints assigned to new interns.
        </Text>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => handleShowModal(null)}
        >
          Create New Template
        </Button>

        {loading ? (
           <div style={{ textAlign: 'center', padding: '50px' }}> <Spin size="large" /></div>
        ) : (
          <Table
            columns={columns}
            dataSource={templates}
            rowKey="id"
            locale={{ emptyText: <Empty description="No templates found. Click 'Create New Template' to get started." /> }}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Space>

      <Modal
        title={editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Create New Template'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{marginTop: '20px'}}>
          <TemplateForm
            control={control}
            errors={errors}
            fields={fields}
            append={append}
            remove={remove}
          />
          <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 24 }}>
            <Button key="back" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button key="submit" type="primary" htmlType="submit" loading={isSubmitting}>
              {editingTemplate ? 'Update Template' : 'Save Template'}
            </Button>
          </Space>
        </Form>
      </Modal>
    </MainLayout>
  );
}