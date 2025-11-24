from django.shortcuts import redirect
from django.urls import path
from appi_app import views

urlpatterns = [
    path('klyenty/', views.klyent_list, name='klyent_list'),
    path('klyenty/<int:pk>/', views.klyent_detail, name='klyent_detail'),
    path('klyenty/new/', views.klyent_edit, name='klyent_create'),
    path('klyenty/<int:pk>/edit/', views.klyent_edit, name='klyent_update'),
    path('klyenty/<int:pk>/delete/', views.klyent_delete, name='klyent_delete'),

    path('pracivnyky/', views.pracivnyk_list, name='pracivnyk_list'),
    path('pracivnyky/<int:pk>/', views.pracivnyk_detail, name='pracivnyk_detail'),
    path('pracivnyky/new/', views.pracivnyk_edit, name='pracivnyk_create'),
    path('pracivnyky/<int:pk>/edit/', views.pracivnyk_edit, name='pracivnyk_update'),
    path('pracivnyky/<int:pk>/delete/', views.pracivnyk_delete, name='pracivnyk_delete'),

    path('tochky/', views.tochka_list, name='tochka_list'),
    path('tochky/<int:pk>/', views.tochka_detail, name='tochka_detail'),
    path('tochky/new/', views.tochka_edit, name='tochka_create'),
    path('tochky/<int:pk>/edit/', views.tochka_edit, name='tochka_update'),
    path('tochky/<int:pk>/delete/', views.tochka_delete, name='tochka_delete'),

    path('kartky/', views.kartka_list, name='kartka_list'),
    path('kartky/<int:pk>/', views.kartka_detail, name='kartka_detail'),
    path('kartky/new/', views.kartka_edit, name='kartka_create'),
    path('kartky/<int:pk>/edit/', views.kartka_edit, name='kartka_update'),
    path('kartky/<int:pk>/delete/', views.kartka_delete, name='kartka_delete'),

    path('specii/', views.specii_list, name='specii_list'),
    path('specii/<int:pk>/', views.specii_detail, name='specii_detail'),
    path('specii/new/', views.specii_edit, name='specii_create'),
    path('specii/<int:pk>/edit/', views.specii_edit, name='specii_update'),
    path('specii/<int:pk>/delete/', views.specii_delete, name='specii_delete'),

    path('sukhofrukty/', views.sukhofrukty_list, name='sukhofrukty_list'),
    path('sukhofrukty/<int:pk>/', views.sukhofrukty_detail, name='sukhofrukty_detail'),
    path('sukhofrukty/new/', views.sukhofrukty_edit, name='sukhofrukty_create'),
    path('sukhofrukty/<int:pk>/edit/', views.sukhofrukty_edit, name='sukhofrukty_update'),
    path('sukhofrukty/<int:pk>/delete/', views.sukhofrukty_delete, name='sukhofrukty_delete'),

    path('pereviznyky/', views.pereviznyky_list, name='pereviznyky_list'),
    path('pereviznyky/<int:pk>/', views.pereviznyky_detail, name='pereviznyky_detail'),
    path('pereviznyky/new/', views.pereviznyky_edit, name='pereviznyky_create'),
    path('pereviznyky/<int:pk>/edit/', views.pereviznyky_edit, name='pereviznyky_update'),
    path('pereviznyky/<int:pk>/delete/', views.pereviznyky_delete, name='pereviznyky_delete'),

    path('postachalnyky/', views.postachalnyky_list, name='postachalnyky_list'),
    path('postachalnyky/<int:pk>/', views.postachalnyky_detail, name='postachalnyky_detail'),
    path('postachalnyky/new/', views.postachalnyky_edit, name='postachalnyky_create'),
    path('postachalnyky/<int:pk>/edit/', views.postachalnyky_edit, name='postachalnyky_update'),
    path('postachalnyky/<int:pk>/delete/', views.postachalnyky_delete, name='postachalnyky_delete'),

    path('reklama/', views.reklama_list, name='reklama_list'),
    path('reklama/<int:pk>/', views.reklama_detail, name='reklama_detail'),
    path('reklama/new/', views.reklama_edit, name='reklama_create'),
    path('reklama/<int:pk>/edit/', views.reklama_edit, name='reklama_update'),
    path('reklama/<int:pk>/delete/', views.reklama_delete, name='reklama_delete'),

    path('postachannya/', views.postachannya_list, name='postachannya_list'),
    path('postachannya/<int:pk>/', views.postachannya_detail, name='postachannya_detail'),
    path('postachannya/new/', views.postachannya_edit, name='postachannya_create'),
    path('postachannya/<int:pk>/edit/', views.postachannya_edit, name='postachannya_update'),
    path('postachannya/<int:pk>/delete/', views.postachannya_delete, name='postachannya_delete'),

    path('znyzhka-specii/', views.znyzhka_specii_list, name='znyzhka_specii_list'),
    path('znyzhka-specii/<int:pk>/', views.znyzhka_specii_detail, name='znyzhka_specii_detail'),
    path('znyzhka-specii/new/', views.znyzhka_specii_edit, name='znyzhka_specii_create'),
    path('znyzhka-specii/<int:pk>/edit/', views.znyzhka_specii_edit, name='znyzhka_specii_update'),
    path('znyzhka-specii/<int:pk>/delete/', views.znyzhka_specii_delete, name='znyzhka_specii_delete'),

    path('znyzhka-sukhofrukty/', views.znyzhka_sukhofrukty_list, name='znyzhka_sukhofrukty_list'),
    path('znyzhka-sukhofrukty/<int:pk>/', views.znyzhka_sukhofrukty_detail, name='znyzhka_sukhofrukty_detail'),
    path('znyzhka-sukhofrukty/new/', views.znyzhka_sukhofrukty_edit, name='znyzhka_sukhofrukty_create'),
    path('znyzhka-sukhofrukty/<int:pk>/edit/', views.znyzhka_sukhofrukty_edit, name='znyzhka_sukhofrukty_update'),
    path('znyzhka-sukhofrukty/<int:pk>/delete/', views.znyzhka_sukhofrukty_delete, name='znyzhka_sukhofrukty_delete'),


    path('', lambda request: redirect('klyent_list', permanent=False)),
]