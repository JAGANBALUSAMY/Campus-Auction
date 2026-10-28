from app.models import Base


def test_initial_metadata_contains_no_speculative_domain_tables() -> None:
    assert list(Base.metadata.tables) == []
