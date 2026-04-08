"""
АТАКА Backend - NestJS Launcher
Starts NestJS backend directly on port 8001
"""
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import httpx
import os
import logging
import subprocess
import time
import atexit
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="АТАКА Backend Proxy", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

NESTJS_URL = "http://localhost:3001"
nestjs_process = None

def cleanup_nestjs():
    """Cleanup NestJS process on exit"""
    global nestjs_process
    if nestjs_process:
        logger.info("Terminating NestJS process...")
        nestjs_process.terminate()
        try:
            nestjs_process.wait(timeout=5)
        except:
            nestjs_process.kill()

atexit.register(cleanup_nestjs)

async def proxy_request(request: Request, path: str):
    """Proxy requests to NestJS backend"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        url = f"{NESTJS_URL}/{path}"
        
        body = await request.body()
        
        headers = {}
        for key, value in request.headers.items():
            if key.lower() not in ['host', 'content-length', 'transfer-encoding']:
                headers[key] = value
        
        try:
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                params=request.query_params,
            )
            
            response_headers = dict(response.headers)
            for header in ['content-encoding', 'transfer-encoding', 'content-length']:
                response_headers.pop(header, None)
            
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=response_headers,
                media_type=response.headers.get('content-type')
            )
        except httpx.ConnectError:
            logger.error(f"Cannot connect to NestJS at {url}")
            return Response(
                content='{"error": "Backend service unavailable", "message": "NestJS is starting up..."}',
                status_code=503,
                media_type="application/json"
            )
        except Exception as e:
            logger.error(f"Proxy error: {e}")
            return Response(
                content=f'{{"error": "{str(e)}"}}',
                status_code=500,
                media_type="application/json"
            )

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{NESTJS_URL}/api/health")
            return {"status": "ok", "proxy": "running", "nestjs": response.json()}
    except:
        return {"status": "ok", "proxy": "running", "nestjs": "starting"}

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_api(request: Request, path: str):
    """Proxy all /api/* requests to NestJS"""
    return await proxy_request(request, f"api/{path}")

@app.get("/")
async def root():
    return {"message": "АТАКА Backend", "version": "1.0.0"}

@app.on_event("startup")
async def startup_event():
    global nestjs_process
    logger.info("Starting АТАКА Backend...")
    
    nestjs_dist = ROOT_DIR / "dist" / "main.js"
    if not nestjs_dist.exists():
        logger.error(f"NestJS dist not found at {nestjs_dist}")
        return
    
    logger.info("Starting NestJS server on port 3001...")
    env = os.environ.copy()
    env["PORT"] = "3001"
    env["MONGO_URL"] = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    env["DB_NAME"] = os.environ.get("DB_NAME", "ataka")
    env["JWT_SECRET"] = os.environ.get("JWT_SECRET", "ataka-jwt-secret-key-2024")
    env["JWT_REFRESH_SECRET"] = os.environ.get("JWT_REFRESH_SECRET", "ataka-refresh-secret-key-2024")
    
    nestjs_process = subprocess.Popen(
        ["node", str(nestjs_dist)],
        env=env,
        cwd=str(ROOT_DIR),
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    
    # Wait for NestJS to be ready
    for _ in range(30):
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                await client.get(f"{NESTJS_URL}/api/health")
            logger.info("NestJS server is ready!")
            break
        except:
            time.sleep(1)
    else:
        logger.warning("NestJS may not be fully ready yet")

@app.on_event("shutdown")
async def shutdown_event():
    cleanup_nestjs()
