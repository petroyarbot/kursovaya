from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from .models import Person
import json


def search_person(request):
    query = request.GET.get('q')

    results = Person.objects.none()

    if query:
        results = Person.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query)
        )

    return render(request, 'search_results.html', {
        'results': results,
        'query': query
    })


@csrf_exempt
def create_person(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    data = json.loads(request.body)

    person = Person.objects.create(
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        birth_date=data.get('birth_date') or None,
        father_id=data.get('father_id'),
        mother_id=data.get('mother_id'),
    )

    return JsonResponse({
        'status': 'ok',
        'person_id': person.id
    })
