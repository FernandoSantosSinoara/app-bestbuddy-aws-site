from django.db import models

class Noticia(models.Model):
    titulo = models.CharField(max_length=200, verbose_name="Título")
    resumo = models.TextField(verbose_name="Resumo / Subtítulo")
    conteudo = models.TextField(blank=True, verbose_name="Conteúdo Completo")
    imagem = models.CharField(max_length=500, null=True, blank=True, verbose_name="URL da Imagem")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")

    class Meta:
        verbose_name = "Notícia"
        verbose_name_plural = "Notícias"
        ordering = ['-created_at']

    def __str__(self):
        return self.titulo
