from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F


class InferenceEngine:
    """Simple inference wrapper around a transformers classification model.

    Contract:
    - input: raw text string
    - output: dict {label: str, confidence: float, logits: list}
    """

    def __init__(self, model_name="distilbert-base-uncased-finetuned-sst-2-english", device=None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name).to(self.device)

    def predict(self, text: str):
        inputs = self.tokenizer(text, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
        logits_np = outputs.logits.cpu().numpy()
        if logits_np.shape[0] != 1:
            raise ValueError(f"Expected batch size of 1, but got {logits_np.shape[0]}. Please provide a single sequence input.")
        logits = logits_np[0].tolist()
        probs = F.softmax(torch.tensor(logits), dim=0).numpy().tolist()
        # highest confidence
        idx = int(torch.tensor(probs).argmax().item())
        label = self.model.config.id2label[idx]
        confidence = float(probs[idx])
        return {"label": label, "confidence": confidence, "logits": logits}


def quick_predict(text: str):
    engine = InferenceEngine()
    return engine.predict(text)
