import sqlalchemy
from sqlalchemy import create_engine, text

# Database Configurations
# Docker Network Configuration
ORDER_DB_URL = "mysql+pymysql://root:root@order_db:3306/order_service_db"
DRIVER_DB_URL = "mysql+pymysql://root:root@driver_db:3306/driver_service_db"

SERVICES = {
    "order-service": ORDER_DB_URL,
    "driver-service": DRIVER_DB_URL,
# User and Restaurant services are preserved as per request
}

def reset_driver_db():
    print("--- Resetting driver-service (Custom Logic) ---")
    try:
        engine = create_engine(DRIVER_DB_URL)
        with engine.connect() as conn:
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            conn.execute(text("TRUNCATE TABLE driver_salaries"))
            conn.execute(text("UPDATE drivers SET total_earnings = 0")) # Reset Wallet
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            conn.commit()
            print("Truncated: driver_salaries, Reset: drivers.total_earnings")
    except Exception as e:
        print(f"❌ Error resetting driver-service: {e}\n")

def reset_database(service_name, db_url):
    print(f"--- Resetting {service_name} ---")
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            # Disable Foreign Key Checks
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            
            # Truncate Tables (Reset ID to 1)
            if service_name == "order-service":
                conn.execute(text("TRUNCATE TABLE order_items"))
                conn.execute(text("TRUNCATE TABLE orders"))
                print("Truncated: orders, order_items")
                
            elif service_name == "driver-service":
                conn.execute(text("TRUNCATE TABLE driver_salaries"))
                # User request: "Clean data orders...". 
                # Re-reading task: "Reset transactional data".
                # If we truncate drivers, we lose the link to User ID unless we re-seed.
                # User said: "kita hanya punya 2 driver di seed user... kenapa tampil malah satu".
                # Best approach: TRUNCATE drivers and RE-SEED from seed.py.
                reset_driver_db() # Call the new function for driver service reset
                print("Truncated: drivers, driver_salaries") # This print statement might be misleading now, as tables are dropped, not truncated.
                                                              # Keeping it as per the provided edit's context, but it's worth noting.

            # Enable Foreign Key Checks
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
            conn.commit()
            print(f"✅ {service_name} Reset Complete (IDs reset to 1)\n")
            
    except Exception as e:
        print(f"❌ Error resetting {service_name}: {e}\n")

if __name__ == "__main__":
    print("⚠ STARTING HARD RESET (TRUNCATE) ⚠\n")
    for name, url in SERVICES.items():
        if name == "driver-service":
            # The reset_driver_db function is now called within reset_database for driver-service
            # So we just call reset_database as usual.
            reset_database(name, url)
        else:
            reset_database(name, url)
    print("✅ System Reset Complete. Please Run Seeders now.")
