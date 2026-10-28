
"""Create listings and listing_photos tables."""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# Alembic revision identifiers.
revision = "20261028_002"
down_revision = "20261028_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "listings",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "seller_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("condition", sa.String(length=50), nullable=False),
        sa.Column(
            "starting_price",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
        ),
        sa.Column(
            "minimum_increment",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
        ),
        sa.Column(
            "closing_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="draft",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.CheckConstraint(
            "length(trim(title)) > 0",
            name="title_not_empty",
        ),
        sa.CheckConstraint(
            "starting_price >= 0",
            name="starting_price_non_negative",
        ),
        sa.CheckConstraint(
            "minimum_increment >= 0",
            name="min_increment_non_negative",
        ),
        sa.CheckConstraint(
            "length(trim(category)) > 0",
            name="category_not_empty",
        ),
        sa.CheckConstraint(
            "length(trim(condition)) > 0",
            name="condition_not_empty",
        ),
    )

    op.create_index(
        "ix_listings_seller_id",
        "listings",
        ["seller_id"],
    )

    op.create_table(
        "listing_photos",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "listing_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("listings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("file_path", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_index(
        "ix_listing_photos_listing_id",
        "listing_photos",
        ["listing_id"],
    )


def downgrade() -> None:
    op.drop_table("listing_photos")
    op.drop_index("ix_listings_seller_id", table_name="listings")
    op.drop_table("listings")
