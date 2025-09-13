from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F
import json
from pathlib import Path


def _load_model_name_from_config():
    # Look for config/model_config.json at repo root
    config_path = Path(__file__).resolve().parents[1] / "config" / "model_config.json"
    if config_path.exists():
        try:
            data = json.loads(config_path.read_text(encoding="utf-8"))
            return data.get("model_name")
        except Exception:
            return None
    return None


class InferenceEngine:
    """Simple inference wrapper around a transformers classification model.

    Contract:
    - input: raw text string
    - output: dict {label: str, confidence: float, logits: list}
    """

    def __init__(self, model_name: str | None = None, device=None):
        # Resolve model name from config if not provided explicitly
        model_name = model_name or _load_model_name_from_config() or "distilbert-base-uncased-finetuned-sst-2-english"
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name).to(self.device)

    def predict(self, text: str):
        inputs = self.tokenizer(text, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
        logits = outputs.logits.cpu().numpy().tolist()[0]
        probs = F.softmax(torch.tensor(logits), dim=0).numpy().tolist()
        # highest confidence
        idx = int(torch.tensor(probs).argmax().item())
        label = self.model.config.id2label[idx]
        confidence = float(probs[idx])
        return {"label": label, "confidence": confidence, "logits": logits}


def quick_predict(text: str):
    engine = InferenceEngine()
    return engine.predict(text)
