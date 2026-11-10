from django.urls import path
from .views import NoticiaListView

urlpatterns = [
    path('noticias/', NoticiaListView.as_view(), name='noticias-list'),
]
