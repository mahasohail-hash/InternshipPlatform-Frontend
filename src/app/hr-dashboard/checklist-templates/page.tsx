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
  Control,         // Type for control object
  FieldErrors,     // Type for errors object
  UseFieldArrayAppend, // Type for append function
  UseFieldArrayRemove, // Type for remove function
  FieldArrayWithId // Type for fields array items
} from 'react-hook-form';
// ------------------------------------
import { isAxiosError } from 'axios';

const { Title, Text } = Typography;

// --- TypeScript Interfaces (remain the same) ---
interface ChecklistTemplateItem {
  id?: string;
  title: string;
  text: string;
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
// --- FIX: Add proper types for props ---
interface TemplateFormProps {
  control: Control<TemplateFormData>; // Use Control type
  errors: FieldErrors<TemplateFormData>; // Use FieldErrors type
  fields: FieldArrayWithId<TemplateFormData, "items", "id">[]; // Use FieldArrayWithId type
  append: UseFieldArrayAppend<TemplateFormData, "items">; // Use UseFieldArrayAppend type
  remove: UseFieldArrayRemove; // Use UseFieldArrayRemove type
}
// ------------------------------------

const TemplateForm = ({
  control,
  errors,
  fields,
  append,
  remove,
}: TemplateFormProps) => { // Use the interface for props
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
        renderItem={(field, index) => ( // field already includes id from useFieldArray
          <List.Item
            key={field.id} // Use field.id provided by useFieldArray
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
                // --- FIX: Access nested errors correctly ---
                validateStatus={errors.items?.[index]?.title ? 'error' : ''}
                help={errors.items?.[index]?.title?.message as string}
                // -----------------------------------------
                style={{ marginBottom: 8 }}
              >
                <Controller
                  name={`items.${index}.title`}
                  control={control}
                  rules={{ required: 'Item title is required' }}
                  render={({ field }) => <Input {...field} placeholder="e.g., 'Setup Developer Environment'" />}
                />
              </Form.Item>
              {/* Item Text Input */}
              <Form.Item
                label={`Item ${index + 1}: Text/Description`}
                required
                // --- FIX: Access nested errors correctly ---
                validateStatus={errors.items?.[index]?.text ? 'error' : ''}
                help={errors.items?.[index]?.text?.message as string}
                // -----------------------------------------
                style={{ marginBottom: 0 }}
              >
                <Controller
                  name={`items.${index}.text`}
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
        onClick={() => append({ title: '', text: '' })} // Add a new empty item object
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
    name: 'items', // name must match the field in TemplateFormData
  });

  // Fetch templates from the backend
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('api/checklists/templates');
      setTemplates(res.data);
    } catch (error) {
      notification.error({
        message: 'Failed to load templates',
        description: 'Your session might be invalid. Please log out and log back in.',
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
      // Map existing items correctly, ensure defaults for safety
      const formItems = template.items?.map(item => ({
          id: item.id, // Keep the id if present
          title: item.title || '',
          text: item.text || ''
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
        let payload = { ...data, items: itemsToSubmit };

        if (editingTemplate) {
            // --- UPDATE ---
            // Add original IDs back if they existed
            const itemsWithIds = itemsToSubmit.map((item, index) => {
               // Safely get the original item's ID if it exists
               const originalItemId = editingTemplate.items?.[index]?.id;
               return {
                 ...item,
                 id: originalItemId || undefined // Add id only if it existed
               };
            });
            payload = { ...data, items: itemsWithIds };

            await api.patch(`/api/checklists/templates/${editingTemplate.id}`, payload);
            notification.success({ message: 'Template updated successfully' });
        } else {
            // --- CREATE ---
            // Ensure no accidental 'id' field is sent for new items
            payload = { ...data, items: itemsToSubmit.map(({ id, ...rest }) => rest) };
            await api.post('api/checklists/templates', payload);
            notification.success({ message: 'Template created successfully' });
        }
        fetchTemplates();
        handleCancel();
    } catch (error) {
        // ... (error handling remains the same) ...
        let msg = 'An unknown error occurred';
      if (isAxiosError(error) && error.response) {
        console.error("API Error:", error.response.data);
        if (Array.isArray(error.response.data.message)) {
            msg = error.response.data.message.join(', ');
        } else {
            msg = error.response.data.message || 'Check server logs';
        }
      } else {
          console.error("Non-API Error:", error);
      }
      notification.error({ message: 'Operation Failed', description: msg });
    } finally {
        setIsSubmitting(false);
    }
};


  // Handle deleting a template
  const handleDelete = async (templateId: string) => {
     try {
      await api.delete(`/api/checklists/templates/${templateId}`);
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
    // ... (columns definition remains the same) ...
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
       ellipsis: true, // Truncate long descriptions
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: any[]) => items?.length || 0, // Safely access length
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
        {/* ... (Title, Text, Create Button remain the same) ... */}
         <Title level={2}>Manage Checklist Templates</Title>
        <Text>
          Create and manage the reusable checklist blueprints assigned to new interns.
        </Text>
        <Button
          type="primary"
          icon={<PlusOutlined />} // Correct icon
          size="large"
          onClick={() => handleShowModal(null)} // Pass null to indicate creating
        >
          Create New Template
        </Button>


        {/* Display loading spinner or the table */}
        {loading ? (
           <div style={{ textAlign: 'center', padding: '50px' }}> <Spin size="large" /></div>
        ) : (
          <Table
            columns={columns}
            dataSource={templates}
            rowKey="id"
            locale={{ emptyText: <Empty description="No templates found. Click 'Create New Template' to get started." /> }}
            pagination={{ pageSize: 10 }} // Add pagination
          />
        )}
      </Space>

      {/* --- Create/Edit Modal --- */}
      <Modal
        title={editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Create New Template'}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null} // Use custom footer buttons inside the form
        width={800} // Wider modal for items
       destroyOnHidden// Reset form state when modal closes
      >
        {/* --- FIX: Wrap Form inside Modal --- */}
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)} style={{marginTop: '20px'}}>
          {/* Render the reusable form component */}
          <TemplateForm
            control={control}
            errors={errors}
            fields={fields} // Pass fields from useFieldArray
            append={append} // Pass append from useFieldArray
            remove={remove} // Pass remove from useFieldArray
          />
          {/* Modal Footer Buttons */}
          <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 24 }}>
            <Button key="back" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button key="submit" type="primary" htmlType="submit" loading={isSubmitting}>
              {editingTemplate ? 'Update Template' : 'Save Template'}
            </Button>
          </Space>
        </Form>
        {/* ---------------------------------- */}
      </Modal>
    </MainLayout>
  );
}

