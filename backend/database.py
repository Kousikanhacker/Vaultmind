import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

DB_PATH = os.getenv("PAPERTRAIL_DB_PATH", os.path.join(os.path.dirname(__file__), "papertrail.db"))

def get_connection(db_path: str = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path: str = DB_PATH):
    """Initialize the SQLite database schema if it doesn't already exist."""
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS document_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                file_type TEXT,
                file_size INTEGER,
                upload_time TEXT NOT NULL,
                preview_image TEXT,
                parties TEXT,
                total_amount TEXT,
                deadlines TEXT,
                risky_clauses TEXT,
                raw_json TEXT
            )
        """)
        conn.commit()

def save_document_analysis(
    filename: str,
    file_type: str,
    file_size: int,
    preview_image: str,
    analysis: Dict[str, Any],
    db_path: str = DB_PATH
) -> int:
    """Save processed document analysis and preview to local SQLite history."""
    init_db(db_path)
    upload_time = datetime.now().isoformat()
    parties_json = json.dumps(analysis.get("parties", []))
    total_amount = str(analysis.get("total_amount", "N/A"))
    deadlines_json = json.dumps(analysis.get("deadlines", []))
    risky_clauses_json = json.dumps(analysis.get("risky_clauses", []))
    raw_json = json.dumps(analysis)

    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO document_history (
                filename, file_type, file_size, upload_time, preview_image,
                parties, total_amount, deadlines, risky_clauses, raw_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            filename, file_type, file_size, upload_time, preview_image,
            parties_json, total_amount, deadlines_json, risky_clauses_json, raw_json
        ))
        conn.commit()
        return cursor.lastrowid

def get_all_documents(limit: int = 50, db_path: str = DB_PATH) -> List[Dict[str, Any]]:
    """Retrieve list of processed documents, ordered by newest first."""
    init_db(db_path)
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, filename, file_type, file_size, upload_time, total_amount,
                   parties, deadlines, risky_clauses
            FROM document_history
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        results = []
        for row in rows:
            results.append({
                "id": row["id"],
                "filename": row["filename"],
                "file_type": row["file_type"],
                "file_size": row["file_size"],
                "upload_time": row["upload_time"],
                "total_amount": row["total_amount"],
                "parties": json.loads(row["parties"]) if row["parties"] else [],
                "deadlines": json.loads(row["deadlines"]) if row["deadlines"] else [],
                "risky_clauses": json.loads(row["risky_clauses"]) if row["risky_clauses"] else [],
            })
        return results

def get_document_by_id(doc_id: int, db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    """Retrieve a single document record by its primary key ID."""
    init_db(db_path)
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, filename, file_type, file_size, upload_time, preview_image,
                   parties, total_amount, deadlines, risky_clauses, raw_json
            FROM document_history
            WHERE id = ?
        """, (doc_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "filename": row["filename"],
            "file_type": row["file_type"],
            "file_size": row["file_size"],
            "upload_time": row["upload_time"],
            "preview_image": row["preview_image"],
            "analysis": json.loads(row["raw_json"]) if row["raw_json"] else {
                "parties": json.loads(row["parties"]) if row["parties"] else [],
                "total_amount": row["total_amount"],
                "deadlines": json.loads(row["deadlines"]) if row["deadlines"] else [],
                "risky_clauses": json.loads(row["risky_clauses"]) if row["risky_clauses"] else []
            }
        }

def delete_document_by_id(doc_id: int, db_path: str = DB_PATH) -> bool:
    """Delete a document record from history."""
    init_db(db_path)
    with get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM document_history WHERE id = ?", (doc_id,))
        conn.commit()
        return cursor.rowcount > 0
