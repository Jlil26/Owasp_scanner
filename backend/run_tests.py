import sys
import unittest

from tests.test_auth import *
from tests.test_health import *
from tests.test_persistence_models import *
from tests.test_sprint3_modules import *
from tests.test_sprint4_scanner import *
from tests.test_sprint6_reports import *
from tests.test_sprint7_vulnerabilities_notifications import TestSprint7VulnerabilityAndNotifications
from tests.test_sprint8_dashboard_analytics import TestSprint8DashboardAnalytics
from tests.test_sprint9_collaboration_center import TestSprint9CollaborationCenter
from tests.test_sprint10_monitoring_platform import TestSprint10MonitoringAndPlatformManagement
from tests.test_sprint11_release_candidate import TestSprint11ReleaseCandidate
from tests.test_sprint12_qa_validation import TestSprint12QAValidation

if __name__ == "__main__":
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Load Sprint 7, 8, 9, 10, 11, 12 test suites
    sprint7_suite = loader.loadTestsFromTestCase(TestSprint7VulnerabilityAndNotifications)
    sprint8_suite = loader.loadTestsFromTestCase(TestSprint8DashboardAnalytics)
    sprint9_suite = loader.loadTestsFromTestCase(TestSprint9CollaborationCenter)
    sprint10_suite = loader.loadTestsFromTestCase(TestSprint10MonitoringAndPlatformManagement)
    sprint11_suite = loader.loadTestsFromTestCase(TestSprint11ReleaseCandidate)
    sprint12_suite = loader.loadTestsFromTestCase(TestSprint12QAValidation)
    suite.addTests(sprint7_suite)
    suite.addTests(sprint8_suite)
    suite.addTests(sprint9_suite)
    suite.addTests(sprint10_suite)
    suite.addTests(sprint11_suite)
    suite.addTests(sprint12_suite)
    
    # Collect test functions
    test_funcs = [
        test_password_hashing,
        test_jwt_access_token_creation_and_decoding,
        test_jwt_refresh_token,
        test_jwt_expired_token,
        test_login_success,
        test_login_invalid_password,
        test_auth_me_endpoint,
        test_health_and_root_endpoints,
        test_company_and_user_model_relationships,
        test_asset_target_and_audit_model_relationships,
        test_list_and_update_companies,
        test_users_crud,
        test_assets_and_targets_flow,
        test_audit_logs,
        test_tool_adapters_and_normalization,
        test_scan_launch_and_rbac,
        test_scan_tracking_and_cancel,
        test_findings_endpoints,
        test_report_generator_html_json_pdf_sha256,
        test_report_owasp_filtering,
        test_report_generation_and_versioning,
        test_report_download_preview_hash_endpoints
    ]

    for func in test_funcs:
        class DummyTest(unittest.TestCase):
            pass
        setattr(DummyTest, func.__name__, lambda self, f=func: f())
        suite.addTest(DummyTest(func.__name__))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if not result.wasSuccessful():
        sys.exit(1)
