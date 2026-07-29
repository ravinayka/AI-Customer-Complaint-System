import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from fastapi.encoders import jsonable_encoder

# Import utilities, agents, and database settings
from app.parser import extract_text_from_file
from app.agent import run_complaint_pipeline
from datetime import datetime, timedelta
from app.database import Base, engine, get_db, SessionLocal
from app.models import Settings, Complaint, Notification, AuditLog, User
from app.schemas import (
    SettingsResponse, SettingsUpdate, PasswordChangeSchema,
    ComplaintResponse, ComplaintCreate, ComplaintUpdate, ReportStatistics,
    NotificationResponse, AuditLogResponse, UserCreate, UserLogin, UserResponse, AuthResponse
)
from typing import List, Dict, Any, Optional

# Bootstrapping Database Schema
Base.metadata.create_all(bind=engine)

# Add default settings and complaints rows if tables are empty
db = SessionLocal()
try:
    existing_settings = db.query(Settings).first()
    if not existing_settings:
        default_settings = Settings(
            id=1,
            name="Ravi M",
            email="ravi.m@facility.org",
            role="Administrator",
            model_selection="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=1024,
            theme_mode="dark",
            email_notifications=True,
            desktop_notifications=True,
            critical_alerts=True,
            two_factor_enabled=False,
            language="en"
        )
        db.add(default_settings)
        db.commit()
        print("INFO: Initialized default database settings.")

    existing_complaints = db.query(Complaint).first()
    if not existing_complaints:
        default_complaints = [
            Complaint(
                id="CMP-0021",
                product="Paracetamol 500mg",
                batch="PR500-2401",
                customer="City Pharmacy Group",
                risk="Medium",
                status="In Review",
                date="2026-07-28",
                mfg_date="2026-01-10",
                exp_date="2028-01-10",
                category="Packaging Damage",
                description="Packaging discoloration observed on the outer seal of Batch PR500-2401. Box is structurally sound but label prints appear faded.",
                reporter="Dr. Alice Vance",
                contact="alice.vance@citypharmacy.com",
                qty=500
            ),
            Complaint(
                id="CMP-0022",
                product="Amoxicillin Capsules",
                batch="AMX250-2311",
                customer="Metro Health Clinic",
                risk="Critical",
                status="Open",
                date="2026-07-27",
                mfg_date="2025-11-15",
                exp_date="2027-11-15",
                category="Adverse Reaction",
                description="Patient reported gastrointestinal discomfort and mild skin rash after taking capsules from blister pack. Suspected thermal degradation during storage/transport.",
                reporter="Nurse Jack Thompson",
                contact="j.thompson@metrohealth.org",
                qty=120
            ),
            Complaint(
                id="CMP-0023",
                product="Vitamin C Tablets",
                batch="VTC100-2405",
                customer="Wellness Center Retail",
                risk="Low",
                status="Closed",
                date="2026-07-25",
                mfg_date="2026-05-20",
                exp_date="2028-05-20",
                category="Quality Defect",
                description="Customer returned bottle due to missing desiccant pouch inside. No visible product deterioration or defects.",
                reporter="Mark Henderson",
                contact="m.henderson@wellnesscenter.com",
                qty=15,
                resolution_date="2026-07-27"
            ),
            Complaint(
                id="CMP-0024",
                product="Ibuprofen Tablets",
                batch="IBP400-2398",
                customer="Apex Distributors",
                risk="High",
                status="In Review",
                date="2026-07-24",
                mfg_date=None,
                exp_date="2027-09-30",
                category="Quality Defect",
                description="Cracked tablets discovered in multiple bottles of the batch. Potential issue with compression pressure in manufacturing press or binder concentration.",
                reporter="QC Lead Bob Roberts",
                contact="b.roberts@apexdist.com",
                qty=1000
            ),
            Complaint(
                id="CMP-0025",
                product="Metformin 500mg",
                batch="MET500-2402",
                customer="Valley Pharmacy",
                risk="Medium",
                status="Open",
                date="2026-07-23",
                mfg_date="2026-02-12",
                exp_date="2028-02-12",
                category="Quality Defect",
                description="Odd smell (fishy odor) reported upon opening the bulk bottle. Requesting chemical analysis of the tablet coating agent.",
                reporter="Pharmacist Chloe Yang",
                contact="chloe.y@valleyrx.com",
                qty=250
            ),
            Complaint(
                id="CMP-0026",
                product="Ibuprofen Tablets",
                batch="",
                customer="Care Pharmacy",
                risk="High",
                status="Open",
                date="2026-07-29",
                mfg_date=None,
                exp_date=None,
                category="Quality Defect",
                description="Bad tablets.",
                reporter="Dr. John Smith",
                contact="jsmith@carepharmacy.org",
                qty=50
            )
        ]
        for c in default_complaints:
            db.add(c)
        db.commit()
        print("INFO: Initialized default database complaints.")

        existing_notifications = db.query(Notification).first()
        if not existing_notifications:
            default_notifications = [
                Notification(
                    title="Critical Complaint Flagged",
                    message="Complaint CMP-0022 has been classified as Critical Risk. Immediate review required.",
                    type="critical",
                    priority="Critical",
                    is_read=False,
                    created_at=datetime.utcnow() - timedelta(days=2),
                    complaint_id="CMP-0022"
                ),
                Notification(
                    title="Complaint Assigned",
                    message="Complaint CMP-0022 has been assigned to you.",
                    type="assigned",
                    priority="Low",
                    is_read=True,
                    created_at=datetime.utcnow() - timedelta(days=2),
                    complaint_id="CMP-0022"
                ),
                Notification(
                    title="New Complaint Received",
                    message="Complaint CMP-0021 for Paracetamol 500mg has been registered.",
                    type="new_complaint",
                    priority="Medium",
                    is_read=False,
                    created_at=datetime.utcnow() - timedelta(hours=1),
                    complaint_id="CMP-0021"
                ),
                Notification(
                    title="Complaint Closed",
                    message="Complaint CMP-0023 has been resolved and closed.",
                    type="closed",
                    priority="Medium",
                    is_read=True,
                    created_at=datetime.utcnow() - timedelta(days=4),
                    complaint_id="CMP-0023"
                )
            ]
            for n in default_notifications:
                db.add(n)
            db.commit()
            print("INFO: Initialized default database notifications.")

        existing_users = db.query(User).first()
        if not existing_users:
            default_users = [
                User(
                    name="Ravi M (Admin)",
                    email="admin@facility.org",
                    password="admin123",
                    role="Administrator"
                ),
                User(
                    name="John Doe (User)",
                    email="user@facility.org",
                    password="user123",
                    role="User"
                )
            ]
            for u in default_users:
                db.add(u)
            db.commit()
            print("INFO: Initialized default database user accounts.")
