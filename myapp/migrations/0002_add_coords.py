from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='sharedmessage',
            name='x',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='sharedmessage',
            name='y',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
