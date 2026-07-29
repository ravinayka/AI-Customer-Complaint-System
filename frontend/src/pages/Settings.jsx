import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Tabs,
  Form,
  Input,
  Select,
  Switch,
  Slider,
  Upload,
  Button,
  Avatar,
  Divider,
  Space,
  Row,
  Col,
  Typography,
  message,
  InputNumber,
  Modal,
  List,
  Tag
} from 'antd';
import {
  UserOutlined,
  RobotOutlined,
  BgColorsOutlined,
  BellOutlined,
  LockOutlined,
  SaveOutlined,
  UploadOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  EyeOutlined,
  SyncOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { saveSettings, updatePassword, logoutAll, updateLocalThemeMode } from '../redux/settingsSlice';

const { Title, Text, Paragraph } = Typography;

export default function Settings() {
  const dispatch = useDispatch();
  const { data: settings, saving, loading } = useSelector((state) => state.settings);
  
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profilePicBase64, setProfilePicBase64] = useState(null);
  const [tempVal, setTempVal] = useState(0.1);
  const [activeTab, setActiveTab] = useState('1');

  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('http://localhost:8000/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      message.error("Failed to load audit logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === '6') {
      fetchLogs();
    }
  }, [activeTab]);

  // Initialize form values from settings state
  useEffect(() => {
    if (settings) {
      form.setFieldsValue({
        name: settings.name,
        email: settings.email,
        role: settings.role,
        groq_api_key: settings.groq_api_key,
        model_selection: settings.model_selection,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        theme_mode: settings.theme_mode,
        email_notifications: settings.email_notifications,
        desktop_notifications: settings.desktop_notifications,
        critical_alerts: settings.critical_alerts,
        two_factor_enabled: settings.two_factor_enabled,
        language: settings.language
      });
      setProfilePicBase64(settings.profile_pic);
      setTempVal(settings.temperature);
    }
  }, [settings, form]);

  // Convert uploaded file to Base64 string for database storage
  const handleProfilePicUpload = async ({ file }) => {
    try {
      const getBase64 = (fileObj) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(fileObj);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });
      
      const base64Str = await getBase64(file);
      setProfilePicBase64(base64Str);
      message.success('Profile picture uploaded successfully! Remember to save settings.');
    } catch (err) {
      message.error('Failed to parse uploaded image file.');
    }
  };

  // Submit Settings Form
  const handleSaveAllSettings = async () => {
    try {
      const values = await form.validateFields();
      const updatedSettings = {
        ...values,
        profile_pic: profilePicBase64
      };
      
      const response = await dispatch(saveSettings(updatedSettings)).unwrap();
      message.success('Settings saved successfully and persisted in database.');
    } catch (err) {
      if (err.errorFields) {
        message.error('Validation failed. Please correct the highlighted errors.');
      } else {
        message.error(err || 'Failed to save settings.');
      }
    }
  };

  // Handle password update submission
  const handlePasswordChange = async (values) => {
    try {
      await dispatch(updatePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      })).unwrap();
      message.success('Password changed successfully.');
      passwordForm.resetFields();
    } catch (err) {
      message.error(err || 'Failed to update password.');
    }
  };

  // Handle logout all other sessions
  const handleLogoutAll = async () => {
    Modal.confirm({
      title: 'Confirm Logout',
      content: 'Are you sure you want to terminate all other active sessions across other devices?',
      okText: 'Logout All Other Devices',
      cancelText: 'Cancel',
      okType: 'danger',
      onOk: async () => {
        try {
          await dispatch(logoutAll()).unwrap();
          message.success('Successfully terminated all other device sessions.');
        } catch (err) {
          message.error(err || 'Failed to terminate other sessions.');
        }
      }
    });
  };

  const handleThemeCardSelect = (mode) => {
    form.setFieldValue('theme_mode', mode);
    dispatch(updateLocalThemeMode(mode));
  };

  // Tabs Left Navigation Menu Configuration
  const tabItems = [
    {
      key: '1',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserOutlined /> User Profile
        </span>
      ),
      children: (
        <div style={{ padding: '0 12px' }}>
          <Title level={4} style={{ color: '#fff', marginBottom: 20 }}>User Profile Settings</Title>
          <Row gutter={24} align="middle">
            <Col xs={24} md={6} style={{ textAlign: 'center', marginBottom: 20 }}>
              <Space direction="vertical" size={12}>
                <Avatar
                  size={120}
                  src={profilePicBase64}
                  icon={<UserOutlined />}
                  style={{
                    border: '3px solid #6366f1',
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)'
                  }}
                />
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={() => false}
                  onChange={handleProfilePicUpload}
                >
                  <Button icon={<UploadOutlined />} size="small">Change Photo</Button>
                </Upload>
                {profilePicBase64 && (
                  <Button 
                    type="link" 
                    danger 
                    size="small" 
                    onClick={() => {
                      setProfilePicBase64(null);
                      message.success('Avatar removed. Click Save Settings to persist.');
                    }}
                  >
                    Remove Photo
                  </Button>
                )}
              </Space>
            </Col>
            
            <Col xs={24} md={18}>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="name"
                    label="Full Name"
                    rules={[{ required: true, message: 'Please enter your name' }]}
                  >
                    <Input placeholder="Enter your full name" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="email"
                    label="Email Address"
                    rules={[
                      { required: true, message: 'Please enter your email' },
                      { type: 'email', message: 'Please enter a valid email address' }
                    ]}
                  >
                    <Input placeholder="Enter your email address" size="large" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="role"
                    label="User Role"
                    rules={[{ required: true, message: 'Please enter or select your role' }]}
                  >
                    <Select size="large" placeholder="Select your role">
                      <Select.Option value="Administrator">Administrator</Select.Option>
                      <Select.Option value="Quality Assurance Lead">Quality Assurance Lead</Select.Option>
                      <Select.Option value="Inspector">Quality Inspector</Select.Option>
                      <Select.Option value="Support Representative">Support Rep</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: '2',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RobotOutlined /> AI Configuration
        </span>
      ),
      children: (
        <div style={{ padding: '0 12px' }}>
          <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>AI Engine & Models</Title>
          <Paragraph style={{ color: '#9ca3af', marginBottom: 20 }}>
            Configure the LLM settings used by the automated Quality Assurance ticket extraction and risk routing pipeline.
          </Paragraph>
          
          <Form.Item
            name="groq_api_key"
            label="Groq API Key"
            rules={[]}
          >
            <Input.Password
              placeholder="gsk_..."
              size="large"
              prefix={<KeyOutlined style={{ color: '#64748b' }} />}
            />
          </Form.Item>
          
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="model_selection"
                label="Model Selection"
                rules={[{ required: true, message: 'Please select an LLM model' }]}
              >
                <Select size="large" placeholder="Select LLM model">
                  <Select.Option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</Select.Option>
                  <Select.Option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</Select.Option>
                  <Select.Option value="mixtral-8x7b-32768">Mixtral 8x7B 32k</Select.Option>
                  <Select.Option value="gemma2-9b-it">Gemma 2 9B IT</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="max_tokens"
                label="Max Generation Tokens"
                rules={[
                  { required: true, message: 'Please specify max tokens' },
                  { type: 'number', min: 1, message: 'Max tokens must be greater than 0' }
                ]}
              >
                <InputNumber style={{ width: '100%' }} size="large" placeholder="1024" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="temperature"
            label={`Temperature: ${tempVal}`}
            rules={[{ required: true, message: 'Please specify temperature value' }]}
          >
            <Row gutter={16} align="middle">
              <Col span={18}>
                <Slider
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  value={tempVal}
                  onChange={(val) => {
                    setTempVal(val);
                    form.setFieldValue('temperature', val);
                  }}
                />
              </Col>
              <Col span={6}>
                <InputNumber
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  value={tempVal}
                  style={{ width: '100%' }}
                  onChange={(val) => {
                    if (val !== null) {
                      setTempVal(val);
                      form.setFieldValue('temperature', val);
                    }
                  }}
                />
              </Col>
            </Row>
          </Form.Item>
        </div>
      )
    },
    {
      key: '3',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BgColorsOutlined /> Appearance & Lang
        </span>
      ),
      children: (
        <div style={{ padding: '0 12px' }}>
          <Title level={4} style={{ color: '#fff', marginBottom: 20 }}>Theme Mode Selection</Title>
          
          <Form.Item name="theme_mode" noStyle>
            <Input type="hidden" />
          </Form.Item>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Card
                hoverable
                onClick={() => handleThemeCardSelect('light')}
                style={{
                  background: '#f8fafc',
                  border: form.getFieldValue('theme_mode') === 'light' ? '2px solid #6366f1' : '1px solid #e2e8f0',
                  textAlign: 'center',
                  padding: '24px 0',
                  color: '#0f172a'
                }}
              >
                <BgColorsOutlined style={{ fontSize: 32, color: '#475569' }} />
                <div style={{ marginTop: 12, fontWeight: 600 }}>Light Mode</div>
              </Card>
            </Col>
            <Col span={12}>
              <Card
                hoverable
                onClick={() => handleThemeCardSelect('dark')}
                style={{
                  background: '#151b2c',
                  border: form.getFieldValue('theme_mode') === 'dark' ? '2px solid #6366f1' : '1px solid #1f2937',
                  textAlign: 'center',
                  padding: '24px 0',
                  color: '#fff'
                }}
              >
                <BgColorsOutlined style={{ fontSize: 32, color: '#818cf8' }} />
                <div style={{ marginTop: 12, fontWeight: 600 }}>Dark Mode</div>
              </Card>
            </Col>
          </Row>

          <Divider style={{ borderColor: '#1f2937' }} />

          <Title level={4} style={{ color: '#fff', marginBottom: 12 }}>System Language</Title>
          <Form.Item
            name="language"
            label="Default Language"
            rules={[{ required: true, message: 'Please select a language' }]}
          >
            <Select size="large" prefix={<GlobalOutlined />}>
              <Select.Option value="en">English (US)</Select.Option>
              <Select.Option value="es">Español (Spanish)</Select.Option>
              <Select.Option value="fr">Français (French)</Select.Option>
              <Select.Option value="de">Deutsch (German)</Select.Option>
              <Select.Option value="hi">हिन्दी (Hindi)</Select.Option>
            </Select>
          </Form.Item>
        </div>
      )
    },
    {
      key: '4',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BellOutlined /> Notifications
        </span>
      ),
      children: (
        <div style={{ padding: '0 12px' }}>
          <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Notification Preferences</Title>
          <Paragraph style={{ color: '#9ca3af', marginBottom: 24 }}>
            Control which channels and triggers trigger automated notification dispatches to your screen or mailbox.
          </Paragraph>

          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, paddingRight: 20 }}>
                <Text strong style={{ color: '#fff', display: 'block' }}>Email Notifications</Text>
                <Text type="secondary" style={{ fontSize: 12, color: '#9ca3af' }}>
                  Send daily QA analytical summaries, escalated ticket warnings, and audit updates to your registered mailbox.
                </Text>
              </div>
              <Form.Item name="email_notifications" valuePropName="checked" noStyle>
                <Switch size="large" />
              </Form.Item>
            </div>

            <Divider style={{ margin: 0, borderColor: '#1f2937' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, paddingRight: 20 }}>
                <Text strong style={{ color: '#fff', display: 'block' }}>Desktop Push Notifications</Text>
                <Text type="secondary" style={{ fontSize: 12, color: '#9ca3af' }}>
                  Trigger real-time browser alerts and system push popups immediately when critical events occur.
                </Text>
              </div>
              <Form.Item name="desktop_notifications" valuePropName="checked" noStyle>
                <Switch size="large" />
              </Form.Item>
            </div>

            <Divider style={{ margin: 0, borderColor: '#1f2937' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, paddingRight: 20 }}>
                <Text strong style={{ color: '#fff', display: 'block' }}>Critical Complaint Alerts</Text>
                <Text type="secondary" style={{ fontSize: 12, color: '#9ca3af' }}>
                  Override standard notification rules to send high-priority immediate alerts whenever a "Critical" risk ticket is classified by AI.
                </Text>
              </div>
              <Form.Item name="critical_alerts" valuePropName="checked" noStyle>
                <Switch size="large" />
              </Form.Item>
            </div>
          </Space>
        </div>
      )
    },
    {
      key: '5',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LockOutlined /> Security & Safety
        </span>
      ),
      children: (
        <div style={{ padding: '0 12px' }}>
          <Title level={4} style={{ color: '#fff', marginBottom: 20 }}>Security Actions</Title>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div style={{ flex: 1, paddingRight: 20 }}>
              <Text strong style={{ color: '#fff', display: 'block' }}>Two-Factor Authentication (2FA)</Text>
              <Text type="secondary" style={{ fontSize: 12, color: '#9ca3af' }}>
                Secure your QA control panel with mandatory SMS/Authenticator code checks during login processes.
              </Text>
            </div>
            <Form.Item name="two_factor_enabled" valuePropName="checked" noStyle>
              <Switch size="large" checkedChildren="ON" unCheckedChildren="OFF" />
            </Form.Item>
          </div>

          <Divider style={{ borderColor: '#1f2937', margin: '20px 0' }} />

          <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Change Password</Title>
          <Paragraph style={{ color: '#9ca3af', marginBottom: 16 }}>
            Update your account password. Ensure the new password matches all standard guidelines.
          </Paragraph>

          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
            requiredMark={false}
          >
            <Form.Item
              name="oldPassword"
              label="Current Password"
              rules={[{ required: true, message: 'Please enter your current password' }]}
            >
              <Input.Password placeholder="Enter current password" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Please enter your new password' },
                { min: 6, message: 'New password must be at least 6 characters long' }
              ]}
            >
              <Input.Password placeholder="Enter new password (min 6 characters)" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your new password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Re-enter new password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Update Password</Button>
            </Form.Item>
          </Form>

          <Divider style={{ borderColor: '#1f2937', margin: '20px 0' }} />

          <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Device Sessions</Title>
          <Paragraph style={{ color: '#9ca3af', marginBottom: 12 }}>
            If you suspect unauthorized log entries, you can force logouts across all secondary systems.
          </Paragraph>
          <Button type="primary" danger onClick={handleLogoutAll}>
            Logout from All Other Devices
          </Button>
        </div>
      )
    },
    {
      key: '6',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileTextOutlined /> Audit Logs
        </span>
      ),
      children: (
        <div style={{ padding: '0 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <Title level={4} style={{ color: '#fff', marginBottom: 4 }}>System Audit Trail</Title>
              <Paragraph style={{ color: '#9ca3af', marginBottom: 0, fontSize: 12 }}>
                Complete traceability log of operations, ticket creations, modifications, and notifications.
              </Paragraph>
            </div>
            <Button size="small" icon={<SyncOutlined spin={loadingLogs} />} onClick={fetchLogs}>
              Refresh Logs
            </Button>
          </div>
          
          <Card bordered={false} style={{ background: '#111827', border: '1px solid #1f2937' }} bodyStyle={{ padding: 0 }}>
            <List
              loading={loadingLogs}
              dataSource={auditLogs}
              pagination={{ pageSize: 5, size: 'small' }}
              renderItem={(log) => (
                <List.Item style={{ borderBottom: '1px solid #1f2937', padding: '12px 16px' }}>
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Tag color={
                          log.action.includes('Created') ? 'green' : log.action.includes('Updated') ? 'blue' : 'orange'
                        } style={{ fontWeight: 600, fontSize: 10 }}>
                          {log.action.toUpperCase()}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 11, color: '#64748b' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </Text>
                      </div>
                    }
                    description={
                      <div style={{ marginTop: 6 }}>
                        <Paragraph style={{ color: '#cbd5e1', fontSize: 12, margin: 0 }}>{log.details}</Paragraph>
                        <div style={{ marginTop: 4, display: 'flex', gap: 12, fontSize: 11, color: '#64748b' }}>
                          <span>User: <strong>{log.user_email}</strong></span>
                          {log.complaint_id && (
                            <span>Ticket ID: <strong style={{ color: '#6366f1' }}>{log.complaint_id}</strong></span>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </div>
      )
    }
  ];

  return (
    <Card 
      bordered={false} 
      style={{
        borderRadius: 16,
        background: '#151b2c',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '24px' }}
      loading={loading}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={2} style={{ margin: 0, fontWeight: 600, color: '#fff' }}>
                Settings Configuration
              </Title>
              <Text style={{ color: '#9ca3af' }}>
                Manage account profile, AI models, interface themes, and notification rules.
              </Text>
            </div>
          </div>

          <Divider style={{ margin: 0, borderColor: '#1f2937' }} />

          {/* Core Panel using Side Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabPosition="left"
            items={tabItems}
            style={{ minHeight: 450 }}
            tabBarStyle={{
              borderRight: '1px solid #1f2937',
              paddingRight: 12
            }}
          />

          <Divider style={{ margin: 0, borderColor: '#1f2937' }} />

          {/* Saving Button Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button 
              size="large" 
              onClick={() => {
                form.resetFields();
                setProfilePicBase64(settings.profile_pic);
                setTempVal(settings.temperature);
                message.info('Form reverted to current saved settings.');
              }}
              disabled={saving}
            >
              Reset Changes
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSaveAllSettings}
              loading={saving}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                border: 0,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </Form>
    </Card>
  );
}
