from transformers import AutoTokenizer


def load_tokenizer(name: str = "distilbert-base-uncased-finetuned-sst-2-english"):
    """Return a tokenizer instance."""
    return AutoTokenizer.from_pretrained(name)
