from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from core.database import get_db
from models.invoice import Invoice, InvoiceItem

router = APIRouter(prefix="/invoices", tags=["Invoices"])

class ItemCreate(BaseModel):
    description: str
    quantity: int
    price_per_unit: float

class InvoiceCreate(BaseModel):
    date: Optional[datetime] = None # User can select this
    doctor_name: str
    clinic_name: str
    patient_name: str
    shade: str
    received_amount: float
    notes: Optional[str] = None
    items: List[ItemCreate]

@router.post("/")
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db)):
    total = sum(item.quantity * item.price_per_unit for item in data.items)
    
    new_invoice = Invoice(
        date=data.date or datetime.utcnow(),
        doctor_name=data.doctor_name,
        clinic_name=data.clinic_name,
        patient_name=data.patient_name,
        shade=data.shade,
        total_amount=total,
        received_amount=data.received_amount,
        remaining_balance=total - data.received_amount,
        notes=data.notes
    )
    
    db.add(new_invoice)
    db.flush()  # This assigns the REAL ID from the database

    # Set the invoice number directly in Python using the ID we just got
    new_invoice.invoice_no = f"INV-{new_invoice.id:04d}"

    # Now add items
    for item in data.items:
        db_item = InvoiceItem(
            invoice_id=new_invoice.id,
            description=item.description,
            # ... rest of item code ...
        )
        db.add(db_item)
    
    db.commit()
    return {"status": "success", "id": new_invoice.id, "invoice_no": new_invoice.invoice_no}

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
        "patient_name": invoice.patient_name,
        "shade": invoice.shade,
        "total_amount": invoice.total_amount,
        "received_amount": invoice.received_amount,
        "remaining_balance": invoice.remaining_balance,
        "items": [
            {
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
