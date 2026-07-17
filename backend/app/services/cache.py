import time
from collections.abc import Callable
from functools import wraps
from typing import Any

TTL = 300
MAX_ENTRIES = 500


_cache: dict[str, tuple[float, object]] = {}


def cache_key(*args: object, **kwargs: object) -> str:
    parts = [str(a) for a in args]
    parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
    return "|".join(parts)


def _evict() -> None:
    now = time.time()
    stale = [k for k, (t, _) in _cache.items() if (now - t) >= TTL]
    for k in stale:
        del _cache[k]
    while len(_cache) > MAX_ENTRIES:
        oldest = min(_cache.keys(), key=lambda k: _cache[k][0])
        del _cache[oldest]


def cached(ttl: int = TTL) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(fn)
        async def wrapper(*args: object, **kwargs: object) -> object:
            _evict()
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
