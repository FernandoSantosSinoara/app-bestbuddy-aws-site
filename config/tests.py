from unittest.mock import patch

from django.db import OperationalError
from django.test import TestCase, override_settings


class HealthCheckTests(TestCase):
    @patch("config.health.connection.cursor", side_effect=OperationalError)
    @override_settings(ALLOWED_HOSTS=[".elb.amazonaws.com"])
    def test_liveness_does_not_depend_on_database_or_target_ip_host(self, _cursor):
        response = self.client.get(
            "/healthz/live/",
            HTTP_HOST="10.0.1.23:30081",
        )

        self.assertEqual(response.status_code, 200)

    @override_settings(ALLOWED_HOSTS=[".elb.amazonaws.com"])
    def test_readiness_checks_database_for_target_ip_host(self):
        response = self.client.get(
            "/healthz/ready/",
            HTTP_HOST="10.0.1.23:30081",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    @patch("config.health.connection.cursor", side_effect=OperationalError)
    @override_settings(ALLOWED_HOSTS=[".elb.amazonaws.com"])
    def test_readiness_returns_service_unavailable_when_database_is_down(self, _cursor):
        response = self.client.get(
            "/healthz/ready/",
            HTTP_HOST="10.0.1.23:30081",
        )

        self.assertEqual(response.status_code, 503)
