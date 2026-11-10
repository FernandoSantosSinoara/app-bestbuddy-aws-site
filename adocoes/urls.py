from django.urls import path
from .views import AdocoesViewSet, AdocoesDetailView

urlpatterns = [
    path('', AdocoesViewSet.as_view()),
    path('<int:pk>/', AdocoesDetailView.as_view()),
]