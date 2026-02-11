from django.urls import path
from appi_app import views

urlpatterns = [
    path('clients/', views.client_list, name='client_list'),
    path('clients/<int:pk>/', views.client_detail, name='client_detail'),
    path('clients/new/', views.client_edit, name='client_create'),
    path('clients/<int:pk>/edit/', views.client_edit, name='client_update'),
    path('clients/<int:pk>/delete/', views.client_delete, name='client_delete'),

    path('employees/', views.employee_list, name='employee_list'),
    path('employees/<int:pk>/', views.employee_detail, name='employee_detail'),
    path('employees/new/', views.employee_edit, name='employee_create'),
    path('employees/<int:pk>/edit/', views.employee_edit, name='employee_update'),
    path('employees/<int:pk>/delete/', views.employee_delete, name='employee_delete'),

    path('spices/', views.spice_list, name='spice_list'),
    path('spices/add/', views.spice_create, name='spice_create'),
    path('spices/edit/<int:spice_id>/', views.spice_edit, name='spice_edit'),
    path('spices/delete/<int:spice_id>/', views.spice_delete, name='spice_delete'),

    path('outlets/', views.outlet_list, name='outlet_list'),
    path('outlets/<int:pk>/', views.outlet_detail, name='outlet_detail'),
    path('outlets/new/', views.outlet_edit, name='outlet_create'),
    path('outlets/<int:pk>/edit/', views.outlet_edit, name='outlet_update'),
    path('outlets/<int:pk>/delete/', views.outlet_delete, name='outlet_delete'),

    path('cards/', views.card_list, name='card_list'),
    path('cards/<int:pk>/', views.card_detail, name='card_detail'),
    path('cards/new/', views.card_edit, name='card_create'),
    path('cards/<int:pk>/edit/', views.card_edit, name='card_update'),
    path('cards/<int:pk>/delete/', views.card_delete, name='card_delete'),

    path('suppliers/', views.supplier_list, name='supplier_list'),
    path('suppliers/<int:pk>/', views.supplier_detail, name='supplier_detail'),
    path('suppliers/new/', views.supplier_edit, name='supplier_create'),
    path('suppliers/<int:pk>/edit/', views.supplier_edit, name='supplier_update'),
    path('suppliers/<int:pk>/delete/', views.supplier_delete, name='supplier_delete'),
    path('suppliers/<int:supplier_id>/spices/', views.supplier_spices, name='supplier_spices'),

    path('supplier-spices/', views.supplier_spice_list, name='supplier_spice_list'),
    path('supplier-spices/<int:pk>/', views.supplier_spice_detail, name='supplier_spice_detail'),
    path('supplier-spices/new/', views.supplier_spice_edit, name='supplier_spice_create'),
    path('supplier-spices/<int:pk>/edit/', views.supplier_spice_edit, name='supplier_spice_update'),
    path('supplier-spices/<int:pk>/delete/', views.supplier_spice_delete, name='supplier_spice_delete'),

    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    path('profile/', views.profile_view, name='profile'),

    path('favorites/', views.favorite_list, name='favorite_list'),
    path('favorites/add/<int:spice_id>/', views.add_favorite, name='add_fav'),
    path('favorites/del/<int:fav_id>/', views.delete_favorite, name='del_fav'),
]
