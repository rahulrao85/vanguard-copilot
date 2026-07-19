from fastapi import status


class AppError(Exception):
    def __init__(
        self,
        detail: str,
        error_code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
    ) -> None:
        self.detail = detail
        self.error_code = error_code
        self.status_code = status_code
        super().__init__(detail)


class BadRequestError(AppError):
    def __init__(self, detail: str, error_code: str = "BAD_REQUEST") -> None:
        super().__init__(
            detail=detail, error_code=error_code, status_code=status.HTTP_400_BAD_REQUEST
        )


class NotFoundError(AppError):
    def __init__(self, detail: str, error_code: str = "NOT_FOUND") -> None:
        super().__init__(
            detail=detail, error_code=error_code, status_code=status.HTTP_404_NOT_FOUND
        )


class RateLimitError(AppError):
    def __init__(
        self, detail: str = "Rate limit exceeded", error_code: str = "RATE_LIMITED"
    ) -> None:
        super().__init__(
            detail=detail, error_code=error_code, status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )
