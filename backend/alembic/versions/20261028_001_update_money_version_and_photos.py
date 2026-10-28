"""Add version column and convert monetary fields to Numeric(10,2). Also create photos table.

Revision ID: 20261028_001
Revises: fde7f8fa15cc
Create Date: 2026-10-28 14:35:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20261028_001"
down_revision = "fde7f8fa15cc"
branch_labels = None
depends_on = None


def upgrade():
    # Add version column to auctions
    op.add_column('auctions', sa.Column('version', sa.Integer(), nullable=False, server_default='0'))

    # Convert starting_price and minimum_increment from Float to Numeric(10,2)
    op.alter_column('auctions', 'starting_price',
                    existing_type=sa.Float(),
                    type_=sa.Numeric(10, 2),
                    existing_nullable=False,
                    postgresql_using='starting_price::numeric')
    op.alter_column('auctions', 'minimum_increment',
                    existing_type=sa.Float(),
                    type_=sa.Numeric(10, 2),
                    existing_nullable=False,
                    postgresql_using='minimum_increment::numeric')

    # Create photos table without DB-side UUID default; model will set Python UUID
    op.create_table(
        'photos',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('auction_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('auctions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('file_path', sa.String(length=255), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade():
    op.drop_table('photos')
    op.alter_column('auctions', 'minimum_increment',
                    existing_type=sa.Numeric(10, 2),
                    type_=sa.Float(),
                    existing_nullable=False)
    op.alter_column('auctions', 'starting_price',
                    existing_type=sa.Numeric(10, 2),
                    type_=sa.Float(),
                    existing_nullable=False)
    op.drop_column('auctions', 'version')
