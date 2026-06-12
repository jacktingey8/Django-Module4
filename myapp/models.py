from django.db import models

class SharedMessage(models.Model):
    text = models.TextField(default='')
    x = models.FloatField(null=True, blank=True)
    y = models.FloatField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-id']
    
    def __str__(self):
        return self.text[:50]
