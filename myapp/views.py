from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from .models import SharedMessage
import json

def big_red_circle(request):
    return render(request, 'circle.html')

@csrf_exempt
def save_text(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            text = data.get('text', '')
            
            message, created = SharedMessage.objects.get_or_create(id=1)
            message.text = text
            message.save()
            
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    
    return JsonResponse({'success': False}, status=405)

def get_text(request):
    try:
        message = SharedMessage.objects.get(id=1)
        return JsonResponse({'text': message.text})
    except SharedMessage.DoesNotExist:
        return JsonResponse({'text': ''})
