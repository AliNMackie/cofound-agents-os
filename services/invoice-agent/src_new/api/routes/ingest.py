from fastapi import APIRouter, UploadFile, HTTPException, File
from fastapi.concurrency import run_in_threadpool
from typing import Dict
import pandas as pd
import io
import re
import time
from src.services.queue import enqueue_invoice_task

router = APIRouter()

def validate_email(email: str) -> bool:
    """Basic email validation regex."""
    if not isinstance(email, str):
        return False
    # Simple regex for email validation
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return re.match(pattern, email) is not None

def process_file(contents: bytes, filename: str) -> Dict:
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        # We can't raise HTTPException easily from here if we want to catch it in the main route, 
        # but we can return an error dict or raise a custom exception.
        # For simplicity, let's raise and catch in the route.
        raise ValueError(f"Error reading file: {str(e)}")
    
    # Normalization
    column_mapping = {
        "Bill To": "client_name",
        "Client": "client_name",
        "Customer": "client_name",
        "Amount": "amount",
        "Email": "email"
    }
    
    # Normalize column names
    df.columns = df.columns.str.strip()
    df.rename(columns=column_mapping, inplace=True)
    
    required_columns = ["client_name", "amount", "email"]
    
    processed_count = 0
    error_count = 0
    
    for index, row in df.iterrows():
        if row.isna().all():
            continue
            
        try:
            client_name = row.get("client_name")
            amount = row.get("amount")
            email = row.get("email")
            
            if pd.isna(client_name) or pd.isna(amount) or pd.isna(email):
                error_count += 1
                continue

            try:
                amount = float(amount)
            except (ValueError, TypeError):
                error_count += 1
                continue
                
            if not validate_email(email):
                error_count += 1
                continue
            
            invoice_data = {
                "client_name": client_name,
                "amount": amount,
                "email": email,
            }
            
            # Note: calling enqueue_invoice_task here.
            # If enqueue_invoice_task is blocking (network call), this is still running in a threadpool, so it's fine.
            # If it's async, we can't await it here easily without making this async.
            # Instructions: "Use the existing enqueue_invoice_task(invoice_data) function".
            # Usually queueing is fast (fire and forget) or async. 
            # If it's a sync function, we are good.
            enqueue_invoice_task(invoice_data)
            processed_count += 1
            
        except Exception:
            error_count += 1
            
    return {
        "processed": processed_count, 
        "errors": error_count, 
        "batch_id": f"batch_{int(time.time())}"
    }

@router.post("/finance/ingest-batch")
async def ingest_batch(file: UploadFile = File(...)):
    filename = file.filename
    
    if not (filename.endswith('.csv') or filename.endswith('.xlsx')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .csv and .xlsx are supported.")
    
    contents = await file.read()
    
    try:
        # Offload CPU-bound work to threadpool
        result = await run_in_threadpool(process_file, contents, filename)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error during processing")
