import json
import os
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional

from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import user_passes_test
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse, HttpRequest, HttpResponse, FileResponse
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .alerts import send_admin_alert
from .models import (
    BonusCard,
    Client,
    Employee,
    Favorite,
    RetailOutlet,
    Spice,
    Supplier,
    SupplierSpice,
)


def is_admin(user) -> bool:
    return bool(user.is_authenticated and user.is_staff)


def _json_ok(data: Optional[Dict[str, Any]] = None, status: int = 200) -> JsonResponse:
    payload = {"ok": True}
    if data:
        payload.update(data)
    return JsonResponse(payload, status=status)


def _json_error(message: str, status: int = 400) -> JsonResponse:
    return JsonResponse({"ok": False, "error": message}, status=status)


def _parse_json(request: HttpRequest) -> Dict[str, Any]:
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}


def _build_rows(queryset, fields: List[str]) -> List[Dict[str, Any]]:
    rows = []
    for obj in queryset:
        values = []
        for f in fields:
            v = getattr(obj, f, "")
            values.append(str(v) if v is not None else "")
        rows.append({"id": obj.pk, "values": values})
    return rows


def _get_client_from_session(request: HttpRequest) -> Optional[Client]:
    client_id = request.session.get("client_id")
    if not client_id:
        return None
    try:
        return Client.objects.select_related("bonus_card").get(pk=client_id)
    except Client.DoesNotExist:
        request.session.pop("client_id", None)
        return None


def _ensure_admin(request: HttpRequest) -> Optional[JsonResponse]:
    if not is_admin(request.user):
        return _json_error("Доступ заборонено", status=403)
    return None


@require_http_methods(["GET"])
def session_view(request: HttpRequest) -> JsonResponse:
    client = _get_client_from_session(request)
    return JsonResponse({
        "is_admin": bool(is_admin(request.user)),
        "is_authenticated": bool(request.user.is_authenticated),
        "has_client_session": bool(client is not None),
    })


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request: HttpRequest) -> JsonResponse:
    data = _parse_json(request)
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    ADMIN_EMAIL = "admin@spice.com"
    ADMIN_PASSWORD = "bozhenaspices"

    request.session.pop("client_id", None)

    if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
        admin_user = User.objects.filter(email=ADMIN_EMAIL).first()
        if not admin_user:
            return _json_error("Адміна не знайдено", status=404)
        login(request, admin_user)
        return _json_ok({"role": "admin", "redirect": "/"})

    client = Client.objects.filter(email=email, password=password).first()
    if client:
        logout(request)
        request.session["client_id"] = client.id
        return _json_ok({"role": "client", "redirect": "/"})

    return _json_error("Невірний логін або пароль", status=401)


@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request: HttpRequest) -> JsonResponse:
    logout(request)
    request.session.pop("client_id", None)
    return _json_ok({"redirect": "/"})


@csrf_exempt
@require_http_methods(["POST"])
def register_view(request: HttpRequest) -> JsonResponse:
    data = _parse_json(request)
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    last_name = (data.get("last_name") or "").strip()
    first_name = (data.get("first_name") or "").strip()
    phone_number = (data.get("phone_number") or "").strip()

    if not email or not password:
        return _json_error("Заповніть пошту та пароль")
    if Client.objects.filter(email=email).exists():
        return _json_error("Клієнт з такою поштою вже існує")

    card = BonusCard.objects.filter(pk=1).first()
    client = Client.objects.create(
        last_name=last_name, first_name=first_name,
        email=email, password=password,
        bonus_count=100, bonus_card=card, phone_number=phone_number
    )
    request.session["client_id"] = client.id
    return _json_ok({"client_id": client.id, "redirect": "/"})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def profile_view(request: HttpRequest) -> JsonResponse:
    client = _get_client_from_session(request)
    if not client: return _json_error("Потрібен вхід", status=401)

    if request.method == "GET":
        return JsonResponse({
            "last_name": client.last_name or "", "first_name": client.first_name or "",
            "phone_number": client.phone_number or "", "bonus_count": int(client.bonus_count or 0),
            "bonus_card_type": (client.bonus_card.type if client.bonus_card else "")
        })

    data = _parse_json(request)
    client.last_name = (data.get("ln") or "").strip()
    client.first_name = (data.get("fn") or "").strip()
    client.phone_number = (data.get("phone") or "").strip()
    client.save()
    return _json_ok()


