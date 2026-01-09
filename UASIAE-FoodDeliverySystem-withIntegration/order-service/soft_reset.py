import sys
from sqlalchemy import create_engine, text

# Configurations
# Docker Internal Configurations
ORDER_DB_URL = "mysql+pymysql://root:root@order_db:3306/order_service_db"
DRIVER_DB_URL = "mysql+pymysql://root:root@driver_db:3306/driver_service_db"
PAYMENT_DB_URL = "mysql+pymysql://root:root@payment_db:3306/payment_service_db"

def soft_reset():
    print("Starting SOFT RESET (Internal Docker Execution)...")
    
    # 1. Clear Orders
    print("Resetting ORDERS...")
    try:
        engine_order = create_engine(ORDER_DB_URL)
        with engine_order.connect() as conn:
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
            conn.execute(text("TRUNCATE TABLE order_items;"))
            conn.execute(text("TRUNCATE TABLE orders;"))
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
            conn.commit()
        print("Orders Cleared.")
    except Exception as e:
        print(f"Error resetting orders: {e}")

    # 2. Clear Payments
    print("Resetting PAYMENTS...")
    try:
        engine_payment = create_engine(PAYMENT_DB_URL)
        with engine_payment.connect() as conn:
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
            conn.execute(text("TRUNCATE TABLE payments;"))
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
            conn.commit()
        print("Payments Cleared.")
    except Exception as e:
        print(f"Error resetting payments: {e}")
    
    # 3. Reset Driver Earnings
    print("Resetting DRIVER EARNINGS & SALARIES...")
    try:
        engine_driver = create_engine(DRIVER_DB_URL)
        with engine_driver.connect() as conn:
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
            conn.execute(text("TRUNCATE TABLE driver_salaries;"))
            conn.execute(text("UPDATE drivers SET total_earnings = 0;")) 
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
            conn.commit()
        print("Driver Earnings Reset.")
    except Exception as e:
        print(f"Error resetting drivers: {e}")
    
    print("SOFT RESET COMPLETE.")

if __name__ == "__main__":
    soft_reset()