except Exception as e:
    print(f"WARNING: Failed to bootstrap default settings or complaints ({str(e)}).")
finally:
    db.close()

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AI Powered Customer Complaint Management System",
    description="Backend API services for managing and routing customer complaints",
    version="0.1.0"
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextPayload(BaseModel):
    text: str

@app.get("/")
async def root():
    return {
        "status": "Backend Running"
    }


# WebSocket Connection Manager for Notifications
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()


@app.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Maintain connection, wait for messages from client (if any, though client only listens)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


# Notification CRUD Endpoints
@app.get("/api/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    is_read: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Notification.title.ilike(search_filter)) |
            (Notification.message.ilike(search_filter)) |
            (Notification.complaint_id.ilike(search_filter))
        )
    return query.order_by(Notification.created_at.desc()).all()


@app.put("/api/notifications/{id}/read", response_model=NotificationResponse)
async def mark_notification_read(id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.id == id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notification.is_read = True
    db.add(AuditLog(
        action="Notification Read",
        details=f"Notification ID {id} ('{notification.title}') marked as read.",
        complaint_id=notification.complaint_id
    ))
    db.commit()
    db.refresh(notification)
    return notification


@app.put("/api/notifications/read-all")
async def mark_all_notifications_read(db: Session = Depends(get_db)):
    unreads = db.query(Notification).filter(Notification.is_read == False).all()
    for notification in unreads:
        notification.is_read = True
    db.add(AuditLog(
        action="Notifications Read All",
        details=f"All unread notifications ({len(unreads)}) marked as read."
    ))
    db.commit()
    return {"status": "success", "count": len(unreads)}


@app.delete("/api/notifications/{id}")
async def delete_notification(id: int, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(Notification.id == id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")
    comp_id = notification.complaint_id
    db.delete(notification)
    db.add(AuditLog(
        action="Notification Deleted",
        details=f"Deleted notification ID {id} ('{notification.title}').",
        complaint_id=comp_id
    ))
    db.commit()
    return {"status": "success", "id": id}


# Audit Logs Endpoint
@app.get("/api/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()


# Auth endpoints
@app.post("/api/auth/register", response_model=AuthResponse)
async def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered.")
    
    new_user = User(
        name=payload.name,
        email=payload.email,
        password=payload.password, # plain text for demo
        role=payload.role
    )
    db.add(new_user)
    
    # Write audit log
    db.add(AuditLog(
        action="User Registered",
        details=f"User '{new_user.name}' registered with role '{new_user.role}'.",
        user_email=new_user.email
    ))
    db.commit()
    db.refresh(new_user)
    
    return {
        "status": "success",
        "message": "User registered successfully.",
        "user": new_user
    }


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or user.password != payload.password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    # Write audit log
    db.add(AuditLog(
        action="User Login",
        details=f"User '{user.name}' logged in successfully.",
        user_email=user.email
    ))
    db.commit()
    
    return {
        "status": "success",
        "message": "Login successful.",
        "user": user
    }


@app.post("/api/analyze-text")
async def analyze_text(payload: TextPayload):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text narrative cannot be empty.")
    try:
        result = run_complaint_pipeline(payload.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-file")
async def analyze_file(file: UploadFile = File(...)):
    filename = file.filename
    print(f"INFO: Received file upload request. Filename: '{filename}', Content Type: '{file.content_type}'")
    
    # 1. Validate file extension/format: ONLY PDFs are accepted
    if not filename.lower().endswith('.pdf') and file.content_type != 'application/pdf':
        print(f"WARNING: Rejected file '{filename}' with invalid content type or format.")
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")
    
    try:
        # 2. Validate file size up to 10 MB
        content = await file.read()
        file_size = len(content)
        max_size = 10 * 1024 * 1024  # 10 MB
        
        if file_size > max_size:
            print(f"WARNING: File '{filename}' size ({file_size} bytes) exceeds maximum limit of 10 MB.")
            raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10 MB.")
            
        if file_size == 0:
            print(f"WARNING: File '{filename}' is empty.")
            raise HTTPException(status_code=400, detail="Uploaded PDF is empty.")
            
        print(f"INFO: Successfully read PDF '{filename}', size={file_size} bytes. Initiating text extraction...")
        
        # 3. Extract text
        extracted_text = extract_text_from_file(content, filename)
        
        if not extracted_text.strip():
            print(f"WARNING: PDF '{filename}' contains no extractable text.")
            raise HTTPException(status_code=400, detail="Uploaded PDF contains no extractable text or is empty.")
            
        print(f"INFO: Text successfully extracted. Starting QA analysis pipeline...")
        
        # 4. Analyze complaint narrative
        result = run_complaint_pipeline(extracted_text)
        print(f"INFO: AI analysis completed successfully for PDF '{filename}'.")
        return result
        
    except HTTPException as he:
        raise he
    except ValueError as ve:
        print(f"ERROR: ValueError during processing: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"ERROR: Unexpected exception during PDF processing: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to analyze PDF file: {str(e)}")

# Settings Module Endpoints
@app.get("/api/settings", response_model=SettingsResponse)
async def get_settings(db: Session = Depends(get_db)):
    settings = db.query(Settings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not initialized.")
    return settings

@app.put("/api/settings", response_model=SettingsResponse)
async def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    settings = db.query(Settings).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings record not found.")
    
    # Update properties
    for key, value in payload.dict().items():
        setattr(settings, key, value)
        
    db.commit()
    db.refresh(settings)

    # Sync Groq API Key to environment variable if updated
    if payload.groq_api_key:
        os.environ["GROQ_API_KEY"] = payload.groq_api_key
    elif "GROQ_API_KEY" in os.environ:
        del os.environ["GROQ_API_KEY"]

    return settings

@app.post("/api/settings/change-password")
async def change_password(payload: PasswordChangeSchema):
    if payload.oldPassword == payload.newPassword:
        raise HTTPException(status_code=400, detail="New password cannot be identical to old password.")
    return {"status": "success", "message": "Password updated successfully."}

@app.post("/api/settings/logout-all")
async def logout_all():
    return {"status": "success", "message": "Successfully terminated all other device sessions."}


# Complaint CRUD Endpoints
@app.get("/api/complaints", response_model=List[ComplaintResponse])
async def get_complaints(db: Session = Depends(get_db)):
    return db.query(Complaint).order_by(Complaint.date.desc()).all()

@app.post("/api/complaints", response_model=ComplaintResponse)
async def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    existing = db.query(Complaint).filter(Complaint.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Complaint ID already exists.")
    
    new_comp = Complaint(**payload.dict())
    db.add(new_comp)
    
    notifications_to_add = []
    
    # 1. New Complaint Received Notification
    n1 = Notification(
        title="New Complaint Received",
        message=f"Complaint {new_comp.id} for {new_comp.product} has been registered.",
        type="new_complaint",
        priority="Medium",
        complaint_id=new_comp.id
    )
    notifications_to_add.append(n1)
    db.add(n1)
    
    # 2. Complaint Assigned Notification
    n2 = Notification(
        title="Complaint Assigned",
        message=f"Complaint {new_comp.id} has been assigned to you.",
        type="assigned",
        priority="Low",
        complaint_id=new_comp.id
    )
    notifications_to_add.append(n2)
    db.add(n2)
    
    # 3. High / Critical Risk Alerts
    if new_comp.risk == "High":
        n3 = Notification(
            title="High Risk Complaint Flagged",
            message=f"Complaint {new_comp.id} has been classified as High Risk.",
            type="high_risk",
            priority="High",
            complaint_id=new_comp.id
        )
        notifications_to_add.append(n3)
        db.add(n3)
    elif new_comp.risk == "Critical":
        n3 = Notification(
            title="Critical Complaint Flagged",
            message=f"Complaint {new_comp.id} has been classified as Critical Risk. Immediate review required.",
            type="critical",
            priority="Critical",
            complaint_id=new_comp.id
        )
        notifications_to_add.append(n3)
        db.add(n3)

    # Add audit log entry
    db.add(AuditLog(
        action="Complaint Created",
        details=f"Complaint registered for product '{new_comp.product}' by customer '{new_comp.customer}'. Category: '{new_comp.category}', Severity: '{new_comp.risk}', Priority: '{new_comp.risk}'.",
        complaint_id=new_comp.id
    ))
        
    db.commit()
    db.refresh(new_comp)
    
    # Broadcast all created notifications
    for n in notifications_to_add:
        try:
            db.refresh(n)
            await manager.broadcast({
                "event": "new_notification",
                "data": jsonable_encoder(NotificationResponse.from_orm(n))
            })
        except Exception as e:
            print(f"Error broadcasting notification: {e}")
            
    return new_comp

@app.put("/api/complaints/{id}", response_model=ComplaintResponse)
async def update_complaint_endpoint(id: str, payload: ComplaintUpdate, db: Session = Depends(get_db)):
    comp = db.query(Complaint).filter(Complaint.id == id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    
    # Check if status changed from something else to Closed to set resolution_date
    status_changed_to_closed = (payload.status == "Closed") and (comp.status != "Closed")
    status_changed = (payload.status is not None) and (payload.status != comp.status)
    
    # Detect description or batch details changed
    details_changed = False
    if payload.batch is not None and payload.batch != comp.batch:
        details_changed = True
    if payload.description is not None and payload.description != comp.description:
        details_changed = True
        
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(comp, key, value)
        
    notifications_to_add = []
        
    if status_changed_to_closed:
        comp.resolution_date = datetime.now().strftime("%Y-%m-%d")
        # Trigger Complaint Closed Notification
        n = Notification(
            title="Complaint Closed",
            message=f"Complaint {id} has been resolved and closed.",
            type="closed",
            priority="Medium",
            complaint_id=id
        )
        notifications_to_add.append(n)
        db.add(n)
    elif status_changed:
        # Trigger Complaint Updated Notification (Status Change)
        n = Notification(
            title="Complaint Updated",
            message=f"Complaint {id} status has been updated to {payload.status}.",
            type="updated",
            priority="Low",
            complaint_id=id
        )
        notifications_to_add.append(n)
        db.add(n)
    elif details_changed:
        # Trigger Complaint Updated Notification (General update)
        n = Notification(
            title="Complaint Updated",
            message=f"Complaint {id} details have been updated.",
            type="updated",
            priority="Low",
            complaint_id=id
        )
        notifications_to_add.append(n)
        db.add(n)

    # Add audit log entry
    db.add(AuditLog(
        action="Complaint Updated",
        details=f"Complaint ID '{id}' details updated. Status: '{comp.status}', Risk Level: '{comp.risk}'.",
        complaint_id=id
    ))
        
    db.commit()
    db.refresh(comp)
    
    # Broadcast all created notifications
    for n in notifications_to_add:
        try:
            db.refresh(n)
            await manager.broadcast({
                "event": "new_notification",
                "data": jsonable_encoder(NotificationResponse.from_orm(n))
            })
        except Exception as e:
            print(f"Error broadcasting notification: {e}")
            
    return comp


# Reports Statistics Aggregation Endpoint
from datetime import datetime
from collections import Counter

@app.get("/api/reports/statistics", response_model=ReportStatistics)
async def get_reports_statistics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    product: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    
    if start_date:
        query = query.filter(Complaint.date >= start_date)
    if end_date:
        query = query.filter(Complaint.date <= end_date)
    if product:
        query = query.filter(Complaint.product.like(f"%{product}%"))
    if severity:
        query = query.filter(Complaint.risk == severity)
    if status:
        query = query.filter(Complaint.status == status)
        
    complaints = query.all()
    
    total = len(complaints)
    open_count = len([c for c in complaints if c.status == "Open"])
    closed_count = len([c for c in complaints if c.status == "Closed"])
    critical_count = len([c for c in complaints if c.risk == "Critical"])
    
    # Calculate average resolution time
    res_times = []
    for c in complaints:
        if c.status == "Closed" and c.date and c.resolution_date:
            try:
                d1 = datetime.strptime(c.date, "%Y-%m-%d")
                d2 = datetime.strptime(c.resolution_date, "%Y-%m-%d")
                diff = (d2 - d1).days
                if diff >= 0:
                    res_times.append(diff)
            except Exception:
                pass
                
    avg_res_time = float(sum(res_times) / len(res_times)) if res_times else 0.0
    
    # Aggregations for charts
    trends_counter = Counter([c.date for c in complaints if c.date])
    trends = [{"date": d, "count": count} for d, count in sorted(trends_counter.items())]
    
    severity_counter = Counter([c.risk for c in complaints if c.risk])
    severity_distribution = [{"name": name, "value": val} for name, val in severity_counter.items()]
    
    types_counter = Counter([c.category for c in complaints if c.category])
    complaint_types = [{"name": name, "value": val} for name, val in types_counter.items()]
    
    product_counter = Counter([c.product for c in complaints if c.product])
    product_wise = [{"name": name, "value": val} for name, val in product_counter.items()]
    
    monthly_counter = Counter([c.date[:7] for c in complaints if c.date and len(c.date) >= 7])
    monthly = [{"month": m, "count": count} for m, count in sorted(monthly_counter.items())]
    
    return {
        "total_complaints": total,
        "open_complaints": open_count,
        "closed_complaints": closed_count,
        "critical_complaints": critical_count,
        "avg_resolution_time": avg_res_time,
        "trends": trends,
        "severity_distribution": severity_distribution,
        "complaint_types": complaint_types,
        "product_wise": product_wise,
        "monthly": monthly
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
