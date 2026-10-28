from app.models import Base, User


def test_metadata_contains_only_phase_one_user_table() -> None:
    assert list(Base.metadata.tables) == ["users"]
    assert any(
        constraint.name == "uq_users_email"
        for constraint in User.__table__.constraints
    )
