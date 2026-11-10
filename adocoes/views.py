from rest_framework import generics, permissions
from .models import Adocao 
from .serializer import AdocoesSerializer

class AdocoesViewSet(generics.ListCreateAPIView):
    queryset = Adocao.objects.all()
    serializer_class = AdocoesSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(adotante=self.request.user)
        else:
            serializer.save()

class AdocoesDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Adocao.objects.all()
    serializer_class = AdocoesSerializer
    permission_classes = [permissions.IsAuthenticated]



