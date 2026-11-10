from django.db import models
from django.conf import settings

class Adocao(models.Model):
    class Status(models.TextChoices):
        ABERTA = "A", "Aberta"
        APROVADA = "P", "Aprovada"
        RECUSADA = "R", "Recusada"
        FINALIZADA = "F", "Finalizada"
        CANCELADA = "C", "Cancelada"

    animal = models.ForeignKey(
        'animais.Animal',
        on_delete=models.CASCADE,
        related_name='adocoes',
        verbose_name="Animal",
        null=True,
        blank=True
    )
    adotante = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='adocoes_feitas',
        verbose_name="Usuário Adotante"
    )

    nome_adotante = models.CharField(max_length=100, default='', verbose_name="Nome do Adotante")
    email_adotante = models.EmailField(default='', verbose_name="Email do Adotante")
    telefone_adotante = models.CharField(max_length=20, default='', verbose_name="Telefone do Adotante")

    ja_teve_animais = models.CharField(max_length=10, default='Não', verbose_name="Já teve animais?")
    ja_vacinado = models.CharField(max_length=10, default='Sim', verbose_name="Manterá vacinação em dia?")
    motivacao = models.TextField(default='', verbose_name="Motivação / Sobre o adotante")


    status = models.CharField(
        max_length=1, 
        choices=Status.choices, 
        default=Status.ABERTA,
        verbose_name="Status da Adoção"
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data da Solicitação")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última Atualização")

    class Meta:
        verbose_name = 'Adoção'
        verbose_name_plural = 'Adoções'
        ordering = ['-created_at']

    def __str__(self):
        return f"Adoção #{self.id} - {self.animal.nome} por {self.nome_adotante}"

            