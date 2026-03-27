from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import upload, filter, visualize, stats

app = FastAPI(title="DataViz API")

# Allow frontend (React on port 3000) to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(upload.router, prefix="/api")
app.include_router(filter.router, prefix="/api")
app.include_router(visualize.router, prefix="/api")
app.include_router(stats.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "DataViz API is running"}
