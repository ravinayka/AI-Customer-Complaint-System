from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class SettingsResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    profile_pic: Optional[str] = None
    
    groq_api_key: Optional[str] = ""
    model_selection: str
    temperature: float = Field(..., ge=0.0, le=1.0)
    max_tokens: int = Field(..., gt=0)
    
    theme_mode: str
    email_notifications: bool
    desktop_notifications: bool
    critical_alerts: bool
    
    two_factor_enabled: bool
    language: str

    class Config:
        from_attributes = True

class SettingsUpdate(BaseModel):
    name: str
    email: EmailStr
    role: str
    profile_pic: Optional[str] = None
    
    groq_api_key: Optional[str] = ""
    model_selection: str
    temperature: float = Field(..., ge=0.0, le=1.0)
    max_tokens: int = Field(..., gt=0)
    
    theme_mode: str
    email_notifications: bool
    desktop_notifications: bool
    critical_alerts: bool
    
    two_factor_enabled: bool
    language: str

class PasswordChangeSchema(BaseModel):
    oldPassword: str
    newPassword: str = Field(..., min_length=6, description="New password must be at least 6 characters")


from typing import List, Dict, Any

class ComplaintCreate(BaseModel):
    id: str
    product: str
    batch: Optional[str] = ""
    customer: str
    risk: str = "Low"
    status: str = "Open"
    date: str
    mfg_date: Optional[str] = None
    exp_date: Optional[str] = None
    category: str
    description: str
    reporter: str
    contact: str
    qty: int = 1
    resolution_date: Optional[str] = None
    root_cause: Optional[str] = None
    capa_recommendation: Optional[str] = None

class ComplaintUpdate(BaseModel):
    product: Optional[str] = None
    batch: Optional[str] = None
    customer: Optional[str] = None
    risk: Optional[str] = None
    status: Optional[str] = None
    date: Optional[str] = None
    mfg_date: Optional[str] = None
    exp_date: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    reporter: Optional[str] = None
    contact: Optional[str] = None
    qty: Optional[int] = None
    resolution_date: Optional[str] = None
    root_cause: Optional[str] = None
    capa_recommendation: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: str
    product: str
    batch: Optional[str] = ""
    customer: str
    risk: str
    status: str
    date: str
    mfg_date: Optional[str] = None
    exp_date: Optional[str] = None
    category: str
    description: str
    reporter: str
    contact: str
    qty: int
    resolution_date: Optional[str] = None
    root_cause: Optional[str] = None
    capa_recommendation: Optional[str] = None

    class Config:
        from_attributes = True

class ReportStatistics(BaseModel):
    total_complaints: int
    open_complaints: int
    closed_complaints: int
    critical_complaints: int
    avg_resolution_time: float
    
    trends: List[Dict[str, Any]]
    severity_distribution: List[Dict[str, Any]]
    complaint_types: List[Dict[str, Any]]
    product_wise: List[Dict[str, Any]]
    monthly: List[Dict[str, Any]]


from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    priority: str
    is_read: bool
    created_at: datetime
    complaint_id: Optional[str] = None

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: int
    action: str
    details: Optional[str] = None
    user_email: str
    created_at: datetime
    complaint_id: Optional[str] = None

    class Config:
        from_attributes = True


