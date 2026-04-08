from fastapi import APIRouter, Depends
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
    items: List[ItemCreate]

@router.post("/")
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db)):
    # 1. Calculate totals
    total = sum(item.quantity * item.price_per_unit for item in data.items)
    
    # 2. Create Invoice (ID is generated automatically by Neon)
    new_invoice = Invoice(
        date=data.date or datetime.utcnow(), # Use selected date or 'now'
        doctor_name=data.doctor_name,
        clinic_name=data.clinic_name,
        patient_name=data.patient_name,
        shade=data.shade,
        total_amount=total,
        received_amount=data.received_amount,
        remaining_balance=total - data.received_amount
    )
    
    db.add(new_invoice)
    db.flush() 

    # 3. Add the items
    for item in data.items:
        db_item = InvoiceItem(
            invoice_id=new_invoice.id,
            description=item.description,
            quantity=item.quantity,
            price_per_unit=item.price_per_unit,
            total_price=item.quantity * item.price_per_unit
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(new_invoice)
    
    # Return the real ID and the formatted INV number
    return {
        "id": new_invoice.id,
        "invoice_no": new_invoice.invoice_number,
        "status": "success"
    }


@router.get("/{invoice_id}")
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    # Look for the invoice and include its items
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    return {
        "invoice_no": invoice.invoice_number,
        "doctor": invoice.doctor_name,
        "clinic": invoice.clinic_name,
        "patient": invoice.patient_name,
        "total": invoice.total_amount,
        "date": invoice.date,
        "items": [
            {
                "description": item.description,
                "quantity": item.quantity,
                "price": item.price_per_unit,
                "subtotal": item.total_price
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
        "patient_name": inv.patient_name,
        "total_amount": inv.total_amount,
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