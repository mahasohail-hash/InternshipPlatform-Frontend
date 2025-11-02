'use client';

import { useState } from 'react';
import { Button, Card, Typography,Space,notification } from 'antd';
import { CreateEvaluationModal } from '../../components/mentors/CreateEvaluationModal'; // Adjust if needed
import { RobotOutlined } from '@ant-design/icons';
const { Title, Paragraph } = Typography;

export default function EvaluateInternPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

 
  const exampleInternId = 123; // Using a number as required by the DTO error message
  

  const handleModalSuccess = () => {
    console.log('Evaluation submitted!');
    setIsModalOpen(false);
  };

  return (
    <Card>
      <Title level={3}>Submit Evaluation</Title>
      <Paragraph>
        Click the button to open the evaluation form for intern ID: {exampleInternId}.
      </Paragraph>

      <Button type="primary" onClick={() => setIsModalOpen(true)}>
        Open Evaluation Form
      </Button>
<Space>
          {/* Existing Button */}
 <Button type="primary" onClick={() => setIsModalOpen(true)}>
 Open Evaluation Form
 </Button>

          {/* --- NEW BUTTON: AI Drafting (4.7) --- */}
          <Button 
            type="dashed" 
            icon={<RobotOutlined />}
            onClick={() => notification.info({message: "AI Drafting Feature", description: "This button would trigger the backend service (4.7) to generate a review draft based on GitHub metrics and NLP summaries."})}
          >
            Generate AI Draft
          </Button>
          {/* --- End New Button --- */}
 </Space>
      {/* The Modal Component */}
      <CreateEvaluationModal
        
        // Pass the NUMBER ID required by the modal/backend DTO
        internId={exampleInternId}
        // --- End Fix ---
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </Card>
  );
}

