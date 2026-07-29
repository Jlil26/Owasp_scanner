from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel

T = TypeVar("T")

class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None

    @classmethod
    def success_response(cls, data: Any = None, message: str = "Operation completed successfully"):
        return cls(success=True, message=message, data=data)

    @classmethod
    def error_response(cls, message: str = "An error occurred", errors: Any = None):
        return cls(success=False, message=message, data=None)

# ApiResponse alias for endpoints using ApiResponse name
ApiResponse = StandardResponse

class ErrorResponse(BaseModel):
    success: bool = False
    message: str = "An error occurred"
    errors: List[Any] = []

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T] = []
    total: int = 0
    page: int = 1
    size: int = 20

    @classmethod
    def create(cls, items: List[T], total: int, page: int = 1, size: int = 20):
        return cls(items=items, total=total, page=page, size=size)

