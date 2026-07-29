import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Input, Button, Card, Typography, Select, Alert, Space, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined, AppstoreAddOutlined } from '@ant-design/icons';
import { loginThunk, registerThunk, clearError } from '../redux/authSlice';

const { Title, Text, Paragraph } = Typography;

export default function Auth() {
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  const [isRegister, setIsRegister] = useState(false); // Toggle Login/Register
  const [form] = Form.useForm();

  // Clear errors when toggling modes
  useEffect(() => {
    dispatch(clearError());
    form.resetFields();
  }, [isRegister, dispatch, form]);

  const handleSubmit = (values) => {
    if (isRegister) {
      dispatch(registerThunk({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role
      }))
        .unwrap()
        .then(() => {
          message.success("Registration and login successful!");
        })
        .catch(() => {});
    } else {
      dispatch(loginThunk({
        email: values.email,
        password: values.password
      }))
        .unwrap()
        .then(() => {
          message.success("Login successful!");
        })
        .catch(() => {});
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b0f19 0%, #151b2c 100%)',
      padding: '20px',
      fontFamily: 'Outfit, Inter, sans-serif'
    }}>
      <Card
        style={{
          width: 440,
          background: 'rgba(21, 27, 44, 0.7)',
          backdropFilter: 'blur(16px)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        }}
        bodyStyle={{ padding: '36px 28px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#fff',
            fontSize: 22,
            margin: '0 auto 16px auto',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
          }}>
            A
          </div>
          <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 600 }}>
            {isRegister ? 'Create QA Account' : 'Control Center Login'}
          </Title>
          <Paragraph type="secondary" style={{ color: '#9ca3af', marginTop: 6, fontSize: 13 }}>
            {isRegister 
              ? 'Register to access complaint tracing systems.' 
              : 'Log in to audit drug deviations and classify risks.'}
          </Paragraph>
        </div>

        {error && (
          <Alert
            message="Authentication Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 20, borderRadius: 8 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          {isRegister && (
            <Form.Item
              name="name"
              label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Full Name</span>}
              rules={[{ required: true, message: 'Please enter your full name' }]}
            >
              <Input 
                prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.25)' }} />} 
                placeholder="e.g. Dr. Jane Doe"
                style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', height: 42 }}
              />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Email Address</span>}
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: 'rgba(255,255,255,0.25)' }} />} 
              placeholder="e.g. user@facility.org"
              style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', height: 42 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Password</span>}
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.25)' }} />} 
              placeholder="••••••••"
              style={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', height: 42 }}
            />
          </Form.Item>

          {isRegister && (
            <Form.Item
              name="role"
              label={<span style={{ color: '#cbd5e1', fontSize: 12 }}>Assigned Role</span>}
              initialValue="User"
              rules={[{ required: true }]}
            >
              <Select 
                style={{ height: 42 }}
                dropdownStyle={{ background: '#151b2c', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Select.Option value="User">Standard User (Read/Write Complaints)</Select.Option>
                <Select.Option value="Administrator">Administrator (All Operations & Close Access)</Select.Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item style={{ marginTop: 24, marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                height: 42,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                border: 0,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
              }}
            >
              {isRegister ? 'Register Account' : 'Authenticate & Enter'}
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ color: '#64748b', fontSize: 12 }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </Text>
          <Button 
            type="link" 
            onClick={() => setIsRegister(!isRegister)}
            style={{ padding: '0 4px', fontSize: 12, fontWeight: 500 }}
          >
            {isRegister ? 'Log In' : 'Sign Up / Register'}
          </Button>
        </div>

        {/* Demo Test Credentials Helper */}
        {!isRegister && (
          <div style={{
            marginTop: 20,
            padding: '12px',
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px dashed rgba(99, 102, 241, 0.2)',
            borderRadius: '8px',
            fontSize: '11px',
            color: '#818cf8',
            lineHeight: 1.5
          }}>
            <strong>Demo Control Panel Credentials:</strong>
            <div style={{ marginTop: 4 }}>
              • Admin: <Text code style={{ color: '#818cf8', background: 'rgba(255,255,255,0.04)', border: 0 }}>admin@facility.org</Text> / <Text code style={{ color: '#818cf8', background: 'rgba(255,255,255,0.04)', border: 0 }}>admin123</Text>
            </div>
            <div>
              • Standard: <Text code style={{ color: '#818cf8', background: 'rgba(255,255,255,0.04)', border: 0 }}>user@facility.org</Text> / <Text code style={{ color: '#818cf8', background: 'rgba(255,255,255,0.04)', border: 0 }}>user123</Text>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
