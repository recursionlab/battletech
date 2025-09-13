from fastapi import FastAPI
from pydantic import BaseModel
from src.inference import InferenceEngine


class PredictRequest(BaseModel):
    text: str


app = FastAPI(title="Battletech Inference API")
engine = InferenceEngine()


@app.post("/predict")
def predict(req: PredictRequest):
    return engine.predict(req.text)
