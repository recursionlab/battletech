from transformers import pipeline


# Initialize model pipeline
def run_test(signal: str = None):
    targeting_system = pipeline("sentiment-analysis")
    signal = signal or "Target locked. Enemy resistance expected. Victory imminent."
    response = targeting_system(signal)
    print("Input:", signal)
    print("Response:", response)


if __name__ == "__main__":
    run_test()
