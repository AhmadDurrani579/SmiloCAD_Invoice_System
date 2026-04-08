from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.invoice import Invoice, InvoiceItem
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/invoices", tags=["Invoices"])

# Pydantic Schemas for validation
class ItemCreate(BaseModel):
    description: str
    quantity: int
    price_per_unit: float

class InvoiceCreate(BaseModel):
    invoice_no: str
    doctor_name: str
    clinic_name: str
    patient_name: str
    shade: str
    received_amount: float
    items: List[ItemCreate]

@router.post("/")
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db)):
    # Calculate totals
    total = sum(item.quantity * item.price_per_unit for item in data.items)
    
    new_invoice = Invoice(
        invoice_no=data.invoice_no,
        doctor_name=data.doctor_name,
        clinic_name=data.clinic_name,
        patient_name=data.patient_name,
        shade=data.shade,
        total_amount=total,
        received_amount=data.received_amount,
        remaining_balance=total - data.received_amount
    )
    
    db.add(new_invoice)
    db.flush() # Gets the ID without committing yet

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
    return {"status": "success", "invoice_id": new_invoice.id}