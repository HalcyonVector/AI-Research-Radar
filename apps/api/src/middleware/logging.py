"""structlog configuration."""
import structlog

structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]
)


def get_logger(name: str = "radar"):
    return structlog.get_logger(name)
