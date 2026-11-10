
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .health import liveness_check, readiness_check
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from usuarios.serializer import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

urlpatterns = [
    path('admin/', admin.site.urls),
    path('healthz/live/', liveness_check, name='healthz-live'),
    path('healthz/ready/', readiness_check, name='healthz-ready'),

    path('api/animais/', include('animais.urls')),
    path('api/usuarios/', include('usuarios.urls')),

    path('api/token/',
        CustomTokenObtainPairView.as_view(),
        name='token_obtain_pair',
    ),
    path(
        'api/token/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh',
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)