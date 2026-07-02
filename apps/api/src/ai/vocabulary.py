"""Controlled concept vocabulary for Research DNA (spec 1.4.8.5)."""
CONCEPT_VOCABULARY = [
    "Pre-training", "Fine-tuning", "Alignment", "Model compression", "Quantization",
    "Chain-of-thought", "Tree-of-thought", "Formal verification", "Tool use", "Planning",
    "Memory", "Multi-step reasoning", "Coordination", "Debate", "Role specialization",
    "Code generation", "Debugging", "Repo-level understanding", "Manipulation", "Locomotion",
    "World models", "Object detection", "Segmentation", "Image generation", "3D vision",
    "Vision-Language", "Audio-Language", "Video understanding", "ASR", "TTS", "Voice cloning",
    "Real-time inference", "RLHF", "GRPO", "Offline RL", "Reward modeling",
    "Inference optimization", "Serving", "Data generation", "Data augmentation", "Data curation",
    "Retrieval", "Indexing", "Hybrid search", "Agentic RAG", "Protocol design",
    "Tool integration", "Agent memory", "Benchmarks", "Safety evals", "Capability evals",
    "Mixture of experts", "Attention mechanisms", "Diffusion", "State space models",
    "Scaling laws", "Distillation", "In-context learning", "Prompt engineering",
    "Multi-agent", "RL", "Retrieval augmentation", "Self-supervision", "Transfer learning",
]
VOCAB_SET = {c.lower() for c in CONCEPT_VOCABULARY}