@require_http_methods(["GET"])
def favorite_list(request: HttpRequest) -> JsonResponse:
    client = _get_client_from_session(request)
    if not client: return JsonResponse({"favorites": []})
    favs = Favorite.objects.filter(client_id=client.id).select_related("spice")
    result = [{"spice_id": f.spice.id, "name": f.spice.name, "price": str(f.spice.price)} for f in favs if f.spice]
    return JsonResponse({"favorites": result})


@csrf_exempt
@require_http_methods(["POST"])
def add_del_favorite(request: HttpRequest, spice_id: int) -> JsonResponse:
    client = _get_client_from_session(request)
    if not client: return _json_error("Потрібен вхід", status=401)
    fav = Favorite.objects.filter(client_id=client.id, spice_id=spice_id).first()
    if fav:
        fav.delete()
        return _json_ok({"active": False})
    Favorite.objects.create(client_id=client.id, spice_id=spice_id)
    return _json_ok({"active": True})


@require_http_methods(["GET"])
def spice_list(request: HttpRequest) -> JsonResponse:
    spices = Spice.objects.all()
    client = _get_client_from_session(request)
    fav_ids = list(Favorite.objects.filter(client_id=client.id).values_list("spice_id", flat=True)) if client else []
    rows = _build_rows(spices, fields=["id", "name", "type", "purpose", "price"])
    return JsonResponse({"rows": rows, "fav_ids": fav_ids})


@require_http_methods(["GET"])
def spice_detail(request: HttpRequest, spice_id: int) -> JsonResponse:
    spice = get_object_or_404(Spice, pk=spice_id)
    rel = SupplierSpice.objects.filter(spice=spice).select_related("supplier").first()
    return JsonResponse({
        "id": spice.id, "name": spice.name, "type": spice.type, "purpose": spice.purpose,
        "price": str(spice.price), "current_supplier": (rel.supplier.name if rel else "")
    })


@csrf_exempt
@require_http_methods(["POST"])
@transaction.atomic
def spice_create(request: HttpRequest) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard: return admin_guard
    data = _parse_json(request)
    spice = Spice.objects.create(
        name=data.get("name", "").strip(), type=data.get("type", "").strip(),
        purpose=data.get("purpose", "").strip(), price=data.get("price") or 0
    )
    sup_name = data.get("supplier_name", "").strip()
    if sup_name:
        sup = Supplier.objects.filter(name__iexact=sup_name).first()
        if sup: SupplierSpice.objects.create(supplier=sup, spice=spice)
    return _json_ok({"id": spice.id})


@csrf_exempt
@require_http_methods(["GET", "POST"])
@transaction.atomic
def spice_edit(request: HttpRequest, spice_id: int) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard: return admin_guard
    spice = get_object_or_404(Spice, pk=spice_id)
    if request.method == "GET":
        rel = SupplierSpice.objects.filter(spice=spice).select_related("supplier").first()
        return JsonResponse({"id": spice.id, "name": spice.name, "price": str(spice.price),
                             "current_supplier": (rel.supplier.name if rel else "")})

    data = _parse_json(request)
    spice.name, spice.price = data.get("name", spice.name), data.get("price", spice.price)
    spice.save()
    return _json_ok({"id": spice.id})


@csrf_exempt
@require_http_methods(["POST"])
def spice_delete(request: HttpRequest, spice_id: int) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard: return admin_guard
    Spice.objects.filter(pk=spice_id).delete()
    return _json_ok()


@require_http_methods(["GET"])
def spice_filter(request: HttpRequest) -> JsonResponse:
    purpose, type_ = request.GET.get("purpose"), request.GET.get("type")
    spices = Spice.objects.all()
    if purpose: spices = spices.filter(purpose__iexact=purpose)
    if type_: spices = spices.filter(type__iexact=type_)
    rows = _build_rows(spices, fields=["id", "name", "type", "purpose", "price"])
    return JsonResponse({"rows": rows})


@require_http_methods(["GET"])
def spice_search(request: HttpRequest) -> JsonResponse:
    q = request.GET.get("q", "").strip()
    spices = Spice.objects.filter(name__icontains=q) if q else Spice.objects.all()
    rows = _build_rows(spices, fields=["id", "name", "type", "purpose", "price"])
    return JsonResponse({"rows": rows})


