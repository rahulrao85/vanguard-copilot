"""
Rate limiter singleton using slowapi.
Provides a global limiter instance for use across all routes.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])
