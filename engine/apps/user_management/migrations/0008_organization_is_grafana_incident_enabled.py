# Generated by Django 3.2.16 on 2023-01-16 09:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user_management', '0007_organization_deleted_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='is_grafana_incident_enabled',
            field=models.BooleanField(default=False),
        ),
    ]