@require_http_methods(["GET"])
def card_list(request: HttpRequest) -> JsonResponse:
    cards = BonusCard.objects.all()
    rows = _build_rows(cards, fields=["id", "type", "bonus_percent", "discount"])
    client = _get_client_from_session(request)
    return JsonResponse({"rows": rows, "my_card_id": client.bonus_card_id if client else None})


@require_http_methods(["GET"])
def card_detail(request: HttpRequest, pk: int) -> JsonResponse:
    obj = get_object_or_404(BonusCard, pk=pk)
    return JsonResponse({"id": obj.id, "type": obj.type, "bonus_percent": obj.bonus_percent, "discount": obj.discount})


@csrf_exempt
@require_http_methods(["POST"])
def card_edit(request: HttpRequest, pk: Optional[int] = None) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard: return admin_guard
    data = _parse_json(request)
    obj = get_object_or_404(BonusCard, pk=pk) if pk else BonusCard()
    obj.type, obj.bonus_percent, obj.discount = data.get("type"), data.get("bonus_percent", 0), data.get("discount", 0)
    obj.save()
    return _json_ok({"id": obj.id})


@csrf_exempt
def card_delete(request: HttpRequest, pk: int) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard: return admin_guard
    BonusCard.objects.filter(pk=pk).delete()
    return _json_ok()



@require_http_methods(["GET"])
def outlet_list(request: HttpRequest) -> JsonResponse:
    rows = _build_rows(RetailOutlet.objects.all(), fields=["id", "name", "address"])
    return JsonResponse({"rows": rows})


@require_http_methods(["GET"])
def outlet_detail(request: HttpRequest, pk: int) -> JsonResponse:
    obj = get_object_or_404(RetailOutlet, pk=pk)
    return JsonResponse({"id": obj.id, "name": obj.name, "address": obj.address})


@csrf_exempt
def outlet_edit(request: HttpRequest, pk: Optional[int] = None) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard: return admin_guard
    data = _parse_json(request)
    obj = get_object_or_404(RetailOutlet, pk=pk) if pk else RetailOutlet()
    obj.name, obj.address = data.get("name"), data.get("address")
    obj.save()
    return _json_ok({"id": obj.id})


@csrf_exempt
def outlet_delete(request: HttpRequest, pk: int) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard: return admin_guard
    RetailOutlet.objects.filter(pk=pk).delete()
    return _json_ok()


@require_http_methods(["GET"])
def outlet_search(request: HttpRequest) -> JsonResponse:
    q = request.GET.get("q", "").strip()
    outlets = RetailOutlet.objects.filter(address__icontains=q) if q else RetailOutlet.objects.all()
    return JsonResponse({"rows": _build_rows(outlets, fields=["id", "name", "address"])})



@user_passes_test(is_admin)
@require_http_methods(["GET"])
def employee_list(request: HttpRequest) -> JsonResponse:
    emps = Employee.objects.select_related("outlet").all()
    rows = [{"id": e.pk,
             "values": [str(e.pk), e.last_name, e.first_name, e.fathers_name or "", e.position, str(e.shift),
                        e.outlet.name if e.outlet else "", e.phone_number]} for e in emps]
    return JsonResponse({"rows": rows})


@user_passes_test(is_admin)
@require_http_methods(["GET"])
def employee_detail(request: HttpRequest, pk: int) -> JsonResponse:
    e = get_object_or_404(Employee, pk=pk)
    return JsonResponse({"id": e.id, "last_name": e.last_name, "first_name": e.first_name, "position": e.position,
                         "outlet_id": e.outlet_id, "shift": e.shift, "phone_number": e.phone_number})


@csrf_exempt
@user_passes_test(is_admin)
@require_http_methods(["POST"])
def employee_edit(request: HttpRequest, pk: Optional[int] = None) -> JsonResponse:
    data = _parse_json(request)
    obj = get_object_or_404(Employee, pk=pk) if pk else Employee()
    obj.last_name, obj.first_name = data.get("last_name"), data.get("first_name")
    obj.position, obj.shift = data.get("position"), int(data.get("shift") or 0)
    obj.phone_number = data.get("phone_number")
    oid = data.get("outlet_id") or data.get("outlet")
    if oid: obj.outlet_id = int(oid)
    obj.save()
    return _json_ok({"id": obj.id})


