from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

# SMART IMPORT for both environments
try:
    from backend.models.invoice import Invoice, InvoiceItem  # Add InvoiceItem here
    from backend.core.database import get_db
except ImportError:
    from models.invoice import Invoice, InvoiceItem         # And add it here
    from core.database import get_db
    
router = APIRouter(prefix="/invoices", tags=["Invoices"])

class ItemCreate(BaseModel):
    # These are now defined for every single row
    patient_name: str
    shade: str
    description: str
    quantity: int
    price_per_unit: float

class InvoiceCreate(BaseModel):
    # General Info (Header)
    date: Optional[datetime] = None
    doctor_name: str
    clinic_name: str
    
    # Financials & Notes
    received_amount: float = 0.0
    notes: Optional[str] = None
    
    # The list of rows containing the patient info
    items: List[ItemCreate]

@router.post("/")
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db)):
    # 1. Calculate the total by summing all items in the list
    total_amount = sum(item.quantity * item.price_per_unit for item in data.items)
    
    # 2. Create the Main Invoice (The Header)
    new_invoice = Invoice(
        date=data.date or datetime.utcnow(),
        doctor_name=data.doctor_name,
        clinic_name=data.clinic_name,
        total_amount=total_amount,
        received_amount=data.received_amount,
        remaining_balance=total_amount - data.received_amount,
        notes=data.notes,
        invoice_no=None # Placeholder for the flush
    )
    
    db.add(new_invoice)
    db.flush() # Secure the ID from the database
    
    # Generate the professional ID (e.g., INV-0042)
    new_invoice.invoice_no = f"INV-{new_invoice.id:04d}"

    # 3. Save each row (The Items)
    for item in data.items:
        db.add(InvoiceItem(
            invoice_id=new_invoice.id,
            patient_name=item.patient_name, # Row-specific
            shade=item.shade,               # Row-specific
            description=item.description,
            quantity=item.quantity,
            price_per_unit=item.price_per_unit,
            total_price=item.quantity * item.price_per_unit
        ))
    
    try:
        db.commit()
        db.refresh(new_invoice)
        return {"status": "success", "invoice_no": new_invoice.invoice_no, "id": new_invoice.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
        
@router.get("/{invoice_id}")
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    # Look for the invoice and include its items
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    return {
        "id": invoice.id,
        "invoice_no": invoice.invoice_number,
        "date": invoice.date,
        "doctor_name": invoice.doctor_name,
        "clinic_name": invoice.clinic_name,
        "total_amount": invoice.total_amount,
        "received_amount": invoice.received_amount,
        "remaining_balance": invoice.remaining_balance,
        "items": [
            {
                "patient_name": item.patient_name,
                "shade": item.shade,
                "description": item.description,
                "quantity": item.quantity,
                "price_per_unit": item.price_per_unit,
                "total_price": item.total_price
            } for item in invoice.items
        ]
    }

@router.get("/")
def get_all_invoices(db: Session = Depends(get_db)):
    invoices = db.query(Invoice).order_by(Invoice.id.desc()).all()
    # Include the formatted invoice_no in the response
    return [{
        "id": inv.id,
        "invoice_no": inv.invoice_number,
        "doctor_name": inv.doctor_name,
        "clinic_name": inv.clinic_name,
        "patient_name": inv.patient_name,
        "total_amount": inv.total_amount,
        "received_amount": inv.received_amount,
        "date": inv.date
    } for inv in invoices]

# DELETE an invoice
@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(db_invoice)
    db.commit()
    return {"message": "Deleted successfully"}
