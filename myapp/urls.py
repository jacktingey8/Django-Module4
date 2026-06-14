from django.urls import path
from . import views

urlpatterns = [
    path('', views.big_red_circle, name='big_red_circle'),
    path('save-text/', views.save_text, name='save_text'),
    path('get-text/', views.get_text, name='get_text'),
    path('delete-text/', views.delete_text, name='delete_text'),
]
