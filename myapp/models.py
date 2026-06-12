from django.db import models

class SharedMessage(models.Model):
    text = models.TextField(default='')
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.text[:50]
