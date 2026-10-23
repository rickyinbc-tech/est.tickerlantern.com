"""Compatibility entry point for the complete five-year browser checks."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name("browser_five_year.py")),run_name="__main__")
