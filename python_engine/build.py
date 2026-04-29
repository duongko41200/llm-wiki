import os
import subprocess
import shutil
import sys

def main():
    print("Building Python sidecar...")
    
    # Ensure dependencies are installed
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    # Run PyInstaller
    subprocess.check_call([
        "pyinstaller",
        "--onefile",
        "--name", "parser",
        "--clean",
        "parser.py"
    ])
    
    # Move to src-tauri/binaries with correct target triple
    target_triple = "x86_64-pc-windows-msvc" # Default for windows
    
    exe_ext = ".exe" if os.name == "nt" else ""
    src_bin = os.path.join("dist", f"parser{exe_ext}")
    
    dest_dir = os.path.join("..", "knowledge-forge", "src-tauri", "binaries")
    os.makedirs(dest_dir, exist_ok=True)
    
    dest_bin = os.path.join(dest_dir, f"parser-{target_triple}{exe_ext}")
    
    shutil.copy2(src_bin, dest_bin)
    
    print(f"Build complete. Binary copied to {dest_bin}")

if __name__ == "__main__":
    main()
