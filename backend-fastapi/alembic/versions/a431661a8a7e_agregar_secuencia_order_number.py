"""agregar secuencia order_number

Revision ID: a431661a8a7e
Revises: d80933f7e8f5
Create Date: 2026-07-04 11:10:15.094856

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a431661a8a7e'
down_revision: Union[str, None] = 'd80933f7e8f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1")


def downgrade() -> None:
    op.execute("DROP SEQUENCE IF EXISTS order_number_seq")
