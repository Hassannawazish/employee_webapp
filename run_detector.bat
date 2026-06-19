@echo off
cd /d "%~dp0test\espfrontend"
set "KMP_DUPLICATE_LIB_OK=TRUE"
python ".\ml\serve_hazard_detector.py"
pause
