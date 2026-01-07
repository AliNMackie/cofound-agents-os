
import subprocess
import sys
import shutil
import os
import requests

def print_header(title):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print(f"{'='*50}\n")

def check_command(cmd, name):
    if shutil.which(cmd) is None:
        print(f"[FAIL] {name} ({cmd}) is NOT installed.")
        return False
    print(f"[OK] {name} ({cmd}) is installed.")
    return True

def check_gcloud_auth():
    print_header("Checking Google Cloud Auth")
    try:
        # Check if logged in
        result = subprocess.run(["gcloud", "auth", "print-access-token"], capture_output=True, text=True, shell=True)
        if result.returncode != 0:
            print("[FAIL] Not authenticated with gcloud. Please run 'gcloud auth login'.")
            return None
        
        # Get Project ID
        project_result = subprocess.run(["gcloud", "config", "get-value", "project"], capture_output=True, text=True, shell=True)
        project_id = project_result.stdout.strip()
        print(f"[OK] Authenticated. Active Project: {project_id}")
        return project_id
    except Exception as e:
        print(f"[ERROR] Failed to check gcloud usage: {e}")
        return None

def generate_enable_apis_command():
    print_header("API Enablement Command")
    apis = [
        "run.googleapis.com", 
        "aiplatform.googleapis.com", 
        "cloudbuild.googleapis.com",
        "secretmanager.googleapis.com",
        "firestore.googleapis.com"
    ]
    cmd = f"gcloud services enable {' '.join(apis)}"
    print("Run this command to enable all necessary APIs:")
    print(f"\n  {cmd}\n")

def check_connectivity():
    print_header("Connectivity Check (Local)")
    
    # Check Newsletter Engine (Default Port 8089)
    try:
        url = "http://localhost:8089/health"
        print(f"Checking {url}...")
        resp = requests.get(url, timeout=2)
        if resp.status_code == 200:
             print(f"[OK] Newsletter Engine is responding locally.")
        else:
             print(f"[WARN] Newsletter Engine responded with {resp.status_code}")
    except requests.exceptions.ConnectionError:
        print("[INFO] Newsletter Engine is NOT running locally (Port 8089).")

def main():
    print_header("IC ORIGIN - PRE-FLIGHT AUDIT")
    
    # 1. Dependency Checks
    if not check_command("gcloud", "Google Cloud CLI"): return
    if not check_command("npm", "Node Package Manager"): return
    if not check_command("python", "Python"): return

    # 2. Auth Check
    project_id = check_gcloud_auth()
    if not project_id:
        print("\nStopping Audit due to auth failure.")
        return

    # 3. API Command
    generate_enable_apis_command()

    # 4. Connectivity
    check_connectivity()

    print_header("Audit Complete")
    print("Review the 'checklist.md' artifact for Environment Variable requirements.")

if __name__ == "__main__":
    main()
