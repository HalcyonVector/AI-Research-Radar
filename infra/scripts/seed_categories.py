"""Seed the 15 primary research categories (spec 1.4.3)."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "apps" / "api"))

from src.database import session_scope
from src.models import ResearchCategory

CATEGORIES = [
    ("llms", "LLMs", ["cs.CL"], "#6366f1", "BookOpen"),
    ("reasoning-models", "Reasoning Models", ["cs.AI", "cs.LG"], "#10b981", "Brain"),
    ("ai-agents", "AI Agents", ["cs.AI", "cs.MA"], "#f59e0b", "Waypoints"),
    ("multi-agent-systems", "Multi-Agent Systems", ["cs.MA"], "#eab308", "Users"),
    ("coding-agents", "Coding Agents", ["cs.SE", "cs.AI"], "#84cc16", "Code"),
    ("robotics", "Robotics", ["cs.RO"], "#ef4444", "Cpu"),
    ("computer-vision", "Computer Vision", ["cs.CV"], "#3b82f6", "Eye"),
    ("multimodal-ai", "Multimodal AI", ["cs.CV", "cs.CL"], "#8b5cf6", "Layers"),
    ("speech-ai", "Speech AI", ["eess.AS", "cs.SD"], "#f97316", "Mic"),
    ("reinforcement-learning", "Reinforcement Learning", ["cs.LG"], "#ec4899", "Target"),
    ("ai-infrastructure", "AI Infrastructure", ["cs.DC", "cs.PF"], "#6b7280", "Server"),
    ("synthetic-data", "Synthetic Data", ["cs.LG"], "#06b6d4", "Database"),
    ("rag-systems", "RAG Systems", ["cs.IR", "cs.CL"], "#14b8a6", "Search"),
    ("mcp-ecosystem", "MCP Ecosystem", ["cs.AI", "cs.SE"], "#a78bfa", "Network"),
    ("evaluation-frameworks", "Evaluation Frameworks", ["cs.AI", "cs.LG"], "#fbbf24", "Award"),
]


def main() -> None:
    db = session_scope()
    try:
        for i, (slug, name, arxiv, color, icon) in enumerate(CATEGORIES):
            existing = db.query(ResearchCategory).filter_by(slug=slug).first()
            if existing:
                existing.arxiv_categories = arxiv
                existing.color_hex = color
                existing.icon_name = icon
                existing.display_order = i
                continue
            db.add(ResearchCategory(
                slug=slug, name=name, arxiv_categories=arxiv,
                color_hex=color, icon_name=icon, display_order=i, is_active=True,
                description=f"Research on {name}.",
            ))
        db.commit()
        print(f"Seeded {len(CATEGORIES)} categories.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
