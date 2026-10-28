from app.models import Base, User, Auction


def test_metadata_contains_phase_two_tables() -> None:
    assert set(Base.metadata.tables) == {"users", "auctions"}
    assert any(
        constraint.name == "uq_users_email"
        for constraint in User.__table__.constraints
    )
