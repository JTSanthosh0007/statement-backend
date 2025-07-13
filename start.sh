#!/bin/bash
cd /opt/render/project/src/backend
uvicorn api_server:app --host 0.0.0.0 --port $PORT 