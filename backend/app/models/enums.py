import enum

class CompanyStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    INACTIVE = "INACTIVE"

class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    INACTIVE = "INACTIVE"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"

class SystemRoleName(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    AUDITOR = "AUDITOR"
    EMPLOYEE = "EMPLOYEE"

class AssetType(str, enum.Enum):
    WEBSITE = "WEBSITE"
    API = "API"
    APPLICATION = "APPLICATION"
    SUBDOMAIN = "SUBDOMAIN"
    IP_ADDRESS = "IP_ADDRESS"

class EnvironmentType(str, enum.Enum):
    PRODUCTION = "PRODUCTION"
    PREPRODUCTION = "PREPRODUCTION"
    DEVELOPMENT = "DEVELOPMENT"

class ScanStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class ToolType(str, enum.Enum):
    ZAP = "ZAP"
    NMAP = "NMAP"
    NIKTO = "NIKTO"

class ToolExecutionStatus(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class VulnerabilitySeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class VulnerabilityStatus(str, enum.Enum):
    NEW = "NEW"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    VERIFIED = "VERIFIED"
    CLOSED = "CLOSED"
    REOPENED = "REOPENED"

class NotificationType(str, enum.Enum):
    SCAN_COMPLETED = "SCAN_COMPLETED"
    SCAN_FAILED = "SCAN_FAILED"
    VULNERABILITY_ASSIGNED = "VULNERABILITY_ASSIGNED"
    VULNERABILITY_UPDATED = "VULNERABILITY_UPDATED"
    NEW_MESSAGE = "NEW_MESSAGE"
    SYSTEM_ALERT = "SYSTEM_ALERT"
    MENTION = "MENTION"
    COMMENT_ADDED = "COMMENT_ADDED"
    ATTACHMENT_ADDED = "ATTACHMENT_ADDED"

class AuditActionStatus(str, enum.Enum):
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    DENIED = "DENIED"
