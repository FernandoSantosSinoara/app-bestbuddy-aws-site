from django.urls import path
from .views import AnimaisViewSet, AnimaisDetailView, AnimaisEstatisticasView

urlpatterns = [
    path('', AnimaisViewSet.as_view()),
    path('estatisticas/', AnimaisEstatisticasView.as_view()),
    path("<int:pk>/", AnimaisDetailView.as_view()),
]