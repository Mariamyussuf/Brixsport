from fastapi import FastAPI

app = FastAPI(
    title="Brixsport Analytics API",
    description="Analytics service for Brixsport campus live score application",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {"message": "Brixsport Analytics Service"}

@app.get("/health")
async def health_check():
    return {"status": "OK"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)