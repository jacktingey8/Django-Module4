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
            x = data.get('x', None)
            y = data.get('y', None)
            
            # Create a new message each time
            message = SharedMessage(text=text)
            if x is not None:
                try:
                    message.x = float(x)
                except Exception:
                    message.x = None
            if y is not None:
                try:
                    message.y = float(y)
                except Exception:
                    message.y = None
            message.save()
            
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    
    return JsonResponse({'success': False}, status=405)

def get_text(request):
    try:
        messages = SharedMessage.objects.all().order_by('-id')[:50]  # last 50 messages
        data = [
            {
                'id': m.id,
                'text': m.text,
                'x': m.x,
                'y': m.y
            }
            for m in messages
        ]
        return JsonResponse({'messages': data})
    except Exception as e:
        return JsonResponse({'messages': [], 'error': str(e)})

@csrf_exempt
def delete_text(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            text = data.get('text', '')
            x = data.get('x', None)
            y = data.get('y', None)
            
            # Delete the message matching the coordinates and text
            query = SharedMessage.objects.filter(text=text)
            if x is not None:
                query = query.filter(x=x)
            if y is not None:
                query = query.filter(y=y)
            
            deleted_count, _ = query.delete()
            
            return JsonResponse({'success': True, 'deleted': deleted_count})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    
    return JsonResponse({'success': False}, status=405)
