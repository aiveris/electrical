import sys
import os

# Add your project directory to the sys.path
# Replace 'yourusername' with your PythonAnywhere username
path = '/home/yourusername/electrical'
if path not in sys.path:
    sys.path.append(path)

# Import your Flask app
from main import app as application
