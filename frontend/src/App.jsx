import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './redux/store';
import { 
  addComplaint, 
  updateComplaint, 
  fetchComplaints, 
  saveComplaint, 
  updateComplaintBackendThunk,
  setActiveComplaintId
} from './redux/complaintsSlice';
import AIAssistantPanel from './components/AIAssistantPanel';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import { fetchSettings } from './redux/settingsSlice';
import { fetchNotificationsThunk, addNotificationFromSocket } from './redux/notificationsSlice';
import {
  Layout,
  Menu,
  Card,
  Statistic,
  Row,
  Col,
  Avatar,
  Badge,
  Typography,
  Space,
  ConfigProvider,
  theme,
  Progress,
  List,
  Tag,
  Table,
  Button,
  Input,
  Drawer,
  Modal,
  Form,
  Select,
  Descriptions,
  Divider,
  message,
  Upload,
  DatePicker,
  notification
} from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  RobotOutlined,
  BarChartOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  ArrowUpOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  UploadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

function AppContent() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('1');
  const [searchText, setSearchText] = useState('');
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [form] = Form.useForm();

  // Inline editing states for drawer quick-edit
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [inlineBatch, setInlineBatch] = useState('');
  const [inlineMfgDate, setInlineMfgDate] = useState(null);
  const [inlineDesc, setInlineDesc] = useState('');

  // Sandbox parser states
  const [sandboxText, setSandboxText] = useState('');
  const [isSandboxAnalyzing, setIsSandboxAnalyzing] = useState(false);
  const [sandboxResult, setSandboxResult] = useState(null);

  // Connect to Redux store
  const complaints = useSelector((state) => state.complaints.list);
  const dispatch = useDispatch();
  const settingsData = useSelector((state) => state.settings.data);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);
  const activeComplaintId = useSelector((state) => state.complaints.activeComplaintId);

  useEffect(() => {
    dispatch(fetchSettings());
    dispatch(fetchComplaints());
  }, [dispatch]);

  // Fetch notifications and set up 30-second poll interval
  useEffect(() => {
    dispatch(fetchNotificationsThunk());
    const interval = setInterval(() => {
      dispatch(fetchNotificationsThunk());
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Set up WebSocket connection for real-time notification dispatches
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/notifications');
    ws.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data);
        if (messageData.event === 'new_notification') {
          const payload = messageData.data;
          dispatch(addNotificationFromSocket(payload));
          notification.info({
            message: payload.title,
            description: payload.message,
            icon: getNotificationIcon(payload.type),
            placement: 'topRight',
            duration: 5,
          });
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };
    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
    return () => {
      ws.close();
    };
  }, [dispatch]);

  // Navigate to complaint details drawer when notification link clicked
  useEffect(() => {
    if (activeComplaintId) {
      const comp = complaints.find(c => c.id === activeComplaintId);
      if (comp) {
        setSelectedKey('2'); // Switch to Customer Complaints Tab
        handleOpenDetail(comp); // Open detail drawer
        dispatch(setActiveComplaintId(null));
      }
    }
  }, [activeComplaintId, complaints, dispatch]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_complaint':
        return <FileTextOutlined style={{ color: '#3b82f6' }} />;
      case 'assigned':
        return <UserOutlined style={{ color: '#10b981' }} />;
      case 'updated':
        return <EditOutlined style={{ color: '#6366f1' }} />;
      case 'closed':
        return <CheckCircleOutlined style={{ color: '#10b981' }} />;
      case 'high_risk':
        return <WarningOutlined style={{ color: '#f59e0b' }} />;
      case 'critical':
        return <AlertOutlined style={{ color: '#ef4444' }} />;
      default:
        return <BellOutlined style={{ color: '#9ca3af' }} />;
    }
  };

  const isDark = settingsData.theme_mode === 'dark';
  const themeColors = {
    bgBase: isDark ? '#0b0f19' : '#f8fafc',
    bgContainer: isDark ? '#151b2c' : '#ffffff',
    bgHeaderSider: isDark ? '#111827' : '#ffffff',
    border: isDark ? '#1f2937' : '#e2e8f0',
    textMain: isDark ? '#ffffff' : '#0f172a',
    textSub: isDark ? '#9ca3af' : '#475569',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    cardBorder: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    activeBg: isDark ? '#1e293b' : '#f1f5f9'
  };

  // QA Assistant Validation Rules Engine
  const getQAAnalysis = (complaint) => {
    if (!complaint) return { suggestions: [], risk: 'Low', suggestedPriority: 'Low', hasIssues: false };
    
    const suggestions = [];
    
    // 1. Missing Batch Number
    const isMissingBatch = !complaint.batch || complaint.batch.trim() === '' || complaint.batch === 'N/A' || complaint.batch === 'None';
    if (isMissingBatch) {
      suggestions.push('Missing Batch Number');
    }

    // 2. Missing Manufacturing Date
    const isMissingMfgDate = !complaint.mfgDate;
    if (isMissingMfgDate) {
      suggestions.push('Missing Manufacturing Date');
    }

    // 3. Complaint not complete
    const isDescriptionShort = !complaint.description || complaint.description.trim().length < 50;
    if (isDescriptionShort) {
      suggestions.push('Complaint not complete');
    }

    let risk = complaint.risk || 'Low';
    let suggestedPriority = risk;

    // Escalation: High/Critical risk + QA issues = Critical Priority
    if ((risk === 'High' || risk === 'Critical') && (isMissingBatch || isMissingMfgDate || isDescriptionShort)) {
      suggestedPriority = 'Critical';
    } else if (risk === 'Critical') {
      suggestedPriority = 'Critical';
    }

    return {
      suggestions,
      risk,
      suggestedPriority,
      hasIssues: suggestions.length > 0
    };
  };

  // Open drawer helper that handles inline state initialization
  const handleOpenDetail = (record) => {
    setSelectedComplaint(record);
    setInlineBatch(record.batch || '');
    setInlineMfgDate(record.mfgDate ? dayjs(record.mfgDate) : null);
    setInlineDesc(record.description || '');
    setIsInlineEditing(false);
    setIsDetailDrawerOpen(true);
  };

  // Sidebar Menu Items
  const menuItems = [
    { key: '1', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '2', icon: <FileTextOutlined />, label: 'Customer Complaints' },
    { key: '3', icon: <RobotOutlined />, label: 'AI Copilot' },
    { key: '4', icon: <BarChartOutlined />, label: 'Reports' },
    { key: '5', icon: <SettingOutlined />, label: 'Settings' },
    { key: '6', icon: <BellOutlined />, label: (
        <Space>
          Notifications
          {unreadCount > 0 && <Badge count={unreadCount} style={{ backgroundColor: '#ef4444' }} />}
        </Space>
      ) 
    }
  ];

  // Filtering complaints by search text
  const filteredComplaints = complaints.filter(
    item =>
      item.id.toLowerCase().includes(searchText.toLowerCase()) ||
      item.product.toLowerCase().includes(searchText.toLowerCase()) ||
      item.customer.toLowerCase().includes(searchText.toLowerCase()) ||
      item.batch.toLowerCase().includes(searchText.toLowerCase())
  );

  // Statistics calculation
  const totalCount = complaints.length;
  const openCount = complaints.filter(c => c.status === 'Open').length;
  const inReviewCount = complaints.filter(c => c.status === 'In Review').length;
  const criticalCount = complaints.filter(c => c.risk === 'Critical').length;
  const highCount = complaints.filter(c => c.risk === 'High').length;
  const closedCount = complaints.filter(c => c.status === 'Closed').length;

  // Recent complaints subset
  const recentHighRisk = complaints.filter(c => c.risk === 'High' || c.risk === 'Critical').slice(0, 3);

  // Handle adding new complaint with AI Analysis Simulation
  const handleCreateComplaint = (values) => {
    const newId = `CMP-00${20 + complaints.length + 1}`;
    
    // Simulate AI risk classification based on category and description keywords
    let autoRisk = 'Low';
    const descLower = (values.description || '').toLowerCase();
    const catLower = (values.category || '').toLowerCase();
    if (
      descLower.includes('rash') || 
      descLower.includes('discomfort') || 
      descLower.includes('adverse') || 
      descLower.includes('hospital') || 
      catLower.includes('reaction') || 
      catLower.includes('contamination')
    ) {
      autoRisk = 'Critical';
    } else if (
      descLower.includes('cracked') || 
      descLower.includes('smell') || 
      descLower.includes('odor') || 
      descLower.includes('missing') ||
      catLower.includes('efficacy') ||
      descLower.includes('bad')
    ) {
      autoRisk = 'High';
    } else if (
      descLower.includes('discoloration') || 
      catLower.includes('packaging')
    ) {
      autoRisk = 'Medium';
    }

    const newComplaint = {
      key: String(complaints.length + 1),
      id: newId,
      product: `${values.product} ${values.strength || ''}`.trim(),
      batch: values.batch || '',
      customer: values.customer,
      risk: autoRisk,
      status: 'Open',
      date: new Date().toISOString().split('T')[0],
      description: values.description,
      reporter: values.customer,
      contact: values.email,
      qty: 100, // mock quantity
      company: values.company,
      mfgDate: values.mfgDate ? values.mfgDate.format('YYYY-MM-DD') : null,
      expDate: values.expDate ? values.expDate.format('YYYY-MM-DD') : null,
      category: values.category
    };

    // Simulate AI loading state before appending
    const hide = message.loading('AI Copilot is analyzing complaint text, metadata and files...', 0);
    
    setTimeout(() => {
      hide();
      dispatch(saveComplaint(newComplaint));
      setIsNewDrawerOpen(false);
      form.resetFields();

      // Run QA validation to display dynamic findings on modal completion
      const qa = getQAAnalysis(newComplaint);

      // Show professional AI assessment report
      Modal.success({
        title: <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>AI Audit Assessment Complete</span>,
        width: 520,
        content: (
          <div style={{ marginTop: 12 }}>
            <p style={{ color: '#cbd5e1' }}>
              The AI natural language router has completed standard triage of the submitted ticket:
            </p>
            <Divider style={{ margin: '12px 0', borderColor: '#1f2937' }} />
            <Descriptions column={1} size="small" labelStyle={{ color: '#9ca3af', fontWeight: 500 }} contentStyle={{ color: '#fff' }}>
              <Descriptions.Item label="Generated Ticket ID">{newId}</Descriptions.Item>
              <Descriptions.Item label="Mapped Product">{newComplaint.product}</Descriptions.Item>
              <Descriptions.Item label="Identified Batch">{newComplaint.batch || <span style={{ color: '#f87171' }}>None Provided</span>}</Descriptions.Item>
              <Descriptions.Item label="AI Category Map">{values.category}</Descriptions.Item>
              <Descriptions.Item label="Classified Risk">
                <Tag color={autoRisk === 'Critical' ? 'red' : autoRisk === 'High' ? 'orange' : autoRisk === 'Medium' ? 'blue' : 'green'} style={{ fontWeight: 600 }}>
                  {autoRisk.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            {qa.hasIssues && (
              <>
                <Divider style={{ margin: '12px 0', borderColor: '#1f2937' }} />
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <Text strong style={{ color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <WarningOutlined /> QA Warnings Flagged:
                  </Text>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', color: '#fca5a5', fontSize: 12 }}>
                    {qa.suggestions.map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#fca5a5' }}>
                    Suggested Priority: <Tag color="red" style={{ fontWeight: 600, fontSize: 11 }}>{qa.suggestedPriority.toUpperCase()}</Tag>
                  </div>
                </div>
              </>
            )}
            <Divider style={{ margin: '12px 0', borderColor: '#1f2937' }} />
            <div style={{ background: '#111827', padding: '12px', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <Text strong style={{ color: '#6366f1', fontSize: 12 }}>Automated Workflow Recommendation:</Text>
              <p style={{ margin: '4px 0 0 0', fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>
                Quality defect logs have been initialized. Internal notification dispatched to manufacturing plant QA lead for batch {newComplaint.batch || 'N/A'}. {qa.hasIssues ? 'Action required to resolve missing parameters.' : ''}
              </p>
            </div>
          </div>
        ),
        okText: 'Acknowledge & Save',
      });
    }, 1500); // 1.5s simulated network delay
  };



  // Ant Design Table Columns for Complaints
  const columns = [
    {
      title: 'Complaint ID',
      dataIndex: 'id',
      key: 'id',
      render: (text, record) => (
        <Text
          strong
          style={{ color: '#6366f1', cursor: 'pointer' }}
          onClick={() => handleOpenDetail(record)}
        >
          {text}
        </Text>
      )
    },
    {
      title: 'Product Name',
      dataIndex: 'product',
      key: 'product',
      sorter: (a, b) => a.product.localeCompare(b.product)
    },
    {
      title: 'Batch Number',
      dataIndex: 'batch',
      key: 'batch'
    },
    {
      title: 'Customer Name',
      dataIndex: 'customer',
      key: 'customer',
      sorter: (a, b) => a.customer.localeCompare(b.customer)
    },
    {
      title: 'Risk Level',
      dataIndex: 'risk',
      key: 'risk',
      filters: [
        { text: 'Critical', value: 'Critical' },
        { text: 'High', value: 'High' },
        { text: 'Medium', value: 'Medium' },
        { text: 'Low', value: 'Low' }
      ],
      onFilter: (value, record) => record.risk === value,
      render: (risk) => {
        let color = 'green';
        if (risk === 'Critical') color = 'red';
        else if (risk === 'High') color = 'orange';
        else if (risk === 'Medium') color = 'blue';
        return (
          <Tag color={color} style={{ fontWeight: 600 }}>
            {risk.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Open', value: 'Open' },
        { text: 'In Review', value: 'In Review' },
        { text: 'Closed', value: 'Closed' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        let color = 'gold';
        if (status === 'Open') color = 'cyan';
        else if (status === 'Closed') color = 'success';
        return (
          <Tag color={color} style={{ borderRadius: '6px' }}>
            {status}
          </Tag>
        );
      }
    },
    {
      title: 'Created Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date)
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleOpenDetail(record)}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: settingsData.theme_mode === 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm,
        token: {
          colorPrimary: '#6366f1', // Indigo
          colorBgBase: themeColors.bgBase,
          colorBgContainer: themeColors.bgContainer,
          borderRadius: 12,
          fontFamily: 'Outfit, Inter, system-ui, -apple-system, sans-serif',
        },
        components: {
          Layout: {
            headerBg: themeColors.bgHeaderSider,
            siderBg: themeColors.bgHeaderSider,
          },
          Menu: {
            itemBg: themeColors.bgHeaderSider,
            itemSelectedBg: themeColors.activeBg,
          }
        }
      }}
    >
      <Layout style={{ minHeight: '100vh', height: '100vh', overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={260}
          theme={settingsData.theme_mode === 'dark' ? 'dark' : 'light'}
          style={{
            borderRight: `1px solid ${themeColors.border}`,
            boxShadow: '4px 0 24px rgba(0,0,0,0.15)'
          }}
        >
          {/* Logo Section */}
          <div style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            padding: collapsed ? '0 24px' : '0 20px',
            borderBottom: `1px solid ${themeColors.border}`,
            background: themeColors.bgHeaderSider,
            gap: 12,
            transition: 'all 0.2s'
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#fff',
              fontSize: 16,
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
            }}>
              A
            </div>
            {!collapsed && (
              <Title level={4} style={{ margin: 0, background: settingsData.theme_mode === 'dark' ? 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)' : 'linear-gradient(135deg, #0f172a 0%, #475569 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Antigravity AI
              </Title>
            )}
          </div>

          {/* Navigation Menu */}
          <Menu
            theme={settingsData.theme_mode === 'dark' ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => setSelectedKey(key)}
            style={{
              paddingTop: 16,
              borderRight: 0
            }}
          />
        </Sider>

        {/* Main Layout Area */}
        <Layout style={{ overflow: 'hidden' }}>
          {/* Header */}
          <Header style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${themeColors.border}`,
            background: themeColors.bgHeaderSider,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            zIndex: 10
          }}>
            <Space size={16}>
              {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                className: 'trigger',
                onClick: () => setCollapsed(!collapsed),
                style: {
                  fontSize: 18,
                  cursor: 'pointer',
                  color: '#9ca3af',
                  transition: 'color 0.2s',
                  padding: '8px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.03)'
                }
              })}
              <Title level={4} style={{ margin: 0, fontWeight: 500, color: themeColors.textMain }}>
                AI Customer Complaint Management System
              </Title>
            </Space>

            <Space size={20}>
              <Badge count={unreadCount} overflowCount={99} style={{ boxShadow: 'none' }}>
                <Avatar
                  icon={<BellOutlined />}
                  onClick={() => setSelectedKey('6')}
                  style={{
                    backgroundColor: settingsData.theme_mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    color: themeColors.textSub
                  }}
                />
              </Badge>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  src={settingsData.profile_pic}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    verticalAlign: 'middle'
                  }}
                  size="large"
                >
                  {!settingsData.profile_pic && (settingsData.name ? settingsData.name.split(' ').map(n=>n[0]).join('').toUpperCase() : 'RM')}
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <Text strong style={{ color: themeColors.textMain, fontSize: 13 }}>{settingsData.name || 'Ravi M'}</Text>
                  <Text type="secondary" style={{ fontSize: 11, color: themeColors.textSub }}>{settingsData.role || 'Administrator'}</Text>
                </div>
              </Space>
            </Space>
          </Header>

          {/* Content Area */}
          <Content style={{
            padding: '24px',
            overflowY: 'auto',
            background: themeColors.bgBase
          }}>
            {selectedKey === '1' && (
              /* Dashboard View */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Header Welcome Title */}
                <div>
                  <Title level={2} style={{ margin: 0, fontWeight: 600, color: '#fff' }}>
                    Welcome back, Ravi
                  </Title>
                  <Text type="secondary" style={{ color: '#9ca3af' }}>
                    Here's an overview of the customer complaint tickets and AI routing tasks.
                  </Text>
                </div>

                {/* Top Row Statistics Cards */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} xl={6}>
                    <Card bordered={false} style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #151b2c 100%)', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                      <Statistic
                        title={<span style={{ color: '#9ca3af', fontSize: 14 }}>Total Complaints</span>}
                        value={totalCount}
                        valueStyle={{ color: '#fff', fontWeight: 700, fontSize: 28 }}
                        prefix={<FolderOpenOutlined style={{ color: '#6366f1', marginRight: 8 }} />}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="success" style={{ fontSize: 12 }}>
                          <ArrowUpOutlined /> +12%
                        </Text>
                        <Text style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>from last month</Text>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} xl={6}>
                    <Card bordered={false} style={{ border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                      <Statistic
                        title={<span style={{ color: '#9ca3af', fontSize: 14 }}>Open Complaints</span>}
                        value={openCount}
                        valueStyle={{ color: '#f59e0b', fontWeight: 700, fontSize: 28 }}
                        prefix={<ClockCircleOutlined style={{ color: '#f59e0b', marginRight: 8 }} />}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="warning" style={{ fontSize: 12, color: '#f59e0b' }}>
                          {inReviewCount} In-Review
                        </Text>
                        <Text style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>tickets currently active</Text>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} xl={6}>
                    <Card bordered={false} style={{ border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                      <Statistic
                        title={<span style={{ color: '#9ca3af', fontSize: 14 }}>High Risk Complaints</span>}
                        value={criticalCount + highCount}
                        valueStyle={{ color: '#ef4444', fontWeight: 700, fontSize: 28 }}
                        prefix={<WarningOutlined style={{ color: '#ef4444', marginRight: 8 }} />}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="danger" style={{ fontSize: 12, color: '#ef4444' }}>
                          {criticalCount} Critical
                        </Text>
                        <Text style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>require priority review</Text>
                      </div>
                    </Card>
                  </Col>

                  <Col xs={24} sm={12} xl={6}>
                    <Card bordered={false} style={{ border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      <Statistic
                        title={<span style={{ color: '#9ca3af', fontSize: 14 }}>Closed Complaints</span>}
                        value={closedCount}
                        valueStyle={{ color: '#10b981', fontWeight: 700, fontSize: 28 }}
                        prefix={<CheckCircleOutlined style={{ color: '#10b981', marginRight: 8 }} />}
                      />
                      <div style={{ marginTop: 8 }}>
                        <Text type="success" style={{ fontSize: 12, color: '#10b981' }}>
                          {((closedCount / totalCount) * 100).toFixed(1)}% Rate
                        </Text>
                        <Text style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>resolution efficiency</Text>
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* Graphs and Detailed Panel */}
                <Row gutter={[16, 16]}>
                  {/* Trend Chart (Placeholder Card Styled Elegantly) */}
                  <Col xs={24} lg={16}>
                    <Card
                      title={<span style={{ color: '#fff', fontWeight: 600 }}>Complaint Trend Chart</span>}
                      bordered={false}
                      extra={<Text type="secondary">Last 30 Days</Text>}
                    >
                      <div style={{ height: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '10px 0' }}>
                        {/* Custom SVG Mock Chart */}
                        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                          <svg viewBox="0 0 500 150" width="100%" height="100%" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0"/>
                              </linearGradient>
                            </defs>
                            {/* Grid Lines */}
                            <line x1="0" y1="30" x2="500" y2="30" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="5,5" />
                            <line x1="0" y1="75" x2="500" y2="75" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="5,5" />
                            <line x1="0" y1="120" x2="500" y2="120" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="5,5" />
                            {/* Line path */}
                            <path d="M 0 100 Q 50 120 100 80 T 200 40 T 300 90 T 400 30 T 500 50 L 500 150 L 0 150 Z" fill="url(#chartGrad)" />
                            <path d="M 0 100 Q 50 120 100 80 T 200 40 T 300 90 T 400 30 T 500 50" fill="none" stroke="#6366f1" strokeWidth="3" />
                            {/* Data Nodes */}
                            <circle cx="200" cy="40" r="5" fill="#6366f1" stroke="#fff" strokeWidth="2" />
                            <circle cx="400" cy="30" r="5" fill="#6366f1" stroke="#fff" strokeWidth="2" />
                          </svg>
                        </div>
                        {/* Timeline Labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, color: '#64748b', fontSize: 11 }}>
                          <span>Jul 01</span>
                          <span>Jul 08</span>
                          <span>Jul 15</span>
                          <span>Jul 22</span>
                          <span>Jul 28</span>
                        </div>
                      </div>
                    </Card>
                  </Col>

                  {/* Risk Distribution Card */}
                  <Col xs={24} lg={8}>
                    <Card title={<span style={{ color: '#fff', fontWeight: 600 }}>Risk Distribution Chart</span>} bordered={false}>
                      <div style={{ height: 260, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: '#ef4444' }}>Critical Risk</Text>
                            <Text strong>{((criticalCount / totalCount) * 100).toFixed(0)}% ({criticalCount} tickets)</Text>
                          </div>
                          <Progress percent={Math.round((criticalCount / totalCount) * 100)} strokeColor="#ef4444" showInfo={false} size="small" />
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: '#f59e0b' }}>High Risk</Text>
                            <Text strong>{((highCount / totalCount) * 100).toFixed(0)}% ({highCount} tickets)</Text>
                          </div>
                          <Progress percent={Math.round((highCount / totalCount) * 100)} strokeColor="#f59e0b" showInfo={false} size="small" />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: '#3b82f6' }}>Medium Risk</Text>
                            <Text strong>{((complaints.filter(c => c.risk === 'Medium').length / totalCount) * 100).toFixed(0)}% ({complaints.filter(c => c.risk === 'Medium').length} tickets)</Text>
                          </div>
                          <Progress percent={Math.round((complaints.filter(c => c.risk === 'Medium').length / totalCount) * 100)} strokeColor="#3b82f6" showInfo={false} size="small" />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: '#10b981' }}>Low Risk</Text>
                            <Text strong>{((complaints.filter(c => c.risk === 'Low').length / totalCount) * 100).toFixed(0)}% ({complaints.filter(c => c.risk === 'Low').length} tickets)</Text>
                          </div>
                          <Progress percent={Math.round((complaints.filter(c => c.risk === 'Low').length / totalCount) * 100)} strokeColor="#10b981" showInfo={false} size="small" />
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* Additional Component Row: High Risk Alerts */}
                <Card title={<span style={{ color: '#fff', fontWeight: 600 }}>High-Risk Complaints Flagged by AI</span>} bordered={false}>
                  <List
                    dataSource={recentHighRisk}
                    renderItem={item => (
                      <List.Item
                        style={{ borderBottom: '1px solid #1f2937' }}
                        actions={[
                          <Text type="secondary">{item.date}</Text>, 
                          <Button 
                            type="link" 
                            onClick={() => handleOpenDetail(item)}
                          >
                            Review
                          </Button>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                              <WarningOutlined style={{ color: '#ef4444' }} />
                            </Avatar>
                          }
                          title={<span style={{ color: '#fff', fontWeight: 500 }}>{item.customer} ({item.id})</span>}
                          description={<span style={{ color: '#9ca3af' }}>{item.product} • Flagged as <strong>{item.risk} Risk</strong> • Batch {item.batch}</span>}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </div>
            )}

            {selectedKey === '2' && (
              /* Customer Complaints Module Page */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Header Action Row */}
                <Row justify="space-between" align="middle">
                  <Col>
                    <Title level={2} style={{ margin: 0, fontWeight: 600, color: '#fff' }}>
                      Customer Complaints
                    </Title>
                    <Text type="secondary" style={{ color: '#9ca3af' }}>
                      Overview and operations on pharmaceutical quality defect complaint reports.
                    </Text>
                  </Col>
                  <Col>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      size="large"
                      onClick={() => setIsNewDrawerOpen(true)}
                    >
                      New Complaint
                    </Button>
                  </Col>
                </Row>

                {/* Search / Filter Row */}
                <Card bordered={false} style={{ marginBottom: 8 }}>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Input
                        placeholder="Search by ID, Product Name, Customer, or Batch..."
                        prefix={<SearchOutlined style={{ color: '#64748b' }} />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        allowClear
                        size="large"
                      />
                    </Col>
                  </Row>
                </Card>

                {/* Complaints Table */}
                <Card bordered={false} bodyStyle={{ padding: 0 }}>
                  <Table
                    columns={columns}
                    dataSource={filteredComplaints}
                    rowKey="key"
                    pagination={{ pageSize: 8, showSizeChanger: true }}
                    style={{ background: '#151b2c' }}
                  />
                </Card>
              </div>
            )}

            {selectedKey === '3' && <AIAssistantPanel />}
            {selectedKey === '4' && <Reports />}
            {selectedKey === '5' && <Settings />}
            {selectedKey === '6' && <Notifications />}

            {selectedKey !== '1' && selectedKey !== '2' && selectedKey !== '3' && selectedKey !== '4' && selectedKey !== '5' && selectedKey !== '6' && (
              /* Other Pages Placeholder */
              <Card bordered={false} style={{ textAlign: 'center', padding: '60px 0', background: themeColors.bgContainer }}>
                <RobotOutlined style={{ fontSize: 64, color: '#6366f1', marginBottom: 20 }} />
                <Title level={3} style={{ color: themeColors.textMain }}>
                  {menuItems.find(item => item.key === selectedKey)?.label}
                </Title>
                <Text type="secondary" style={{ color: themeColors.textSub }}>
                  This page component is currently empty. Routing integration and AI copilot agents are next in queue.
                </Text>
              </Card>
            )}
          </Content>
        </Layout>
      </Layout>

      {/* New Complaint Drawer */}
      <Drawer
        title={
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
            New Complaint Registration
          </span>
        }
        placement="right"
        width={640}
        onClose={() => setIsNewDrawerOpen(false)}
        open={isNewDrawerOpen}
        destroyOnClose
        footer={
          <div style={{ textAlign: 'right', padding: '10px 16px', borderTop: '1px solid #1f2937' }}>
            <Space>
              <Button onClick={() => setIsNewDrawerOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                icon={<RobotOutlined />}
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 0 }}
              >
                AI Analyze Complaint
              </Button>
            </Space>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateComplaint}
          style={{ marginTop: 16 }}
        >
          {/* Quick-Fill Testing Sandbox Templates */}
          <div style={{ 
            background: 'rgba(99, 102, 241, 0.05)', 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: 20, 
            border: '1px dashed rgba(99, 102, 241, 0.25)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ThunderboltOutlined style={{ color: '#818cf8', fontSize: 16 }} />
              <Text strong style={{ color: '#818cf8', fontSize: 13 }}>
                QA Assistant Testing Sandbox
              </Text>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>
              Instantly fill the form with custom test scenarios to trigger the QA Assistant verification logic.
            </p>
            <Space wrap>
              <Button 
                size="small" 
                onClick={() => {
                  form.setFieldsValue({
                    customer: 'Care Pharmacy',
                    email: 'jsmith@carepharmacy.org',
                    company: 'Care Pharmacy Retailer',
                    product: 'Ibuprofen Tablets',
                    strength: '400mg',
                    category: 'Quality Defect',
                    batch: '',
                    mfgDate: null,
                    expDate: null,
                    description: 'Bad tablets.'
                  });
                  message.success('Loaded Incomplete High-Risk Scenario!');
                }}
                style={{ fontSize: 11 }}
              >
                Load Incomplete High-Risk Ticket
              </Button>
              <Button 
                size="small" 
                onClick={() => {
                  form.setFieldsValue({
                    customer: 'Wellness Center Retail',
                    email: 'm.henderson@wellnesscenter.com',
                    company: 'Wellness Center',
                    product: 'Vitamin C Tablets',
                    strength: '100mg',
                    category: 'Quality Defect',
                    batch: 'VTC100-2405',
                    mfgDate: dayjs('2026-05-20'),
                    expDate: dayjs('2028-05-20'),
                    description: 'Customer returned bottle due to missing desiccant pouch inside. No visible product deterioration or defects.'
                  });
                  message.success('Loaded Complete Clean Ticket!');
                }}
                style={{ fontSize: 11 }}
              >
                Load Complete Clean Ticket
              </Button>
            </Space>
          </div>
          {/* Section 1: Customer Information */}
          <Title level={5} style={{ color: '#6366f1', marginBottom: 16 }}>1. Customer Details</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customer"
                label="Customer Name"
                rules={[{ required: true, message: 'Please enter customer name' }]}
              >
                <Input placeholder="e.g. Dr. Jane Doe" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Customer Email"
                rules={[
                  { required: true, message: 'Please enter customer email' },
                  { type: 'email', message: 'Please enter a valid email address' }
                ]}
              >
                <Input placeholder="e.g. j.doe@clinic.org" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="company"
            label="Company / Facility Name"
            rules={[{ required: true, message: 'Please enter company or facility name' }]}
          >
            <Input placeholder="e.g. Mayo Clinic Pharmacy" />
          </Form.Item>

          <Divider style={{ borderColor: '#1f2937' }} />

          {/* Section 2: Product & Batch Information */}
          <Title level={5} style={{ color: '#6366f1', marginBottom: 16 }}>2. Product & Batch Details</Title>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="product"
                label="Product Name"
                rules={[{ required: true, message: 'Please select a product' }]}
              >
                <Select placeholder="Select a product">
                  <Select.Option value="Paracetamol">Paracetamol</Select.Option>
                  <Select.Option value="Amoxicillin Capsules">Amoxicillin Capsules</Select.Option>
                  <Select.Option value="Vitamin C Tablets">Vitamin C Tablets</Select.Option>
                  <Select.Option value="Ibuprofen Tablets">Ibuprofen Tablets</Select.Option>
                  <Select.Option value="Metformin">Metformin</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="strength"
                label="Product Strength"
                rules={[{ required: true, message: 'Please enter strength' }]}
              >
                <Input placeholder="e.g. 500mg" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="batch"
                label="Batch Number (Optional)"
                rules={[]}
              >
                <Input placeholder="e.g. BAT-2401" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="mfgDate"
                label="Mfg Date (Optional)"
                rules={[]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="expDate"
                label="Exp Date (Optional)"
                rules={[]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ borderColor: '#1f2937' }} />

          {/* Section 3: Complaint Narrative */}
          <Title level={5} style={{ color: '#6366f1', marginBottom: 16 }}>3. Complaint Case Triage</Title>
          <Form.Item
            name="category"
            label="Complaint Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select complaint category">
              <Select.Option value="Quality Defect">Quality Defect (Color/Odour/Texture)</Select.Option>
              <Select.Option value="Packaging Damage">Packaging / Label Damage</Select.Option>
              <Select.Option value="Inefficacy">Inefficacy (Drug not working)</Select.Option>
              <Select.Option value="Contamination">Potential Product Contamination</Select.Option>
              <Select.Option value="Adverse Reaction">Adverse Drug Reaction / Side Effect</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Complaint Description Narrative"
            rules={[{ required: true, message: 'Please enter complaint description' }]}
          >
            <Input.TextArea rows={4} placeholder="Provide details on tablet cracks, capsule damage, odor or medical symptoms..." />
          </Form.Item>

          <Divider style={{ borderColor: '#1f2937' }} />

          {/* Section 4: Attachments */}
          <Title level={5} style={{ color: '#6366f1', marginBottom: 16 }}>4. Supporting Attachments</Title>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="pdfFile" label="PDF Documents">
                <Upload accept=".pdf" maxCount={1} beforeUpload={() => false}>
                  <Button icon={<FilePdfOutlined />} style={{ width: '100%' }}>PDF File</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="imageFile" label="Defect Image">
                <Upload accept="image/*" maxCount={1} beforeUpload={() => false} listType="picture">
                  <Button icon={<FileImageOutlined />} style={{ width: '100%' }}>Image</Button>
                </Upload>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="textFile" label="Email / Log File">
                <Upload accept=".txt,.eml,.msg" maxCount={1} beforeUpload={() => false}>
                  <Button icon={<FileTextOutlined />} style={{ width: '100%' }}>Text/Email</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      {/* Complaint Detail Drawer */}
      <Drawer
        title={
          <span style={{ color: '#fff', fontWeight: 600 }}>
            Complaint Profile: {selectedComplaint?.id}
          </span>
        }
        placement="right"
        width={560}
        onClose={() => setIsDetailDrawerOpen(false)}
        open={isDetailDrawerOpen}
        extra={
          <Space>
            {selectedComplaint?.status !== 'Closed' ? (
              <Button
                type="primary"
                onClick={() => {
                  dispatch(updateComplaintBackendThunk({ id: selectedComplaint.id, changes: { status: 'Closed' } }));
                  setSelectedComplaint({ ...selectedComplaint, status: 'Closed' });
                  message.success(`Complaint ${selectedComplaint.id} has been marked as CLOSED.`);
                }}
              >
                Mark Closed
              </Button>
            ) : (
              <Tag color="success">RESOLVED</Tag>
            )}
          </Space>
        }
      >
        {selectedComplaint && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Descriptions title="Overview Details" column={1} bordered size="small" labelStyle={{ width: 150, color: '#9ca3af', background: '#111827' }} contentStyle={{ color: '#fff' }}>
              <Descriptions.Item label="Ticket ID">{selectedComplaint.id}</Descriptions.Item>
              <Descriptions.Item label="Product Name">{selectedComplaint.product}</Descriptions.Item>
              <Descriptions.Item label="Batch Code">{selectedComplaint.batch}</Descriptions.Item>
              <Descriptions.Item label="Defect Quantity">{selectedComplaint.qty} units</Descriptions.Item>
              <Descriptions.Item label="Risk Priority">
                <Tag color={selectedComplaint.risk === 'Critical' ? 'red' : selectedComplaint.risk === 'High' ? 'orange' : selectedComplaint.risk === 'Medium' ? 'blue' : 'green'} style={{ fontWeight: 600 }}>
                  {selectedComplaint.risk.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedComplaint.status === 'Open' ? 'cyan' : selectedComplaint.status === 'Closed' ? 'success' : 'gold'}>
                  {selectedComplaint.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Report Date">{selectedComplaint.date}</Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '8px 0', borderColor: '#1f2937' }} />

            <div style={{ background: '#111827', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <Title level={5} style={{ margin: '0 0 10px 0', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 8 }}>
                <InfoCircleOutlined style={{ color: '#6366f1' }} /> Defect Description Narrative
              </Title>
              <Text style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{selectedComplaint.description}</Text>
            </div>

            <div style={{ background: '#111827', padding: '16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <Title level={5} style={{ margin: '0 0 12px 0', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RobotOutlined style={{ color: '#10b981' }} /> AI Diagnostics & Recommendations
              </Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <Text strong style={{ color: '#818cf8', fontSize: 12, display: 'block', marginBottom: 4 }}>Root Cause Analysis:</Text>
                  <Text style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.5 }}>
                    {selectedComplaint.root_cause || 'No AI Root Cause Analysis recorded. Try running Copilot ingestion.'}
                  </Text>
                </div>
                <div>
                  <Text strong style={{ color: '#10b981', fontSize: 12, display: 'block', marginBottom: 4 }}>Recommended CAPA Action Plan:</Text>
                  <Text style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.5 }}>
                    {selectedComplaint.capa_recommendation || 'No CAPA Recommendations recorded. Try running Copilot ingestion.'}
                  </Text>
                </div>
              </div>
            </div>

            <Divider style={{ margin: '8px 0', borderColor: '#1f2937' }} />

            <Descriptions title="Reporter Information" column={1} bordered size="small" labelStyle={{ width: 150, color: '#9ca3af', background: '#111827' }} contentStyle={{ color: '#fff' }}>
              <Descriptions.Item label="Facility Name">{selectedComplaint.customer}</Descriptions.Item>
              <Descriptions.Item label="Reported By">{selectedComplaint.reporter}</Descriptions.Item>
              <Descriptions.Item label="Contact Email">{selectedComplaint.contact}</Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '8px 0', borderColor: '#1f2937' }} />

            {/* QA Assistant Suggestions Section */}
            <Divider style={{ margin: '8px 0', borderColor: '#1f2937' }} />
            
            {(() => {
              const qa = getQAAnalysis(selectedComplaint);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={5} style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RobotOutlined style={{ color: '#6366f1' }} /> QA Assistant Suggestions
                    </Title>
                    {qa.hasIssues ? (
                      <Badge status="warning" text={<span style={{ color: '#f59e0b', fontSize: 12 }}>Issues Pending</span>} />
                    ) : (
                      <Badge status="success" text={<span style={{ color: '#10b981', fontSize: 12 }}>QA Compliant</span>} />
                    )}
                  </div>
                  
                  <Card 
                    bordered 
                    size="small" 
                    style={{ 
                      background: qa.hasIssues ? 'rgba(245, 158, 11, 0.03)' : 'rgba(16, 185, 129, 0.03)', 
                      borderColor: qa.hasIssues ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)' 
                    }}
                  >
                    {!qa.hasIssues ? (
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <CheckCircleOutlined style={{ color: '#10b981', fontSize: 18 }} />
                        <div>
                          <Text strong style={{ color: '#fff', fontSize: 13 }}>All Quality Assurance Checks Passed</Text>
                          <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#9ca3af' }}>
                            Batch code and manufacturing timeline verified. Narrative is complete.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <Text strong style={{ color: '#f59e0b', fontSize: 12 }}>Recommended Actions / Suggestions:</Text>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                            {qa.suggestions.map((suggestion, index) => (
                              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertOutlined style={{ color: '#ef4444', fontSize: 12 }} />
                                <span style={{ color: '#e5e7eb', fontSize: 12, fontWeight: 500 }}>
                                  {suggestion}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Divider style={{ margin: '8px 0', borderColor: '#1f2937' }} />

                        <Row gutter={16}>
                          <Col span={12}>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>Classified Risk</div>
                            <Tag color={qa.risk === 'Critical' ? 'red' : qa.risk === 'High' ? 'orange' : qa.risk === 'Medium' ? 'blue' : 'green'} style={{ marginTop: 4, fontWeight: 600 }}>
                              {qa.risk.toUpperCase()}
                            </Tag>
                          </Col>
                          <Col span={12}>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>Suggested Priority</div>
                            <Tag color={qa.suggestedPriority === 'Critical' ? 'red' : qa.suggestedPriority === 'High' ? 'orange' : qa.suggestedPriority === 'Medium' ? 'blue' : 'green'} style={{ marginTop: 4, fontWeight: 700, border: qa.suggestedPriority === 'Critical' ? '1px solid #ef4444' : 'none' }}>
                              {qa.suggestedPriority.toUpperCase()}
                            </Tag>
                          </Col>
                        </Row>

                        {!isInlineEditing ? (
                          <Button 
                            type="primary" 
                            size="small" 
                            icon={<EditOutlined />}
                            onClick={() => {
                              setInlineBatch(selectedComplaint.batch || '');
                              setInlineMfgDate(selectedComplaint.mfgDate ? dayjs(selectedComplaint.mfgDate) : null);
                              setInlineDesc(selectedComplaint.description || '');
                              setIsInlineEditing(true);
                            }}
                            style={{ width: 'fit-content', marginTop: 4 }}
                          >
                            Resolve QA Gaps
                          </Button>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 6, border: '1px solid #1f2937' }}>
                            <Text strong style={{ fontSize: 11, color: '#818cf8' }}>Quick Resolution Portal</Text>
                            
                            {/* Batch code editor */}
                            {qa.suggestions.includes('Missing Batch Number') && (
                              <div>
                                <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Add Batch Number:</span>
                                <Input 
                                  size="small" 
                                  placeholder="e.g. PR500-2401" 
                                  value={inlineBatch} 
                                  onChange={(e) => setInlineBatch(e.target.value)} 
                                />
                              </div>
                            )}

                            {/* Mfg date editor */}
                            {qa.suggestions.includes('Missing Manufacturing Date') && (
                              <div>
                                <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Select Manufacturing Date:</span>
                                <DatePicker 
                                  size="small" 
                                  style={{ width: '100%' }} 
                                  value={inlineMfgDate}
                                  onChange={(date) => setInlineMfgDate(date)}
                                />
                              </div>
                            )}

                            {/* Description expander */}
                            {qa.suggestions.includes('Complaint not complete') && (
                              <div>
                                <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Expand Complaint Narrative (min 50 chars):</span>
                                <Input.TextArea 
                                  rows={2} 
                                  size="small" 
                                  placeholder="Provide descriptive clinical details, symptoms, packaging observations..." 
                                  value={inlineDesc} 
                                  onChange={(e) => setInlineDesc(e.target.value)} 
                                />
                              </div>
                            )}

                            <Space style={{ marginTop: 4 }}>
                              <Button 
                                type="primary" 
                                size="small" 
                                icon={<CheckOutlined />}
                                onClick={() => {
                                  dispatch(updateComplaintBackendThunk({
                                    id: selectedComplaint.id,
                                    changes: {
                                      batch: inlineBatch,
                                      mfgDate: inlineMfgDate ? inlineMfgDate.format('YYYY-MM-DD') : selectedComplaint.mfgDate,
                                      description: inlineDesc
                                    }
                                  }));
                                  
                                  // Update selected complaint object locally
                                  const updatedObj = {
                                    ...selectedComplaint,
                                    batch: inlineBatch,
                                    mfgDate: inlineMfgDate ? inlineMfgDate.format('YYYY-MM-DD') : selectedComplaint.mfgDate,
                                    description: inlineDesc
                                  };
                                  setSelectedComplaint(updatedObj);
                                  setIsInlineEditing(false);
                                  message.success('QA parameters updated and re-validated successfully!');
                                }}
                              >
                                Save & Revalidate
                              </Button>
                              <Button 
                                size="small" 
                                icon={<CloseOutlined />}
                                onClick={() => setIsInlineEditing(false)}
                              >
                                Cancel
                              </Button>
                            </Space>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
              );
            })()}

            <Divider style={{ margin: '8px 0', borderColor: '#1f2937' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Title level={5} style={{ margin: 0, color: '#fff' }}>AI Copilot Audit Logs</Title>
              <Card bordered size="small" style={{ background: 'rgba(99, 102, 241, 0.05)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <RobotOutlined style={{ color: '#6366f1', fontSize: 20, marginTop: 4 }} />
                  <div>
                    <Text strong style={{ color: '#fff', fontSize: 13 }}>Agent Audit Routing Engine</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11, color: '#9ca3af' }}>AI Classification Audit • Ran on {selectedComplaint.date}</Text>
                    <p style={{ margin: '8px 0 0 0', color: '#cbd5e1', fontSize: 12 }}>
                      Automated pipeline classified complaint sentiment context as <strong>{selectedComplaint.risk}</strong> and successfully mapped keywords: "{selectedComplaint.product.split(' ')[0]}", "{selectedComplaint.batch ? selectedComplaint.batch.split('-')[0] : 'N/A'}". 
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Drawer>
    </ConfigProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
