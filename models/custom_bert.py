import torch.nn as nn


class CustomBertClassifier(nn.Module):
    """A small editable stub for an internal architecture.

    This is intentionally minimal — for more advanced customization, edit this file.
    """

    def __init__(self, hidden_size=768, num_labels=2):
        super().__init__()
        self.dense = nn.Linear(hidden_size, hidden_size)
        self.classifier = nn.Linear(hidden_size, num_labels)

    def forward(self, hidden_states):
        x = self.dense(hidden_states)
        x = nn.functional.relu(x)
        return self.classifier(x)
