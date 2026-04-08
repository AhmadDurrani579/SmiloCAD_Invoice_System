from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from core.database import Base # We will create this next

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    invoice_no = Column(String, unique=True, index=True)
    doctor_name = Column(String)
    clinic_name = Column(String)
    patient_name = Column(String)
    shade = Column(String)
    total_amount = Column(Float)
    received_amount = Column(Float)
    remaining_balance = Column(Float)
    
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    description = Column(String)
    quantity = Column(Integer)
    price_per_unit = Column(Float)
    total_price = Column(Float)

    invoice = relationship("Invoice", back_populates="items")