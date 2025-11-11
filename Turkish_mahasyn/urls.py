# urls.py

from django.urls import path, include
from rest_framework import routers
from appi_app import views
from django.views.decorators.csrf import csrf_exempt

router = routers.DefaultRouter()

router.register(r'klyenty', views.KlyentyViewSet, basename='klyenty')
router.register(r'pracivnyky', views.PracivnykyViewSet, basename='pracivnyky')
router.register(r'tochky', views.TochkyViewSet, basename='tochky')
router.register(r'kartky', views.KartkyViewSet, basename='kartky')
router.register(r'specii', views.SpeciiViewSet, basename='specii')
router.register(r'frykty', views.FryktyViewSet, basename='frykty')
router.register(r'pereviznyky', views.PereviznykyViewSet, basename='pereviznyky')
router.register(r'postachalnyky', views.PostachalnykyViewSet, basename='postachalnyky')
router.register(r'reklamy', views.ReklamyViewSet, basename='reklamy')
router.register(r'postachannya', views.PostachannyaViewSet, basename='postachannya')
router.register(r'znyzky_specii', views.ZnyzkySpeciiViewSet, basename='znyzky_specii')
router.register(r'znyzky_frykty', views.ZnyzkyFryktyViewSet, basename='znyzky_frykty')

urlpatterns = [
    path('', include(router.urls)),

]