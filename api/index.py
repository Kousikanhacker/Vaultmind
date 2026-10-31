import sys
import os

# Add project root directory to sys.path so backend modules are importable
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.main import app

# Vercel Serverless Function entrypoint
# The 'app' instance of FastAPI is automatically handled by Vercel's Python runtime
__all__ = ["app"]

