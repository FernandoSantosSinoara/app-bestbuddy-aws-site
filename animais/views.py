from rest_framework import generics, permissions, exceptions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Animal
from .serializers import AnimaisSerializer


class AnimaisViewSet(generics.ListCreateAPIView):
    serializer_class = AnimaisSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Animal.objects.select_related('tutor').all()

        tipo_servico = self.request.query_params.get('tipo_servico')
        if tipo_servico:
            queryset = queryset.filter(tipo_servico__iexact=tipo_servico)

        tipo_animal = self.request.query_params.get('tipo_animal')
        if tipo_animal:
            queryset = queryset.filter(tipo_animal__iexact=tipo_animal)

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado__iexact=estado)

        cidade = self.request.query_params.get('cidade')
        if cidade:
            queryset = queryset.filter(cidade__icontains=cidade.strip())

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status__iexact=status_param)

        exclude_status = self.request.query_params.get('exclude_status')
        if exclude_status:
            queryset = queryset.exclude(status__iexact=exclude_status)

        tutor_id = self.request.query_params.get('tutor_id')
        if tutor_id:
            queryset = queryset.filter(tutor_id=tutor_id)

        tempo = self.request.query_params.get('tempo')
        if tempo:
            from django.utils import timezone
            from datetime import timedelta
            now = timezone.now()
            if tempo == 'semana':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=7))
            elif tempo == 'mes':
                queryset = queryset.filter(created_at__gte=now - timedelta(days=30))

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(tutor=self.request.user)


class AnimaisDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Animal.objects.select_related('tutor').all()
    serializer_class = AnimaisSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        if instance.tutor != user and not user.is_staff and not user.is_superuser:
            raise exceptions.PermissionDenied("Você só tem permissão para editar seus próprios anúncios.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.tutor != user and not user.is_staff and not user.is_superuser:
            raise exceptions.PermissionDenied("Você só tem permissão para remover seus próprios anúncios.")
        instance.delete()


from rest_framework.views import APIView
from rest_framework.response import Response

class AnimaisEstatisticasView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        total_adotados = Animal.objects.filter(status='ADOTADO').count()
        total_disponiveis = Animal.objects.filter(tipo_servico='ADOCAO', status='DISPONIVEL').count()
        total_perdidos = Animal.objects.filter(tipo_servico='PERDIDO', status='PERDIDO').count()
        total_encontrados = Animal.objects.filter(status='ENCONTRADO').count()
        return Response({
            'total_adotados': total_adotados,
            'total_disponiveis': total_disponiveis,
            'total_perdidos': total_perdidos,
            'total_encontrados': total_encontrados,
            'total_geral': Animal.objects.count(),
        })