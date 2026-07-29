import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Button,
  Table,
  Tag,
  Typography,
  Space,
  Divider,
  message,
  Empty
} from 'antd';
import {
  FilePdfOutlined,
  FileExcelOutlined,
  PrinterOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  BarChartOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { fetchReportsStatistics, setFilter } from '../redux/reportsSlice';
import {
  TrendChart,
  SeverityChart,
  CategoryChart,
  ProductChart,
  MonthlyChart
} from '../components/ChartComponents';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function Reports() {
  const dispatch = useDispatch();
  const reportRef = useRef(null);
  
  // Connect to Redux settings, complaints, and reports slices
  const themeMode = useSelector((state) => state.settings.data.theme_mode);
  const complaintsList = useSelector((state) => state.complaints.list);
  const { statisticsData: stats, filters, loading } = useSelector((state) => state.reports);

  const isDark = themeMode === 'dark';
  const themeColors = {
    bgBase: isDark ? '#0b0f19' : '#f8fafc',
    bgContainer: isDark ? '#151b2c' : '#ffffff',
    border: isDark ? '#1f2937' : '#e2e8f0',
    textMain: isDark ? '#ffffff' : '#0f172a',
    textSub: isDark ? '#9ca3af' : '#475569',
    textMuted: isDark ? '#64748b' : '#94a3b8'
  };

  // Dispatch API action on filter update
  useEffect(() => {
    dispatch(fetchReportsStatistics(filters));
  }, [filters, dispatch]);

  // Extract distinct list of products for dropdown options
  const productOptions = ['All', ...new Set(complaintsList.map(c => c.product.split(' ')[0]))];

  // Apply filters locally for the summary table
  const filteredComplaints = complaintsList.filter(c => {
    if (filters.start_date && c.date < filters.start_date) return false;
    if (filters.end_date && c.date > filters.end_date) return false;
    if (filters.product && filters.product !== 'All' && !c.product.toLowerCase().includes(filters.product.toLowerCase())) return false;
    if (filters.severity && filters.severity !== 'All' && c.risk !== filters.severity) return false;
    if (filters.status && filters.status !== 'All' && c.status !== filters.status) return false;
    return true;
  });

  // Export: Excel (CSV) Download
  const handleExportExcel = () => {
    const headers = [
      'Complaint ID', 'Product', 'Batch Code', 'Customer', 'Risk Level', 
      'Status', 'Date Logged', 'Mfg Date', 'Exp Date', 'Category', 
      'Description', 'Reporter', 'Contact Email', 'Quantity Affected', 'Resolution Date'
    ];
    
    const rows = filteredComplaints.map(c => [
      c.id,
      c.product,
      c.batch || 'N/A',
      c.customer,
      c.risk,
      c.status,
      c.date,
      c.mfgDate || 'N/A',
      c.expDate || 'N/A',
      c.category,
      c.description.replace(/"/g, '""'), // Escape quotes
      c.reporter,
      c.contact,
      c.qty,
      c.resolutionDate || 'N/A'
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AI_QA_Complaints_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Excel-compatible CSV report exported successfully.');
  };

  // Export: PDF Generation
  const handleExportPDF = async () => {
    const element = reportRef.current;
    if (!element) return;
    
    const hide = message.loading('Generating high-resolution PDF report...', 0);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: themeColors.bgBase
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 dimensions in mm
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`AI_QA_Complaints_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      message.success('PDF report downloaded successfully.');
    } catch (err) {
      console.error(err);
      message.error('Failed to generate PDF report.');
    } finally {
      hide();
    }
  };

  // Print Report Layout
  const handlePrint = () => {
    window.print();
  };

  // Table Columns Setup
  const tableColumns = [
    {
      title: 'Complaint ID',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <Text strong style={{ color: '#6366f1' }}>{text}</Text>
    },
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Risk Level',
      dataIndex: 'risk',
      key: 'risk',
      render: (risk) => {
        let color = 'green';
        if (risk === 'Critical') color = 'red';
        else if (risk === 'High') color = 'orange';
        else if (risk === 'Medium') color = 'blue';
        return <Tag color={color} style={{ fontWeight: 600 }}>{risk.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'gold';
        if (status === 'Open') color = 'cyan';
        else if (status === 'Closed') color = 'success';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Date Logged',
      dataIndex: 'date',
      key: 'date',
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header and Print Control Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #reports-print-view, #reports-print-view * {
            visibility: visible;
          }
          #reports-print-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #fff !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Title & Actions Bar */}
      <Row justify="space-between" align="middle" className="no-print">
        <Col>
          <Title level={2} style={{ margin: 0, fontWeight: 600, color: themeColors.textMain }}>
            Analytical Reports
          </Title>
          <Text type="secondary" style={{ color: themeColors.textSub }}>
            Aggregated metrics, severity mapping, and quality distribution charts.
          </Text>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<PrinterOutlined />} 
              onClick={handlePrint}
              disabled={loading}
            >
              Print Report
            </Button>
            <Button 
              icon={<FileExcelOutlined />} 
              onClick={handleExportExcel}
              disabled={loading}
              style={{ color: '#10b981', borderColor: '#10b981' }}
            >
              Export Excel
            </Button>
            <Button 
              type="primary"
              icon={<FilePdfOutlined />} 
              onClick={handleExportPDF}
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 0 }}
            >
              Export PDF
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Filters Card */}
      <Card 
        bordered={false} 
        className="no-print"
        style={{
          background: themeColors.bgContainer,
          border: `1px solid ${themeColors.border}`
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, color: themeColors.textSub, marginBottom: 6 }}>Date Range</div>
            <RangePicker 
              style={{ width: '100%' }}
              onChange={(dates, dateStrings) => {
                dispatch(setFilter({ key: 'start_date', value: dateStrings[0] || null }));
                dispatch(setFilter({ key: 'end_date', value: dateStrings[1] || null }));
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, color: themeColors.textSub, marginBottom: 6 }}>Product</div>
            <Select 
              style={{ width: '100%' }}
              value={filters.product}
              onChange={(val) => dispatch(setFilter({ key: 'product', value: val }))}
            >
              {productOptions.map(prod => (
                <Select.Option key={prod} value={prod}>{prod}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, color: themeColors.textSub, marginBottom: 6 }}>Severity</div>
            <Select 
              style={{ width: '100%' }}
              value={filters.severity}
              onChange={(val) => dispatch(setFilter({ key: 'severity', value: val }))}
            >
              <Select.Option value="All">All</Select.Option>
              <Select.Option value="Critical">Critical</Select.Option>
              <Select.Option value="High">High</Select.Option>
              <Select.Option value="Medium">Medium</Select.Option>
              <Select.Option value="Low">Low</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ fontSize: 12, color: themeColors.textSub, marginBottom: 6 }}>Status</div>
            <Select 
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(val) => dispatch(setFilter({ key: 'status', value: val }))}
            >
              <Select.Option value="All">All All</Select.Option>
              <Select.Option value="Open">Open</Select.Option>
              <Select.Option value="In Review">In Review</Select.Option>
              <Select.Option value="Closed">Closed</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Main Print Wrapper */}
      <div id="reports-print-view" ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 4 }}>
        
        {/* Metric Cards Row */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={12} md={4} style={{ flex: '1' }}>
            <Card bordered={false} style={{ background: themeColors.bgContainer, border: `1px solid ${themeColors.border}` }}>
              <Statistic
                title={<span style={{ color: themeColors.textSub, fontSize: 12 }}>Total Complaints</span>}
                value={stats.total_complaints}
                valueStyle={{ color: themeColors.textMain, fontWeight: 700, fontSize: 24 }}
                prefix={<FolderOpenOutlined style={{ color: '#6366f1', marginRight: 4 }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={4} style={{ flex: '1' }}>
            <Card bordered={false} style={{ border: '1px solid rgba(6, 182, 212, 0.15)', background: themeColors.bgContainer }}>
              <Statistic
                title={<span style={{ color: themeColors.textSub, fontSize: 12 }}>Open Complaints</span>}
                value={stats.open_complaints}
                valueStyle={{ color: '#06b6d4', fontWeight: 700, fontSize: 24 }}
                prefix={<ClockCircleOutlined style={{ color: '#06b6d4', marginRight: 4 }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={4} style={{ flex: '1' }}>
            <Card bordered={false} style={{ border: '1px solid rgba(16, 185, 129, 0.15)', background: themeColors.bgContainer }}>
              <Statistic
                title={<span style={{ color: themeColors.textSub, fontSize: 12 }}>Closed Complaints</span>}
                value={stats.closed_complaints}
                valueStyle={{ color: '#10b981', fontWeight: 700, fontSize: 24 }}
                prefix={<CheckCircleOutlined style={{ color: '#10b981', marginRight: 4 }} />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={4} style={{ flex: '1' }}>
            <Card bordered={false} style={{ border: '1px solid rgba(239, 68, 68, 0.15)', background: themeColors.bgContainer }}>
              <Statistic
                title={<span style={{ color: themeColors.textSub, fontSize: 12 }}>Critical Risk</span>}
                value={stats.critical_complaints}
                valueStyle={{ color: '#ef4444', fontWeight: 700, fontSize: 24 }}
                prefix={<WarningOutlined style={{ color: '#ef4444', marginRight: 4 }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Card bordered={false} style={{ border: `1px solid ${themeColors.border}`, background: themeColors.bgContainer }}>
              <Statistic
                title={<span style={{ color: themeColors.textSub, fontSize: 12 }}>Average Resolution Time</span>}
                value={stats.avg_resolution_time}
                precision={1}
                valueStyle={{ color: themeColors.textMain, fontWeight: 700, fontSize: 24 }}
                prefix={<HistoryOutlined style={{ color: '#a855f7', marginRight: 4 }} />}
                suffix="Days"
              />
            </Card>
          </Col>
        </Row>

        {stats.total_complaints === 0 ? (
          <Card bordered={false} style={{ background: themeColors.bgContainer, padding: '60px 0', textAlign: 'center' }}>
            <Empty description={<span style={{ color: themeColors.textSub }}>No complaints found matching the active filters.</span>} />
          </Card>
        ) : (
          <>
            {/* Visual Analytics Charts Section */}
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Card 
                  title={<span style={{ color: themeColors.textMain, fontWeight: 600 }}><BarChartOutlined /> Inflow Trends</span>} 
                  bordered={false} 
                  style={{ background: themeColors.bgContainer }}
                >
                  <TrendChart data={stats.trends} />
                </Card>
              </Col>
              
              <Col xs={24} lg={8}>
                <Card 
                  title={<span style={{ color: themeColors.textMain, fontWeight: 600 }}>Severity Distribution</span>} 
                  bordered={false} 
                  style={{ background: themeColors.bgContainer }}
                >
                  <SeverityChart data={stats.severity_distribution} />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card 
                  title={<span style={{ color: themeColors.textMain, fontWeight: 600 }}>Complaint Types Mapping</span>} 
                  bordered={false} 
                  style={{ background: themeColors.bgContainer }}
                >
                  <CategoryChart data={stats.complaint_types} />
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card 
                  title={<span style={{ color: themeColors.textMain, fontWeight: 600 }}>Monthly Ticket Ingestion</span>} 
                  bordered={false} 
                  style={{ background: themeColors.bgContainer }}
                >
                  <MonthlyChart data={stats.monthly} />
                </Card>
              </Col>
            </Row>

            <Card 
              title={<span style={{ color: themeColors.textMain, fontWeight: 600 }}>Product Defect Volume</span>} 
              bordered={false} 
              style={{ background: themeColors.bgContainer }}
            >
              <ProductChart data={stats.product_wise} />
            </Card>

            {/* Defect Summary Table */}
            <Card 
              title={<span style={{ color: themeColors.textMain, fontWeight: 600 }}>Filtered Complaints Log</span>} 
              bordered={false} 
              bodyStyle={{ padding: 0 }}
              style={{ background: themeColors.bgContainer }}
            >
              <Table
                dataSource={filteredComplaints}
                columns={tableColumns}
                rowKey="id"
                pagination={{ pageSize: 6 }}
                style={{ background: themeColors.bgContainer }}
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