@csrf_exempt
@user_passes_test(is_admin)
def employee_delete(request: HttpRequest, pk: int) -> JsonResponse:
    Employee.objects.filter(pk=pk).delete()
    return _json_ok()


@require_http_methods(["GET"])
def employee_search(request: HttpRequest) -> JsonResponse:
    q = request.GET.get("q", "").strip()
    emps = Employee.objects.filter(
        Q(last_name__icontains=q) | Q(first_name__icontains=q)) if q else Employee.objects.all()
    rows = [{"id": e.pk, "values": [str(e.pk), e.last_name, e.first_name, "", e.position, str(e.shift),
                                    e.outlet.name if e.outlet else "", e.phone_number]} for e in emps]
    return JsonResponse({"rows": rows})


@user_passes_test(is_admin)
@require_http_methods(["GET"])
def client_list(request: HttpRequest) -> JsonResponse:
    clients = Client.objects.select_related("bonus_card").all()
    rows = [{"id": c.pk, "values": [str(c.pk), c.last_name, c.first_name, c.fathers_name or "",
                                    c.bonus_card.type if c.bonus_card else "", str(c.bonus_count), c.phone_number]} for
            c in clients]
    return JsonResponse({"rows": rows})


@csrf_exempt
@user_passes_test(is_admin)
def client_delete(request: HttpRequest, pk: int) -> JsonResponse:
    Client.objects.filter(pk=pk).delete()
    return _json_ok()


@require_http_methods(["GET"])
def client_search(request: HttpRequest) -> JsonResponse:
    q = request.GET.get("q", "").strip()
    clients = Client.objects.filter(
        Q(last_name__icontains=q) | Q(first_name__icontains=q)) if q else Client.objects.all()
    rows = [{"id": c.pk, "values": ["", c.last_name, c.first_name, "", c.bonus_card.type if c.bonus_card else "",
                                    str(c.bonus_count), c.email]} for c in clients]
    return JsonResponse({"rows": rows})


@user_passes_test(is_admin)
@require_http_methods(["GET"])
def supplier_list(request: HttpRequest) -> JsonResponse:
    return JsonResponse({"rows": _build_rows(Supplier.objects.all(), fields=["id", "name", "address", "phone_number"])})


@user_passes_test(is_admin)
@require_http_methods(["GET"])
def supplier_detail(request: HttpRequest, pk: int) -> JsonResponse:
    obj = get_object_or_404(Supplier, pk=pk)
    spices = list(SupplierSpice.objects.filter(supplier=obj).values_list("spice__name", flat=True))
    return JsonResponse(
        {"id": obj.id, "name": obj.name, "address": obj.address, "phone_number": obj.phone_number, "spices": spices})


@csrf_exempt
@user_passes_test(is_admin)
def supplier_edit(request: HttpRequest, pk: Optional[int] = None) -> JsonResponse:
    data = _parse_json(request)
    obj = get_object_or_404(Supplier, pk=pk) if pk else Supplier()
    obj.name, obj.address, obj.phone_number = data.get("name"), data.get("address"), data.get("phone_number")
    obj.save()
    return _json_ok({"id": obj.id})


@csrf_exempt
@user_passes_test(is_admin)
@transaction.atomic
def supplier_delete(request: HttpRequest, pk: int) -> JsonResponse:
    sup = get_object_or_404(Supplier, pk=pk)
    rels = SupplierSpice.objects.filter(supplier=sup)
    for r in rels:
        if SupplierSpice.objects.filter(spice=r.spice).count() == 1: r.spice.delete()
    sup.delete()
    return _json_ok()


@require_http_methods(["GET"])
def supplier_search(request: HttpRequest) -> JsonResponse:
    q = request.GET.get("q", "").strip()
    sups = Supplier.objects.filter(name__icontains=q) if q else Supplier.objects.all()
    return JsonResponse({"rows": _build_rows(sups, fields=["id", "name", "address", "phone_number"])})


@user_passes_test(is_admin)
def supplier_spices(request: HttpRequest, supplier_id: int) -> JsonResponse:
    rels = SupplierSpice.objects.filter(supplier_id=supplier_id).select_related("spice")
    return JsonResponse({"spices": [r.spice.name for r in rels if r.spice]})


def spa_index(request):
    return FileResponse(open(settings.BASE_DIR / "my-spa" / "dist" / "index.html", "rb"))