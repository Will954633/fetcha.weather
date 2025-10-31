#!/usr/bin/env python3
"""
Fetcha Weather - Development Server Launcher
Starts both backend API and frontend servers
"""

import os
import sys
import subprocess
import time
from pathlib import Path

# Colors for terminal output
GREEN = '\033[92m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'

def print_header():
    """Print startup header"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}  Fetcha Weather - Development Environment{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def check_dependencies():
    """Check if required dependencies are installed"""
    print(f"{YELLOW}Checking dependencies...{RESET}")
    
    # Check Python packages
    try:
        import flask
        import flask_cors
        import flask_jwt_extended
        print(f"{GREEN}✓ Backend dependencies installed{RESET}")
    except ImportError as e:
        print(f"{RED}✗ Missing backend dependency: {e}{RESET}")
        print(f"{YELLOW}Run: cd backend && pip install -r requirements.txt{RESET}")
        return False
    
    return True

def start_backend():
    """Start the Flask backend server"""
    print(f"\n{YELLOW}Starting backend server...{RESET}")
    
    backend_dir = Path(__file__).parent / "backend"
    os.chdir(backend_dir)
    
    # Check if .env exists
    if not os.path.exists('.env'):
        print(f"{YELLOW}Creating .env file from .env.example...{RESET}")
        if os.path.exists('.env.example'):
            with open('.env.example', 'r') as f:
                env_content = f.read()
            with open('.env', 'w') as f:
                f.write(env_content)
        else:
            print(f"{RED}Warning: No .env.example found{RESET}")
    
    # Start backend on port 5001 (5000 is often used by macOS AirPlay)
    env = os.environ.copy()
    env['PORT'] = '5001'
    backend_process = subprocess.Popen(
        [sys.executable, "app.py"],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait a bit for server to start
    time.sleep(2)
    
    if backend_process.poll() is None:
        print(f"{GREEN}✓ Backend server started on http://localhost:5001{RESET}")
        return backend_process
    else:
        print(f"{RED}✗ Failed to start backend server{RESET}")
        stderr = backend_process.stderr.read()
        print(f"{RED}{stderr}{RESET}")
        return None

def start_frontend():
    """Start the frontend development server"""
    print(f"\n{YELLOW}Starting frontend server...{RESET}")
    
    frontend_dir = Path(__file__).parent / "frontend"
    os.chdir(frontend_dir)
    
    # Start simple HTTP server
    frontend_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Wait a bit for server to start
    time.sleep(1)
    
    if frontend_process.poll() is None:
        print(f"{GREEN}✓ Frontend server started on http://localhost:8000{RESET}")
        return frontend_process
    else:
        print(f"{RED}✗ Failed to start frontend server{RESET}")
        return None

def print_instructions():
    """Print usage instructions"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{GREEN}Development servers are running!{RESET}\n")
    print(f"  Backend API:  {BLUE}http://localhost:5001{RESET}")
    print(f"  Frontend:     {BLUE}http://localhost:8000{RESET}")
    print(f"\n{YELLOW}Access the application:{RESET}")
    print(f"  • Main page:  {BLUE}http://localhost:8000/index.html{RESET}")
    print(f"  • Login:      {BLUE}http://localhost:8000/login.html{RESET}")
    print(f"  • Dashboard:  {BLUE}http://localhost:8000/weather-dashboard.html{RESET}")
    print(f"\n{YELLOW}Press Ctrl+C to stop both servers{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def main():
    """Main entry point"""
    try:
        print_header()
        
        # Check dependencies
        if not check_dependencies():
            sys.exit(1)
        
        # Start servers
        backend = start_backend()
        if not backend:
            sys.exit(1)
        
        frontend = start_frontend()
        if not frontend:
            backend.terminate()
            sys.exit(1)
        
        # Print instructions
        print_instructions()
        
        # Keep running until interrupted
        try:
            backend.wait()
        except KeyboardInterrupt:
            print(f"\n{YELLOW}Shutting down servers...{RESET}")
            backend.terminate()
            frontend.terminate()
            backend.wait()
            frontend.wait()
            print(f"{GREEN}Servers stopped{RESET}\n")
    
    except Exception as e:
        print(f"{RED}Error: {e}{RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()
