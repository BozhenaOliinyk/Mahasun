from django.urls import path
from appi_app import views

urlpatterns = [
    path('clients/', views.client_list, name='client_list'),
    path('clients/<int:pk>/delete/', views.client_delete, name='client_delete'),

    path('employees/', views.employee_list, name='employee_list'),
    path('employees/new/', views.employee_edit, name='employee_create'),
    path('employees/<int:pk>/edit/', views.employee_edit, name='employee_update'),
    path('employees/<int:pk>/delete/', views.employee_delete, name='employee_delete'),

    path('spices/', views.spice_list, name='spice_list'),
    path('spices/add/', views.spice_create, name='spice_create'),
    path('spices/edit/<int:spice_id>/', views.spice_edit, name='spice_edit'),
    path('spices/delete/<int:spice_id>/', views.spice_delete, name='spice_delete'),

    path('outlets/', views.outlet_list, name='outlet_list'),
    path('outlets/new/', views.outlet_edit, name='outlet_create'),
    path('outlets/<int:pk>/edit/', views.outlet_edit, name='outlet_update'),
    path('outlets/<int:pk>/delete/', views.outlet_delete, name='outlet_delete'),

    path('cards/', views.card_list, name='card_list'),
    path('cards/new/', views.card_edit, name='card_create'),
    path('cards/<int:pk>/edit/', views.card_edit, name='card_update'),
    path('cards/<int:pk>/delete/', views.card_delete, name='card_delete'),

    path('suppliers/', views.supplier_list, name='supplier_list'),
    path('suppliers/new/', views.supplier_edit, name='supplier_create'),
    path('suppliers/<int:pk>/edit/', views.supplier_edit, name='supplier_update'),
    path('suppliers/<int:pk>/delete/', views.supplier_delete, name='supplier_delete'),
    path('suppliers/<int:supplier_id>/spices/', views.supplier_spices, name='supplier_spices'),

    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    path('profile/', views.profile_view, name='profile'),

    path('favorites/', views.favorite_list, name='favorite_list'),
    path('favorites/add_del/<int:spice_id>/', views.add_del_favorite, name='add_del_fav')
]
