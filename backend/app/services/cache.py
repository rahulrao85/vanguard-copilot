import time
from collections.abc import Callable
from functools import wraps
from typing import Any

TTL = 300


_cache: dict[str, tuple[float, object]] = {}


def cache_key(*args: object, **kwargs: object) -> str:
    parts = [str(a) for a in args]
    parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
    return "|".join(parts)


def cached(ttl: int = TTL) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(fn)
        async def wrapper(*args: object, **kwargs: object) -> object:
            key = cache_key(*args, **kwargs)
            now = time.time()
            entry = _cache.get(key)
            if entry and (now - entry[0]) < ttl:
                return entry[1]
            result = await fn(*args, **kwargs)
            _cache[key] = (now, result)
            return result
        return wrapper
    return decorator


def clear_cache() -> None:
    _cache.clear()
