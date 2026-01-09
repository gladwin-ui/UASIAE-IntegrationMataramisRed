"""
Script to start all microservices
Run this script to start all 4 services simultaneously
"""
import subprocess
import sys
import os
import time

services = [
    {
        'name': 'User Service',
        'path': os.path.join(os.path.dirname(__file__), 'user-service'),
        'script': 'app.py',
        'port': 5001
    },
    {
        'name': 'Wallet Service',
        'path': os.path.join(os.path.dirname(__file__), 'wallet-service'),
        'script': 'app.py',
        'port': 5002
    },
    {
        'name': 'Transaction Service',
        'path': os.path.join(os.path.dirname(__file__), 'transaction-service'),
        'script': 'app.py',
        'port': 5003
    },
    {
        'name': 'Notification Service',
        'path': os.path.join(os.path.dirname(__file__), 'notification-service'),
        'script': 'app.py',
        'port': 5004
    }
]

def start_service(service):
    """Start a single service"""
    print(f"Starting {service['name']} on port {service['port']}...")
    try:
        process = subprocess.Popen(
            [sys.executable, service['script']],
            cwd=service['path'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        return process
    except Exception as e:
        print(f"Error starting {service['name']}: {e}")
        return None

def main():
    print("=" * 50)
    print("Starting DosWallet Microservices")
    print("=" * 50)
    print()
    
    processes = []
    
    for service in services:
        process = start_service(service)
        if process:
            processes.append((service['name'], process))
            time.sleep(1)  # Small delay between starts
    
    print()
    print("=" * 50)
    print("All services started!")
    print("=" * 50)
    print("\nServices running on:")
    for service in services:
        print(f"  - {service['name']}: http://localhost:{service['port']}/graphql")
    print("\nPress Ctrl+C to stop all services")
    print("=" * 50)
    
    try:
        # Wait for all processes
        while True:
            time.sleep(1)
            # Check if any process has died
            for name, process in processes:
                if process.poll() is not None:
                    print(f"\n{name} has stopped!")
    except KeyboardInterrupt:
        print("\n\nStopping all services...")
        for name, process in processes:
            print(f"Stopping {name}...")
            process.terminate()
            process.wait()
        print("All services stopped.")

if __name__ == '__main__':
    main()

