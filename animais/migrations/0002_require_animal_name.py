from django.db import migrations, models


def fill_missing_animal_names(apps, schema_editor):
    Animal = apps.get_model('animais', 'Animal')
    Animal.objects.filter(nome__isnull=True).update(nome='Pet sem nome')
    Animal.objects.filter(nome='').update(nome='Pet sem nome')


class Migration(migrations.Migration):

    dependencies = [
        ('animais', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(
            fill_missing_animal_names,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='animal',
            name='nome',
            field=models.CharField(max_length=50, verbose_name='Nome do Pet'),
        ),
    ]
