# appi_app/views.py

import pymysql
import json
import base64
import binascii
from pathlib import Path
import sys
from datetime import date

from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

try:
    from repository import RepositoryManager
except ImportError:
    raise

class KlyentSerializer: pass


class PracivnykSerializer: pass


class TochkySerializer: pass


class KartkySerializer: pass


class SpeciiSerializer: pass


class FryktySerializer: pass


class PereviznykySerializer: pass


class PostachalnykySerializer: pass


class ReklamySerializer: pass


class PostachannyaSerializer: pass


class ZnyzkySpeciiSerializer: pass


class ZnyzkyFryktySerializer: pass


DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'MySQL',
    'database': 'mydb',
    'cursorclass': pymysql.cursors.DictCursor
}

try:
    conn = pymysql.connect(**DB_CONFIG)
    repos = RepositoryManager(conn)
except Exception as e:
    print(f"\nПомилка підключення до БД: {e}\n")
    repos = None


def serialize(obj):
    if obj is None:
        return None
    return obj.__dict__



def basic_auth_required(view_func):

    def _wrapped_view(request, *args, **kwargs):
        unauth_response = JsonResponse({"error": "Аутентифікація не пройдена"}, status=401)
        unauth_response['WWW-Authenticate'] = 'Basic realm="API"'
        if request.user.is_authenticated:
            return view_func(request, *args, **kwargs)
        if 'HTTP_AUTHORIZATION' not in request.META:
            return unauth_response
        auth = request.META['HTTP_AUTHORIZATION'].split()
        if len(auth) != 2 or auth[0].lower() != "basic":
            return unauth_response
        try:
            auth_data = base64.b64decode(auth[1]).decode('utf-8')
            username, password = auth_data.split(':', 1)
            user = authenticate(username=username, password=password)
            if user is not None:
                return view_func(request, *args, **kwargs)
            else:
                return unauth_response
        except (UnicodeDecodeError, TypeError, ValueError, binascii.Error):
            return unauth_response

    return _wrapped_view



def _crud_list(request, repo, entity_name):
    if request.method == 'GET':
        items = repo.all()
        data = [serialize(i) for i in items]
        return JsonResponse(data, safe=False, json_dumps_params={'ensure_ascii': False, 'indent': 4})
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            new_item = repo.create(**data)
            conn.commit()
            return JsonResponse(serialize(new_item), status=201, json_dumps_params={'ensure_ascii': False})
        except Exception as e:
            return JsonResponse({"error": f"Некоректна інформація для створення сутності {entity_name}: {e}"}, status=400)
    else:
        return JsonResponse({"error": f"Нема доступу до методу {request.method}"}, status=405)


def _crud_detail(request, id, repo, entity_name):
    try:
        if request.method == 'GET':
            item = repo.get_by_id(id)
            return JsonResponse(serialize(item), json_dumps_params={'ensure_ascii': False}) if item else JsonResponse(
                {"error": f"{entity_name} не знайдено"}, status=404)
        elif request.method == 'PUT':
            data = json.loads(request.body)
            updated_item = repo.update(id, **data)
            if updated_item:
                conn.commit()
            return JsonResponse(serialize(updated_item),
                                json_dumps_params={'ensure_ascii': False}) if updated_item else JsonResponse(
                {"error": f"{entity_name} не знайдено"}, status=404)
        elif request.method == 'DELETE':
            repo.delete(id)
            conn.commit()
            return HttpResponse(status=204)
        else:
            return JsonResponse({"error": f"Нема доступу до методу {request.method}"}, status=405)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


def drf_handle_crud(repo, request, pk=None):

    if pk is None:
        response_django_type = _crud_list(request, repo, repo.__class__.__name__)
    else:
        response_django_type = _crud_detail(request, pk, repo, repo.__class__.__name__)

    if isinstance(response_django_type, JsonResponse):
        status_code = response_django_type.status_code
        try:
            content = json.loads(response_django_type.content.decode('utf-8'))
        except json.JSONDecodeError:
            content = {"message": "Пусте повідомлення або не коректний JSON"}
        return Response(content, status=status_code)

    elif isinstance(response_django_type, HttpResponse) and response_django_type.status_code == 204:
        return Response(status=status.HTTP_204_NO_CONTENT)

    return Response({"error": "Внутрішня помилка обробки запиту"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class BaseViewSet(viewsets.ViewSet):

    def list(self, request): return drf_handle_crud(self.repo, request, pk=None)

    def retrieve(self, request, pk=None): return drf_handle_crud(self.repo, request, pk=pk)

    def create(self, request): return drf_handle_crud(self.repo, request, pk=None)

    def update(self, request, pk=None): return drf_handle_crud(self.repo, request, pk=pk)

    def destroy(self, request, pk=None): return drf_handle_crud(self.repo, request, pk=pk)


class KlyentyViewSet(BaseViewSet):
    repo = repos.klyenty


class PracivnykyViewSet(BaseViewSet):
    repo = repos.pracivnyky

    @action(detail=False, methods=['get'])
    def report(self, request):
        if not repos:
            return Response({"error": "База даних не підключена"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            tochky = repos.tochky.all()
            pracivnyky = repos.pracivnyky.all()

            if not pracivnyky:
                print("--- ЗВІТ ПРАЦІВНИКІВ: Репозиторій pracivnyky.all() повернув порожній список ---")
            if not tochky:
                print("--- ЗВІТ ПРАЦІВНИКІВ: Репозиторій tochky.all() повернув порожній список ---")


            tochka_map = {t.id: t.nazva for t in tochky}

            detailed_report = []

            for p in pracivnyky:
                prizvyshche = getattr(p, 'prizvyshche', '')
                imya = getattr(p, 'imya', '')
                pobatkovi = getattr(p, 'pobatkovi', '')

                full_name = f"{prizvyshche} {imya} {pobatkovi}".strip()

                tochka_id = getattr(p, 'id_tochka', None)


                # full_name = f"{p.prizvyshche} {p.imya} {p.pobatkovi}"

                # tochka_id = p.id_tochka

                if tochka_id and tochka_id in tochka_map:
                    tochka_nazva = tochka_map[tochka_id]
                else:
                    tochka_nazva = "Не призначена"

                detailed_report.append({
                    "Працівник": full_name,
                    "Працює у торгові точці": tochka_nazva
                })

            return Response()

        except Exception as e:
            print("==============================================")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class TochkyViewSet(BaseViewSet):
    repo = repos.tochky


class KartkyViewSet(BaseViewSet):
    repo = repos.kartky


class SpeciiViewSet(BaseViewSet):
    repo = repos.specii


class FryktyViewSet(BaseViewSet):
    repo = repos.frykty


class PereviznykyViewSet(BaseViewSet):
    repo = repos.pereviznyky


class PostachalnykyViewSet(BaseViewSet):
    repo = repos.postachalnyky


class ReklamyViewSet(BaseViewSet):
    repo = repos.reklamy


class PostachannyaViewSet(BaseViewSet):
    repo = repos.postachannya


class ZnyzkySpeciiViewSet(BaseViewSet):
    repo = repos.znyzky_na_specii


class ZnyzkyFryktyViewSet(BaseViewSet):
    repo = repos.znyzky_na_frykty
