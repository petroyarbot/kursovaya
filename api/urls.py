from django.urls import path
from .views import search_person, create_person

urlpatterns = [
    path('search/', search_person, name='search_person'),
    path('create/', create_person, name='create_person'),
]
