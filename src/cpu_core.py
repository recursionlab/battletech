from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import torch.nn.functional as F

# Step 1: Load model + tokenizer manually
model_name = "distilbert-base-uncased-finetuned-sst-2-english"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

# Step 2: Prepare your input
input_text = "Target locked. Enemy resistance expected. Victory imminent."
inputs = tokenizer(input_text, return_tensors="pt")

# Step 3: Forward pass through the model
with torch.no_grad():
    outputs = model(**inputs)

logits = outputs.logits  # raw model scores (not normalized)
probs = F.softmax(logits, dim=1)  # convert to probabilities

# Step 4: Extract prediction
confidence, predicted_class = torch.max(probs, dim=1)

# Step 5: Convert class ID to label (e.g., 1 → POSITIVE)
id2label = model.config.id2label
label = id2label[predicted_class.item()]

# Step 6: Print diagnostics
print("🧠 Raw logits:", logits)
print("📊 Probabilities:", probs) 
print("🎯 Predicted Class:", label)
print("🔒 Confidence Score:", confidence.item())