import { ExclamationCircleOutlined } from '@ant-design/icons';

interface FormErrorProps {
  message?: string;
}

export const FormError = ({ message }: FormErrorProps) => {
  if (!message) return null;

  return (
    <div className="ant-alert ant-alert-error" style={{ marginTop: '8px' }}>
      <ExclamationCircleOutlined className="ant-alert-icon" />
      <span className="ant-alert-message">{message}</span>
    </div>
  );
};
