import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import {
  Row,
  Col,
  Card,
  Typography,
  Input,
  Button,
  Upload,
  Progress,
  Tag,
  Badge,
  Form,
  Select,
  DatePicker,
  Divider,
  message,
  List,
  Space
} from 'antd';
import {
  RobotOutlined,
  UploadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SendOutlined,
  PaperClipOutlined,
  EditOutlined,
  SyncOutlined,
  FileTextOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  FilePdfOutlined,
  FileWordOutlined
} from '@ant-design/icons';
import {
  saveComplaint,
  addChatMessage,
  setExtractingStatus,
  setExtractionProgress,
  setExtractionResult,
  updateExtractedField,
  setExtractionSteps,
  setCurrentStepIndex,
  resetExtractionState
} from '../redux/complaintsSlice';
import { analyzeText, analyzeFile } from '../services/api';

const { Title, Text, Paragraph } = Typography;

export default function AIAssistantPanel() {
  const dispatch = useDispatch();
  
  // Redux selectors
  const chatMessages = useSelector((state) => state.complaints.chatMessages);
  const isExtracting = useSelector((state) => state.complaints.isExtracting);
  const extractionProgress = useSelector((state) => state.complaints.extractionProgress);
  const extractionSteps = useSelector((state) => state.complaints.extractionSteps);
  const currentStepIndex = useSelector((state) => state.complaints.currentStepIndex);
  const extractedResult = useSelector((state) => state.complaints.extractedResult);
  const complaintsList = useSelector((state) => state.complaints.list);

  // Local UI states
  const [inputText, setInputText] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isExtracting, currentStepIndex]);

  // Simulate progress bar increments synced with thinking steps
  const startExtractionSimulation = async (apiCallPromise) => {
    dispatch(setExtractingStatus(true));
    dispatch(resetExtractionState());
    dispatch(setExtractionSteps([
      'Reading document...',
      'Extracting data...',
      'Analysing complaint...',
      'Generating response...'
    ]));
    dispatch(setCurrentStepIndex(0));

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 5) + 3;
      if (progress >= 95) {
        progress = 95;
        clearInterval(interval);
      }
      dispatch(setExtractionProgress(progress));
      
      // Update step index based on progress percent
      if (progress < 25) {
        dispatch(setCurrentStepIndex(0));
      } else if (progress < 50) {
        dispatch(setCurrentStepIndex(1));
      } else if (progress < 75) {
        dispatch(setCurrentStepIndex(2));
      } else {
        dispatch(setCurrentStepIndex(3));
      }
    }, 150);

    try {
      const response = await apiCallPromise;
      clearInterval(interval);
      dispatch(setExtractionProgress(100));
      dispatch(setCurrentStepIndex(3));
      
      setTimeout(() => {
        dispatch(setExtractionResult(response));
        dispatch(setExtractingStatus(false));
        
        dispatch(addChatMessage({
          id: String(Date.now()),
          sender: 'assistant',
          text: `Analysis complete! Extracted parameters from the document. Please verify the extracted fields on the right, correct any low confidence values (<80%), and save.`
        }));
      }, 500);
    } catch (err) {
      clearInterval(interval);
      dispatch(setExtractingStatus(false));
      dispatch(resetExtractionState());
      message.error(err.message || 'Error occurred during AI processing.');
      
      dispatch(addChatMessage({
        id: String(Date.now()),
        sender: 'assistant',
        text: `Error analyzing document: ${err.message || 'Unknown processing error'}. Please check if the file format is supported and try again.`
      }));
    }
  };

  // Handle Pasting raw complaint text or chat message
  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userText = inputText;
    setInputText('');

    // Add user query to chat history
    dispatch(addChatMessage({
      id: String(Date.now()),
      sender: 'user',
      text: userText
    }));

    // Trigger analysis backend
    startExtractionSimulation(analyzeText(userText));
  };

  // Handle Drag-and-drop file upload
  const handleFileUpload = (file) => {
    if (!file) return false;
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (extension !== 'pdf') {
      message.error('Unsupported file format! Please upload PDF documents only.');
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('File size exceeds the maximum limit of 10 MB. Please upload a smaller PDF.');
      return false;
    }

    dispatch(addChatMessage({
      id: String(Date.now()),
      sender: 'user',
      text: `Uploaded document: ${file.name}`,
      isFile: true,
      fileName: file.name
    }));

    // Trigger backend upload parsing
    startExtractionSimulation(analyzeFile(file));
    return false; // Prevent Ant Design default POST upload
  };

  // Handle saving the edited ticket to complaints database
  const handleSaveTicket = () => {
    if (!extractedResult) return;

    const data = extractedResult.extractedData;
    const newId = `CMP-00${20 + complaintsList.length + 1}`;
    
    const fullProduct = data.productStrength 
      ? `${data.productName} ${data.productStrength}` 
      : (data.productName || 'Unknown Product');

    const formattedComplaint = {
      key: String(complaintsList.length + 1),
      id: newId,
      product: fullProduct,
      batch: data.batchNumber || 'N/A',
      customer: data.complaintSource || 'AI Ingested Customer',
      risk: data.priority || data.severity || 'Medium',
      status: 'Open',
      date: data.complaintDate || new Date().toISOString().split('T')[0],
      mfgDate: data.manufacturingDate || null,
      expDate: data.expiryDate || null,
      description: data.complaintDescription || 'No description provided.',
      reporter: data.customerName || 'AI Copilot Ingestion',
      contact: 'parsed@complaint-system.ai',
      qty: data.quantityAffected || 0,
      category: data.complaintType || 'Quality Defect',
      root_cause: data.rootCause || '',
      capa_recommendation: data.capa || ''
    };

    dispatch(saveComplaint(formattedComplaint))
      .unwrap()
      .then(() => {
        dispatch(resetExtractionState());
        message.success(`Successfully saved ticket ${newId} into database!`);
      })
      .catch((err) => {
        message.error(`Failed to save complaint: ${err}`);
      });
  };

  // Start inline editing of values
  const startEditing = (field, currentVal) => {
    setEditingField(field);
    setEditValue(currentVal || '');
  };

  // Save inline edit
  const saveInlineEdit = (field) => {
    let parsedVal = editValue;
    if (field === 'quantityAffected') {
      parsedVal = parseInt(editValue) || 0;
    }
    dispatch(updateExtractedField({ field, value: parsedVal }));
    setEditingField(null);
  };

  // Render file icon helper
  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FilePdfOutlined style={{ color: '#ef4444', fontSize: 24 }} />;
    if (ext === 'docx') return <FileWordOutlined style={{ color: '#3b82f6', fontSize: 24 }} />;
    return <FileTextOutlined style={{ color: '#10b981', fontSize: 24 }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Workspace Header */}
      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 600, color: '#fff' }}>
          AI Copilot Assistant
        </Title>
        <Paragraph style={{ color: '#9ca3af', margin: '4px 0 0 0' }}>
          Ingest raw complaint documents, parse fields using LangGraph validation workflow, and audit trace records.
        </Paragraph>
      </div>

      <Row gutter={[20, 20]} style={{ height: 'calc(100vh - 180px)' }}>
        {/* Left Section: AI Chat & Upload Panel (Width: 10/24) */}
        <Col xs={24} lg={10} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card
            bordered={false}
            bodyStyle={{
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
            style={{
              background: '#151b2c',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden'
            }}
          >
            {/* Chat Messages Log */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start'
                  }}
                >
                  {msg.sender === 'assistant' && (
                    <Badge dot color="#6366f1">
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justify: 'center', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <RobotOutlined style={{ fontSize: 16, margin: 'auto' }} />
                      </div>
                    </Badge>
                  )}
                  <div
                    style={{
                      background: msg.sender === 'user' ? '#6366f1' : 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'user' ? '14px 14px 2px 14px' : '2px 14px 14px 14px',
                      border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    {msg.isFile ? (
                      <Space>
                        {getFileIcon(msg.fileName)}
                        <div>
                          <Text strong style={{ color: '#fff', fontSize: 12 }}>{msg.text}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Ready for ingestion</Text>
                        </div>
                      </Space>
                    ) : (
                      <Text style={{ color: '#fff', fontSize: 12, lineHeight: 1.5 }}>{msg.text}</Text>
                    )}
                  </div>
                </div>
              ))}

              {/* Progress and Ingestion Thinking Steps */}
              {isExtracting && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 10, alignItems: 'flex-start', width: '90%' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justify: 'center', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <SyncOutlined spin style={{ fontSize: 14, margin: 'auto' }} />
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px', borderRadius: '4px 14px 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Text strong style={{ color: '#cbd5e1', fontSize: 12 }}>Ingestion Agent Running...</Text>
                    
                    {/* Dynamic Cycling Steps Checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {extractionSteps.map((step, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: idx > currentStepIndex ? 0.35 : 1 }}>
                          {idx < currentStepIndex ? (
                            <CheckCircleOutlined style={{ color: '#10b981', fontSize: 12 }} />
                          ) : idx === currentStepIndex ? (
                            <SyncOutlined spin style={{ color: '#6366f1', fontSize: 12 }} />
                          ) : (
                            <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1px dashed #4b5563' }} />
                          )}
                          <span style={{ fontSize: 11, color: idx === currentStepIndex ? '#818cf8' : '#9ca3af', fontWeight: idx === currentStepIndex ? 600 : 400 }}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Progress
                      percent={extractionProgress}
                      strokeColor={{
                        '0%': '#10b981',
                        '100%': '#6366f1',
                      }}
                      trailColor="rgba(255,255,255,0.05)"
                      size="small"
                      status="active"
                    />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Document Uploader and Input bar */}
            <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Row gutter={8}>
                <Col span={21}>
                  <Input
                    placeholder="Ask AI or paste complaint narrative text here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onPressEnter={handleSendMessage}
                    disabled={isExtracting}
                    suffix={
                      <Upload
                        beforeUpload={handleFileUpload}
                        showUploadList={false}
                        disabled={isExtracting}
                      >
                        <Button 
                          type="text" 
                          icon={<PaperClipOutlined style={{ color: '#9ca3af', fontSize: 16 }} />} 
                          style={{ border: 0, background: 'none' }}
                        />
                      </Upload>
                    }
                    style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', borderRadius: 8 }}
                  />
                </Col>
                <Col span={3}>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    disabled={isExtracting || !inputText.trim()}
                    style={{ width: '100%', borderRadius: 8, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 0 }}
                  />
                </Col>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 10, color: '#64748b' }}>
                  Supports PDF files up to 10MB.
                </Text>
                {extractedResult && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => dispatch(resetExtractionState())}
                    style={{ color: '#f87171', fontSize: 10, padding: 0 }}
                  >
                    Clear Extraction
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </Col>

        {/* Right Section: Structured Field Verification (Width: 14/24) */}
        <Col xs={24} lg={14} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>Structured Parameter Extraction Audit</span>
                {extractedResult && (
                  <Badge 
                    status="processing" 
                    text={<span style={{ color: '#a7f3d0', fontSize: 11 }}>AI Extraction Active</span>} 
                  />
                )}
              </div>
            }
            bordered={false}
            bodyStyle={{
              padding: extractedResult ? 20 : 0,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflowY: 'auto'
            }}
            style={{
              background: '#151b2c',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden'
            }}
          >
            {!extractedResult ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', height: '100%', padding: '60px 0', textAlign: 'center', margin: 'auto' }}>
                <FileTextOutlined style={{ fontSize: 64, color: 'rgba(99,102,241,0.15)', marginBottom: 20 }} />
                <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Ready for Processing</Title>
                <Text type="secondary" style={{ color: '#64748b', maxWidth: 360, display: 'block', margin: 'auto' }}>
                  Upload a complaint document or paste text description in the Copilot chat. The extracted parameters, severity score, and compliance suggestions will display here.
                </Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* AI Risk Assessment & Complaint Summary Cards */}
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card
                      style={{
                        background: 'rgba(99, 102, 241, 0.04)',
                        border: '1px solid rgba(99, 102, 241, 0.15)',
                        borderRadius: '8px'
                      }}
                      bodyStyle={{ padding: 16 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <RobotOutlined style={{ color: '#818cf8', fontSize: 16 }} />
                        <Text strong style={{ color: '#818cf8', fontSize: 13 }}>
                          AI Complaint Summary
                        </Text>
                      </div>
                      <Paragraph style={{ color: '#cbd5e1', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                        {extractedResult.extractedData.complaintSummary || 'No summary generated.'}
                      </Paragraph>
                    </Card>
                  </Col>
                  <Col span={24}>
                    <Card
                      style={{
                        background: 'rgba(239, 68, 68, 0.04)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: '8px'
                      }}
                      bodyStyle={{ padding: 16 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <WarningOutlined style={{ color: '#f87171', fontSize: 16 }} />
                        <Text strong style={{ color: '#f87171', fontSize: 13 }}>
                          AI Risk Assessment
                        </Text>
                        <Tag 
                          color={
                            extractedResult.extractedData.priority === 'Critical' ? 'red' :
                            extractedResult.extractedData.priority === 'High' ? 'orange' :
                            extractedResult.extractedData.priority === 'Medium' ? 'blue' : 'green'
                          }
                          style={{ marginLeft: 'auto', fontWeight: 600, fontSize: 10 }}
                        >
                          {String(extractedResult.extractedData.priority || 'Medium').toUpperCase()} PRIORITY
                        </Tag>
                      </div>
                      <Paragraph style={{ color: '#cbd5e1', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                        {extractedResult.extractedData.riskAssessment || 'No qualitative risk assessment available.'}
                      </Paragraph>
                    </Card>
                  </Col>
                </Row>

                {/* Form fields review list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {(() => {
                    const fields = [
                      { key: 'customerName', label: 'Customer Name', type: 'text' },
                      { key: 'complaintSource', label: 'Complaint Source', type: 'text' },
                      { key: 'productName', label: 'Product Name', type: 'text' },
                      { key: 'productStrength', label: 'Product Strength', type: 'text' },
                      { key: 'batchNumber', label: 'Batch Number', type: 'text' },
                      { key: 'manufacturingDate', label: 'Mfg Date', type: 'date' },
                      { key: 'expiryDate', label: 'Exp Date', type: 'date' },
                      { key: 'complaintType', label: 'Complaint Type', type: 'select', options: ['Quality Defect', 'Packaging Damage', 'Inefficacy', 'Contamination', 'Adverse Reaction'] },
                      { key: 'complaintDate', label: 'Complaint Date', type: 'date' },
                      { key: 'quantityAffected', label: 'Quantity Affected', type: 'number' },
                      { key: 'severity', label: 'Severity Rating', type: 'select', options: ['Low', 'Medium', 'High'] },
                      { key: 'priority', label: 'Priority Assignment', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
                      { key: 'rootCause', label: 'AI Root Cause Analysis', type: 'textarea' },
                      { key: 'capa', label: 'AI CAPA Recommendations', type: 'textarea' },
                      { key: 'complaintDescription', label: 'Description Narrative', type: 'textarea' }
                    ];

                    return fields.map((field) => {
                      const value = extractedResult.extractedData[field.key];
                      const confidence = extractedResult.confidenceScores[field.key] || 0.0;
                      const isLowConfidence = confidence < 0.80;
                      const isEditing = editingField === field.key;

                      return (
                        <div 
                          key={field.key} 
                          style={{
                            background: isLowConfidence ? 'rgba(245, 158, 11, 0.02)' : 'rgba(255,255,255,0.01)',
                            border: isLowConfidence ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(255,255,255,0.04)',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            boxShadow: isLowConfidence ? 'inset 0 0 10px rgba(245,158,11,0.02)' : 'none'
                          }}
                        >
                          <Row align="middle" gutter={16}>
                            <Col span={6}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text strong style={{ color: '#fff', fontSize: 12 }}>{field.label}</Text>
                                <span style={{ fontSize: 10, color: confidence > 0.8 ? '#10b981' : '#f59e0b', marginTop: 2, fontWeight: 600 }}>
                                  {Math.round(confidence * 100)}% Confidence
                                </span>
                              </div>
                            </Col>
                            <Col span={15}>
                              {isEditing ? (
                                field.type === 'select' ? (
                                  <Select
                                    size="small"
                                    style={{ width: '100%' }}
                                    value={editValue}
                                    onChange={(val) => setEditValue(val)}
                                  >
                                    {field.options.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
                                  </Select>
                                ) : field.type === 'date' ? (
                                  <DatePicker
                                    size="small"
                                    style={{ width: '100%' }}
                                    value={editValue ? dayjs(editValue) : null}
                                    onChange={(date) => setEditValue(date ? date.format('YYYY-MM-DD') : '')}
                                  />
                                ) : field.type === 'textarea' ? (
                                  <Input.TextArea
                                    size="small"
                                    rows={2}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                  />
                                ) : (
                                  <Input
                                    size="small"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                  />
                                )
                              ) : (
                                <div style={{ minHeight: '20px', display: 'flex', alignItems: 'center' }}>
                                  {field.key === 'priority' || field.key === 'severity' ? (
                                    <Tag color={
                                      value === 'Critical' ? 'red' : value === 'High' ? 'orange' : value === 'Medium' ? 'blue' : 'green'
                                    } style={{ fontWeight: 600, fontSize: 10 }}>
                                      {String(value || 'N/A').toUpperCase()}
                                    </Tag>
                                  ) : (
                                    <Text style={{ color: value ? '#cbd5e1' : '#64748b', fontSize: 12 }}>
                                      {value !== null && value !== undefined && value !== '' ? String(value) : 'Not extracted'}
                                    </Text>
                                  )}
                                  {isLowConfidence && !value && (
                                    <Tag icon={<ExclamationCircleOutlined />} color="warning" style={{ fontSize: 9, marginLeft: 8, fontWeight: 500 }}>
                                      Trace gap
                                    </Tag>
                                  )}
                                </div>
                              )}
                            </Col>
                            <Col span={3} style={{ textAlign: 'right' }}>
                              {isEditing ? (
                                <Space size={4}>
                                  <Button 
                                    type="text" 
                                    size="small"
                                    onClick={() => saveInlineEdit(field.key)}
                                    style={{ color: '#10b981', padding: 0 }}
                                  >
                                    Save
                                  </Button>
                                  <Button 
                                    type="text" 
                                    size="small"
                                    onClick={() => setEditingField(null)}
                                    style={{ color: '#ef4444', padding: 0 }}
                                  >
                                    Cancel
                                  </Button>
                                </Space>
                              ) : (
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EditOutlined style={{ color: '#9ca3af', fontSize: 12 }} />}
                                  onClick={() => startEditing(field.key, value)}
                                />
                              )}
                            </Col>
                          </Row>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Confirm Ingestion Actions */}
                <div style={{ display: 'flex', gap: 12, marginTop: 10, paddingBottom: 10 }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircleOutlined />}
                    onClick={handleSaveTicket}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 0,
                      fontWeight: 600,
                      borderRadius: 8
                    }}
                  >
                    Approve & Import Ticket
                  </Button>
                  <Button
                    size="large"
                    icon={<CloseOutlined />}
                    onClick={() => dispatch(resetExtractionState())}
                    style={{ borderRadius: 8 }}
                  >
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
