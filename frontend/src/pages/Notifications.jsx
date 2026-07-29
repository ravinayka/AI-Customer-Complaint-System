import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  List,
  Button,
  Tag,
  Input,
  Tabs,
  Empty,
  Skeleton,
  Alert,
  Tooltip,
  Typography,
  Space,
  Badge,
  Row,
  Col,
  Divider,
  Popconfirm,
  message
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
  UserOutlined,
  EditOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  AlertOutlined,
  InboxOutlined
} from '@ant-design/icons';
import {
  fetchNotificationsThunk,
  markAsReadThunk,
  markAllReadThunk,
  deleteNotificationThunk
} from '../redux/notificationsSlice';
import { setActiveComplaintId } from '../redux/complaintsSlice';

const { Title, Text, Paragraph } = Typography;

export function getRelativeTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now - date;
  
  if (isNaN(diffMs)) return '';
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 10) {
    return 'Just now';
  }
  if (diffSecs < 60) {
    return `${diffSecs} seconds ago`;
  }
  if (diffMins === 1) {
    return '1 minute ago';
  }
  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  }
  if (diffHours === 1) {
    return '1 hour ago';
  }
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Notifications() {
  const dispatch = useDispatch();
  const { list: notifications, loading, error, unreadCount } = useSelector((state) => state.notifications);
  const settingsData = useSelector((state) => state.settings.data);
  const isDark = settingsData.theme_mode === 'dark';

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'read'
  const [searchText, setSearchText] = useState('');

  // Initial fetch on mount or activeTab changes
  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  const loadNotifications = () => {
    const filters = {};
    if (activeTab === 'unread') {
      filters.is_read = false;
    } else if (activeTab === 'read') {
      filters.is_read = true;
    }
    if (searchText.trim()) {
      filters.search = searchText.trim();
    }
    dispatch(fetchNotificationsThunk(filters));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadNotifications();
  };

  const handleClearSearch = () => {
    setSearchText('');
    const filters = {};
    if (activeTab === 'unread') {
      filters.is_read = false;
    } else if (activeTab === 'read') {
      filters.is_read = true;
    }
    dispatch(fetchNotificationsThunk(filters));
  };

  const handleMarkAsRead = (id) => {
    dispatch(markAsReadThunk(id))
      .unwrap()
      .then(() => {
        message.success('Notification marked as read');
      })
      .catch((err) => {
        message.error(err || 'Failed to update notification');
      });
  };

  const handleMarkAllRead = () => {
    dispatch(markAllReadThunk())
      .unwrap()
      .then((res) => {
        message.success(`Successfully marked all notifications as read`);
      })
      .catch((err) => {
        message.error(err || 'Failed to update notifications');
      });
  };

  const handleDelete = (id) => {
    dispatch(deleteNotificationThunk(id))
      .unwrap()
      .then(() => {
        message.success('Notification deleted successfully');
      })
      .catch((err) => {
        message.error(err || 'Failed to delete notification');
      });
  };

  const handleViewComplaint = (complaintId) => {
    if (complaintId) {
      dispatch(setActiveComplaintId(complaintId));
    }
  };

  const getNotificationIcon = (type) => {
    const iconStyle = { fontSize: 20 };
    switch (type) {
      case 'new_complaint':
        return <FileTextOutlined style={{ ...iconStyle, color: '#3b82f6' }} />;
      case 'assigned':
        return <UserOutlined style={{ ...iconStyle, color: '#10b981' }} />;
      case 'updated':
        return <EditOutlined style={{ ...iconStyle, color: '#6366f1' }} />;
      case 'closed':
        return <CheckCircleOutlined style={{ ...iconStyle, color: '#10b981' }} />;
      case 'high_risk':
        return <WarningOutlined style={{ ...iconStyle, color: '#f59e0b' }} />;
      case 'critical':
        return <AlertOutlined style={{ ...iconStyle, color: '#ef4444' }} />;
      default:
        return <BellOutlined style={{ ...iconStyle, color: '#9ca3af' }} />;
    }
  };

  const getPriorityTag = (priority) => {
    let color = 'default';
    if (priority === 'Critical') color = 'red';
    else if (priority === 'High') color = 'orange';
    else if (priority === 'Medium') color = 'blue';
    else if (priority === 'Low') color = 'cyan';
    
    return (
      <Tag color={color} style={{ fontWeight: 600, fontSize: 10, borderRadius: '4px' }}>
        {priority.toUpperCase()}
      </Tag>
    );
  };

  // Color schemes based on dark/light mode
  const styles = {
    cardBg: isDark ? '#151b2c' : '#ffffff',
    borderColor: isDark ? '#1f2937' : '#e2e8f0',
    itemHoverBg: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
    unreadBg: isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.02)',
    unreadBorder: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title Header Section */}
      <Row justify="space-between" align="middle">
        <Col>
          <Space align="center" size={12}>
            <Title level={2} style={{ margin: 0, fontWeight: 600, color: isDark ? '#fff' : '#0f172a' }}>
              Notifications Hub
            </Title>
            {unreadCount > 0 && (
              <Badge
                count={unreadCount}
                style={{
                  backgroundColor: '#ef4444',
                  boxShadow: 'none',
                  fontWeight: 600,
                  fontSize: 12
                }}
              />
            )}
          </Space>
          <Text type="secondary" style={{ color: isDark ? '#9ca3af' : '#475569' }}>
            Monitor and respond to automated ticket updates, critical alerts, and risk assessments.
          </Text>
        </Col>
        <Col>
          <Space>
            {unreadCount > 0 && (
              <Button
                type="primary"
                ghost
                icon={<CheckOutlined />}
                onClick={handleMarkAllRead}
              >
                Mark All Read
              </Button>
            )}
            <Button
              icon={<ReloadOutlined />}
              onClick={loadNotifications}
            >
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Tabs and Search Filters Card */}
      <Card bordered={false} style={{ background: styles.cardBg, borderColor: styles.borderColor }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col xs={24} md={12}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              style={{ marginBottom: 0 }}
              items={[
                { key: 'all', label: 'All Notifications' },
                { key: 'unread', label: `Unread (${unreadCount})` },
                { key: 'read', label: 'Archived / Read' }
              ]}
            />
          </Col>
          <Col xs={24} md={12}>
            <Form onSubmitCapture={handleSearch}>
              <Input
                placeholder="Search title, description or ticket ID..."
                prefix={<SearchOutlined style={{ color: '#64748b' }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                onClear={handleClearSearch}
                size="middle"
                addonAfter={
                  <Button type="link" size="small" onClick={loadNotifications} style={{ padding: 0, height: 'auto', border: 0 }}>
                    Search
                  </Button>
                }
              />
            </Form>
          </Col>
        </Row>
      </Card>

      {/* Notifications List Container */}
      <Card bordered={false} style={{ background: styles.cardBg, borderColor: styles.borderColor }} bodyStyle={{ padding: '8px 24px' }}>
        {error && (
          <div style={{ margin: '16px 0' }}>
            <Alert
              message="Data Load Failed"
              description={`An error occurred while loading notifications from PostgreSQL: ${error}`}
              type="error"
              showIcon
              action={
                <Button size="small" type="primary" onClick={loadNotifications}>
                  Retry Connection
                </Button>
              }
            />
          </div>
        )}

        {loading ? (
          <div style={{ padding: '20px 0' }}>
            <Skeleton avatar active paragraph={{ rows: 2 }} />
            <Divider style={{ margin: '16px 0', borderColor: styles.borderColor }} />
            <Skeleton avatar active paragraph={{ rows: 2 }} />
            <Divider style={{ margin: '16px 0', borderColor: styles.borderColor }} />
            <Skeleton avatar active paragraph={{ rows: 2 }} />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Space direction="vertical" size={4}>
                  <Text strong style={{ color: isDark ? '#9ca3af' : '#475569', fontSize: 16 }}>No notifications found</Text>
                  <Text type="secondary" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                    {searchText ? 'Try adjusting your search terms or filters.' : 'You are all caught up! There are no messages in this category.'}
                  </Text>
                </Space>
              }
            />
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                style={{
                  borderBottom: `1px solid ${styles.borderColor}`,
                  padding: '16px 12px',
                  borderRadius: '8px',
                  margin: '8px 0',
                  transition: 'all 0.3s ease',
                  background: !item.is_read ? styles.unreadBg : 'transparent',
                  borderLeft: !item.is_read ? `4px solid #6366f1` : '4px solid transparent',
                  boxShadow: !item.is_read ? '0 2px 8px rgba(99, 102, 241, 0.05)' : 'none'
                }}
                className="notification-item"
                actions={[
                  !item.is_read && (
                    <Tooltip title="Mark as Read" key="read">
                      <Button
                        type="text"
                        shape="circle"
                        icon={<CheckOutlined style={{ color: '#10b981' }} />}
                        onClick={() => handleMarkAsRead(item.id)}
                      />
                    </Tooltip>
                  ),
                  <Popconfirm
                    title="Delete Notification"
                    description="Are you sure you want to delete this notification?"
                    onConfirm={() => handleDelete(item.id)}
                    okText="Yes"
                    cancelText="No"
                    placement="topRight"
                    key="delete"
                  >
                    <Tooltip title="Delete">
                      <Button
                        type="text"
                        shape="circle"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Tooltip>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: '10px',
                      background: isDark ? '#111827' : '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${styles.borderColor}`
                    }}>
                      {getNotificationIcon(item.type)}
                    </div>
                  }
                  title={
                    <Space size={8} align="center" style={{ flexWrap: 'wrap' }}>
                      <Text strong style={{ color: isDark ? '#fff' : '#1e293b', fontSize: 14 }}>
                        {item.title}
                      </Text>
                      {getPriorityTag(item.priority)}
                      {!item.is_read && (
                        <Badge status="processing" style={{ marginLeft: 4 }} />
                      )}
                    </Space>
                  }
                  description={
                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Paragraph style={{ color: isDark ? '#cbd5e1' : '#4b5563', margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                        {item.message}
                      </Paragraph>
                      <Space size={16} style={{ marginTop: 4, flexWrap: 'wrap' }}>
                        <Text type="secondary" style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8' }}>
                          {getRelativeTime(item.created_at)}
                        </Text>
                        {item.complaint_id && (
                          <>
                            <span style={{ color: isDark ? '#374151' : '#e5e7eb' }}>•</span>
                            <Button
                              type="link"
                              size="small"
                              style={{ padding: 0, fontSize: 11, fontWeight: 500, height: 'auto', display: 'inline-flex', alignItems: 'center' }}
                              onClick={() => handleViewComplaint(item.complaint_id)}
                            >
                              View Complaint {item.complaint_id}
                            </Button>
                          </>
                        )}
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
