import { CheckCircleOutlined } from '@ant-design/icons';

interface FormSuccessProps {
  message?: string;
}

export const FormSuccess = ({ message }: FormSuccessProps) => {
  if (!message) return null;

  return (
    <div className="ant-alert ant-alert-success" style={{ marginTop: '8px' }}>
      <CheckCircleOutlined className="ant-alert-icon" />
      <span className="ant-alert-message">{message}</span>
    </div>
  );
};
