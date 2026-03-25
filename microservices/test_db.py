import sys
import traceback
sys.path.append('C:\\Users\\Pc\\Music\\proyectolaika2.6.7\\microservices')
from events.database import SessionLocal
from events.controller import get_event_by_id

def test():
    db = SessionLocal()
    try:
        res = get_event_by_id(db, 7)
        print("Success:", res)
    except Exception as e:
        print("Error!")
        traceback.print_exc()

if __name__ == '__main__':
    test()
