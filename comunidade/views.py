from rest_framework import generics, permissions
from .models import Noticia
from .serializers import NoticiaSerializer


class NoticiaListView(generics.ListAPIView):
    queryset = Noticia.objects.all().order_by('-created_at')
    serializer_class = NoticiaSerializer
    permission_classes = [permissions.AllowAny]
