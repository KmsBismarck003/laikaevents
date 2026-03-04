"""Run schema migrations for manager module."""
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

url = f"mysql+pymysql://{os.getenv('MYSQL_USER','root')}:{os.getenv('MYSQL_PASSWORD','')}@{os.getenv('MYSQL_HOST','localhost')}:3306/{os.getenv('MYSQL_DATABASE','laika_club')}"
engine = create_engine(url)

with engine.connect() as conn:
    # Create tables
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS manager_action_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            event_id INT,
            action VARCHAR(50) NOT NULL,
            reason TEXT,
            metadata JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_manager_log_user (user_id),
            INDEX idx_manager_log_event (event_id)
        )
    """))
    print("  manager_action_logs: OK")

    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS refund_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticket_id INT NOT NULL,
            user_id INT NOT NULL,
            event_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            reason VARCHAR(100),
            status VARCHAR(20) DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_refund_ticket (ticket_id),
            INDEX idx_refund_event (event_id),
            INDEX idx_refund_user (user_id)
        )
    """))
    print("  refund_logs: OK")

    # Add columns if they don't exist
    columns_to_add = [
        ("cancel_reason", "events", "TEXT"),
        ("cancelled_at", "events", "TIMESTAMP NULL"),
        ("cancelled_by", "events", "INT NULL"),
        ("refunded_at", "tickets", "TIMESTAMP NULL"),
    ]

    for col_name, table_name, col_type in columns_to_add:
        result = conn.execute(text(
            "SELECT COUNT(*) as c FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=:tbl AND COLUMN_NAME=:col"
        ), {"tbl": table_name, "col": col_name}).fetchone()

        exists = result[0] if result else 0
        if exists == 0:
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"))
            print(f"  Added {col_name} to {table_name}")
        else:
            print(f"  {col_name} already exists in {table_name}")

    conn.commit()
    print("\nSchema updated successfully!")
