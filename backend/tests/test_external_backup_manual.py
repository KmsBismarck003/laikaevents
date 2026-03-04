import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from modules.external_backup import SourceDetector, SourceSelector, SecurityGate
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

def test_source_detection():
    print("\n[TEST] Source Detection")
    detector = SourceDetector()
    sources = detector.scan_sources()
    print(f"Found {len(sources)} sources")
    for s in sources:
        print(f" - {s['label']} ({s['type']}): {s['path']}")

    # Simulate a USB drive
    mock_usb = Path("C:/laika_test_usb_backup")
    mock_usb.mkdir(exist_ok=True)
    with open(mock_usb / "backup_test.sql", "w") as f:
        f.write("test backup content")

    print("\n[TEST] Re-scanning with mock USB...")
    # Inject mock path for testing
    detector.detectable_paths.append(mock_usb)
    sources = detector.scan_sources()
    found_mock = any(s['path'] == str(mock_usb) for s in sources)
    print(f"Mock USB detected: {found_mock}")

    # Cleanup
    import shutil
    try:
        shutil.rmtree(mock_usb)
    except:
        pass

def test_security_gate():
    print("\n[TEST] Security Gate")

    # Setup DB connection
    MYSQL_URL = f"mysql+pymysql://{os.getenv('MYSQL_USER', 'root')}:{os.getenv('MYSQL_PASSWORD', '')}@{os.getenv('MYSQL_HOST', 'localhost')}:3306/{os.getenv('MYSQL_DATABASE', 'laika_club')}"
    engine = create_engine(MYSQL_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    gate = SecurityGate()

    # Needs a real user ID. Let's try to find admin
    from sqlalchemy import text
    result = db.execute(text("SELECT id, email, password_hash FROM users LIMIT 1"))
    user = result.fetchone()

    if not user:
        print("Skipping Security Gate test: No users in DB")
        return

    print(f"Testing with user: {user.email} (ID: {user.id})")

    # Test wrong password
    valid, msg = gate.verify_password(db, user.id, "wrong_password_123")
    print(f"Wrong password check: {valid} (Expected: False) -> Msg: {msg}")

    # We can't easily test correct password without knowing it or resetting it.
    # But verifying that 'wrong_password' fails is a good start.

if __name__ == "__main__":
    try:
        test_source_detection()
        test_security_gate()
        print("\n[SUCCESS] Verification Script Completed")
    except Exception as e:
        print(f"\n[FAILURE] Verification Failed: {e}")
