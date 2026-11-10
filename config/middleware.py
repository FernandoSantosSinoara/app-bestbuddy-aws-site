from .health import liveness_check, readiness_check


class HealthCheckMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "GET":
            health_checks = {
                "/healthz/live/": liveness_check,
                "/healthz/ready/": readiness_check,
            }
            health_check = health_checks.get(request.path_info)
            if health_check is not None:
                return health_check(request)

        return self.get_response(request)
