'use client';

import { useState } from 'react';
import { Modal, Form, Button, message, Select, Rate, Input } from 'antd';
import { SparklesIcon } from '@heroicons/react/24/solid';
import api from '../../../lib/api'; // Ensure this path is correct
const { TextArea } = Input;

interface CreateEvaluationModalProps {
  internId: number; // Expect number ID from the page
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateEvaluationModal({
  internId,
  open,
  onClose,
  onSuccess,
}: CreateEvaluationModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);

  // Calls backend to generate AI draft
  const handleGenerateDraft = async () => {
    setDraftLoading(true);
    console.log(`[Modal GenerateDraft] Calling API for intern ID (number): ${internId}`);
    try {
      const response = await api.post(`/evaluations/generate-draft/${internId}`);
      const data = response.data;
      // Set the 'comments' field *in the form*
      form.setFieldsValue({
        comments: data.draft + "\n\n--- (AI-generated draft, please review and edit) ---",
      });
      message.success('AI draft generated!');
    } catch (error: any) {
      console.error("[Modal GenerateDraft] AI Draft Error:", error);
      let errorMsg = 'Could not generate AI draft.';
      if (error.response?.data?.message) {
         errorMsg = `AI Draft Failed: ${Array.isArray(error.response.data.message) ? error.response.data.message.join(', ') : error.response.data.message}`;
         console.error("[Modal GenerateDraft] Backend Error Response:", error.response.data);
      } else if (error.message) {
         errorMsg = `AI Draft Failed: ${error.message}`;
      }
      message.error(errorMsg, 7);
    } finally {
      setDraftLoading(false);
    }
  };

  // Submits the final evaluation
  const onFinish = async (values: any) => {
    setLoading(true);
    console.log('[Modal Submit] Form values:', values); // values will have { type, score, comments }
    try {
      // --- THIS IS THE FIX ---
      // Construct payload matching backend DTO (expects 'feedbackText')
      const payload = {
        type: values.type,             // String like "Final Review"
        score: values.score,           // Number like 4
        internId: internId,            // Number passed as prop
        feedbackText: values.comments, // Map form's 'comments' to DTO's 'feedbackText'
      };
      // --- End Fix ---
      console.log('[Modal Submit] Sending payload:', payload);

      await api.post('/evaluations', payload);

      message.success('Evaluation submitted successfully!');
      onSuccess();
      onClose();
      form.resetFields();
    } catch (error: any) {
      console.error("[Modal Submit] Submission Error:", error);
      let errorMsg = 'Submission failed. Please try again.';
      if (error.response?.data?.message) {
         const backendMessages = Array.isArray(error.response.data.message)
           ? error.response.data.message
           : [error.response.data.message];
         errorMsg = `Submission failed: ${backendMessages.join('; ')}`;
         console.error("[Modal Submit] Backend Validation Errors:", backendMessages);
      } else if (error.message) {
         errorMsg = `Submission failed: ${error.message}`;
      }
      message.error(errorMsg, 7);
    } finally {
      setLoading(false);
    }
  };

  // --- Modal JSX ---
  return (
    <Modal
      title={`Submit Evaluation for Intern (ID: ${internId})`}
      open={open}
      onCancel={() => { if (!loading && !draftLoading) onClose(); }}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
        style={{ marginTop: '20px' }}
      >
        {/* Evaluation Type */}
        <Form.Item
          name="type"
          label="Evaluation Type"
          rules={[{ required: true, message: 'Please select an evaluation type.' }]}
        >
          <Select placeholder="Select a type">
            <Select.Option value="Weekly Note">Weekly Note</Select.Option>
            <Select.Option value="Midpoint Review">Midpoint Review</Select.Option>
            <Select.Option value="Final Review">Final Review</Select.Option>
          </Select>
        </Form.Item>

        {/* Score */}
        <Form.Item
          name="score"
          label="Overall Score (1-5)"
          rules={[{ required: true, message: 'Please provide a score.' }]}
        >
          <Rate count={5} />
        </Form.Item>

        {/* Comments/Feedback Text - IMPORTANT: Form name is 'comments' */}
        <Form.Item
          name="comments" // The form item *must* be named 'comments' to capture TextArea input
          label="Feedback Comments"
          rules={[{ required: true, message: 'Feedback comments cannot be empty.' }]} // Matches 'feedbackText should not be empty' indirectly
        >
          <TextArea
            rows={10}
            placeholder="Provide detailed feedback..."
          />
        </Form.Item>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          <Button onClick={handleGenerateDraft} loading={draftLoading} disabled={loading} icon={<SparklesIcon width={16} />}>
          

            Generate AI Draft
          </Button>
          <Button type="primary" htmlType="submit" loading={loading} disabled={draftLoading}>
            Submit Evaluation
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

