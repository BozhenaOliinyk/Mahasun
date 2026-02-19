import json
import os
from typing import Any, Dict, List, Optional

from django.conf import settings
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import user_passes_test
from django.contrib.auth.models import User
from django.db import transaction
from django.http import JsonResponse, HttpRequest, HttpResponse, FileResponse, HttpResponseNotFound
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.views.static import serve

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
        return _json_ok({
            "role": "admin",
            "redirect": "/",
        })

    client = Client.objects.filter(email=email, password=password).first()
    if client:
        logout(request)
        request.session["client_id"] = client.id
        return _json_ok({
            "role": "client",
            "redirect": "/",
        })

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
    fathers_name = (data.get("fathers_name") or "").strip() or None
    phone_number = (data.get("phone_number") or "").strip()

    if not email or not password:
        return _json_error("Заповніть пошту та пароль")

    if Client.objects.filter(email=email).exists():
        return _json_error("Клієнт з такою поштою вже існує")

    card = BonusCard.objects.filter(pk=1).first()

    client = Client.objects.create(
        last_name=last_name,
        first_name=first_name,
        fathers_name=fathers_name,
        email=email,
        password=password,
        bonus_count=100,
        bonus_card=card,
        phone_number=phone_number,
    )
    request.session["client_id"] = client.id
    return _json_ok({"client_id": client.id, "redirect": "/"})



@csrf_exempt
@require_http_methods(["GET", "POST"])
def profile_view(request: HttpRequest) -> JsonResponse:
    client = _get_client_from_session(request)
    if not client:
        return _json_error("Потрібен вхід", status=401)

    if request.method == "GET":
        return JsonResponse({
            "last_name": client.last_name or "",
            "first_name": client.first_name or "",
            "fathers_name": client.fathers_name or "",
            "phone_number": client.phone_number or "",
            "bonus_card_type": (client.bonus_card.type if client.bonus_card else ""),
            "bonus_count": int(client.bonus_count or 0),
        })

    data = _parse_json(request)
    client.last_name = (data.get("ln") or "").strip()
    client.first_name = (data.get("fn") or "").strip()
    client.fathers_name = (data.get("mn") or "").strip() or None
    client.phone_number = (data.get("phone") or "").strip()
    client.save()

    return _json_ok({
        "last_name": client.last_name or "",
        "first_name": client.first_name or "",
        "fathers_name": client.fathers_name or "",
        "phone_number": client.phone_number or "",
    })


@require_http_methods(["GET"])
def favorite_list(request: HttpRequest) -> JsonResponse:
    client = _get_client_from_session(request)
    if not client:
        return JsonResponse({"favorites": []})

    favorites = (
        Favorite.objects
        .filter(client_id=client.id)
        .select_related("spice")
    )
    result = []
    for fav in favorites:
        spice = fav.spice
        if spice:
            result.append({
                "spice_id": spice.id,
                "name": spice.name or "",
                "price": str(spice.price) if spice.price is not None else "",
            })
    return JsonResponse({"favorites": result})


@csrf_exempt
@require_http_methods(["POST"])
def add_del_favorite(request: HttpRequest, spice_id: int) -> JsonResponse:
    client = _get_client_from_session(request)
    if not client:
        return _json_error("Потрібен вхід", status=401)

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
    fav_ids: List[int] = []
    if client:
        fav_ids = list(
            Favorite.objects.filter(client_id=client.id).values_list("spice_id", flat=True)
        )

    rows = _build_rows(spices, fields=["id", "name", "type", "purpose", "price"])
    return JsonResponse({"rows": rows, "fav_ids": fav_ids})


@require_http_methods(["GET"])
def spice_detail(request: HttpRequest, spice_id: int) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard:
        return admin_guard

    spice = get_object_or_404(Spice, pk=spice_id)
    current_rel = SupplierSpice.objects.filter(spice=spice).select_related("supplier").first()
    return JsonResponse({
        "id": spice.id,
        "name": spice.name or "",
        "type": spice.type or "",
        "purpose": spice.purpose or "",
        "price": str(spice.price) if spice.price is not None else "",
        "current_supplier": (current_rel.supplier.name if current_rel and current_rel.supplier else ""),
    })


@csrf_exempt
@require_http_methods(["POST"])
@transaction.atomic
def spice_create(request: HttpRequest) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard:
        return admin_guard

    data = _parse_json(request)
    spice = Spice.objects.create(
        name=(data.get("name") or "").strip(),
        type=(data.get("type") or "").strip(),
        purpose=(data.get("purpose") or "").strip(),
        price=data.get("price") or 0,
    )

    supplier_name = (data.get("supplier_name") or "").strip()
    if supplier_name:
        supplier = Supplier.objects.filter(name__iexact=supplier_name).first()
        if supplier:
            SupplierSpice.objects.get_or_create(supplier=supplier, spice=spice)

    return _json_ok({"id": spice.id})


@csrf_exempt
@require_http_methods(["GET", "POST"])
@transaction.atomic
def spice_edit(request: HttpRequest, spice_id: int) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard:
        return admin_guard

    spice = get_object_or_404(Spice, pk=spice_id)

    if request.method == "GET":
        current_rel = SupplierSpice.objects.filter(spice=spice).select_related("supplier").first()
        return JsonResponse({
            "id": spice.id,
            "name": spice.name or "",
            "type": spice.type or "",
            "purpose": spice.purpose or "",
            "price": str(spice.price) if spice.price is not None else "",
            "current_supplier": (current_rel.supplier.name if current_rel and current_rel.supplier else ""),
        })

    data = _parse_json(request)
    spice.name = (data.get("name") or "").strip()
    spice.type = (data.get("type") or "").strip()
    spice.purpose = (data.get("purpose") or "").strip()
    spice.price = data.get("price") or 0
    spice.save()

    supplier_name = (data.get("supplier_name") or "").strip()
    if supplier_name:
        supplier = Supplier.objects.filter(name__iexact=supplier_name).first()
        if supplier:
            SupplierSpice.objects.update_or_create(
                spice=spice,
                defaults={"supplier": supplier},
            )

    return _json_ok({"id": spice.id})


@csrf_exempt
@require_http_methods(["POST"])
def spice_delete(request: HttpRequest, spice_id: int) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard:
        return admin_guard

    Spice.objects.filter(pk=spice_id).delete()
    return _json_ok()



@require_http_methods(["GET"])
def card_list(request: HttpRequest) -> JsonResponse:
    cards = BonusCard.objects.all()
    rows = _build_rows(cards, fields=["id", "type", "bonus_percent", "discount"])
    return JsonResponse({"rows": rows})


@require_http_methods(["GET"])
def card_detail(request: HttpRequest, pk: int) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard:
        return admin_guard

    obj = get_object_or_404(BonusCard, pk=pk)
    return JsonResponse({
        "id": obj.id,
        "type": obj.type or "",
        "bonus_percent": int(obj.bonus_percent or 0),
        "discount": int(obj.discount or 0),
    })


@csrf_exempt
@require_http_methods(["POST"])
def card_edit(request: HttpRequest, pk: Optional[int] = None) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard:
        return admin_guard

    data = _parse_json(request)

    obj = None
    if pk is not None:
        obj = get_object_or_404(BonusCard, pk=pk)
    else:
        obj = BonusCard()

    obj.type = (data.get("type") or "").strip()
    obj.bonus_percent = int(data.get("bonus_percent") or 0)
    obj.discount = int(data.get("discount") or 0)
    obj.save()

    return _json_ok({"id": obj.id})


@csrf_exempt
@require_http_methods(["POST"])
def card_delete(request: HttpRequest, pk: int) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard:
        return admin_guard

    obj = get_object_or_404(BonusCard, pk=pk)
    obj.delete()
    return _json_ok()



@require_http_methods(["GET"])
def outlet_list(request: HttpRequest) -> JsonResponse:
    outlets = RetailOutlet.objects.all()
    rows = _build_rows(outlets, fields=["id", "name", "address"])
    return JsonResponse({"rows": rows})


@require_http_methods(["GET"])
def outlet_detail(request: HttpRequest, pk: int) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard:
        return admin_guard

    obj = get_object_or_404(RetailOutlet, pk=pk)
    return JsonResponse({
        "id": obj.id,
        "name": obj.name or "",
        "address": obj.address or "",
    })


@csrf_exempt
@require_http_methods(["POST"])
def outlet_edit(request: HttpRequest, pk: Optional[int] = None) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard:
        return admin_guard

    data = _parse_json(request)

    obj = None
    if pk is not None:
        obj = get_object_or_404(RetailOutlet, pk=pk)
    else:
        obj = RetailOutlet()

    obj.name = (data.get("name") or "").strip()
    obj.address = (data.get("address") or "").strip()
    obj.save()

    return _json_ok({"id": obj.id})


@csrf_exempt
@require_http_methods(["POST"])
def outlet_delete(request: HttpRequest, pk: int) -> JsonResponse:
    admin_guard = _ensure_admin(request)
    if admin_guard:
        return admin_guard

    obj = get_object_or_404(RetailOutlet, pk=pk)
    obj.delete()
    return _json_ok()



@user_passes_test(is_admin)
@require_http_methods(["GET"])
def employee_list(request: HttpRequest) -> JsonResponse:
    employees = Employee.objects.select_related("outlet").all()
    rows = []
    for e in employees:
        rows.append({
            "id": e.pk,
            "values": [
                str(e.pk),
                e.last_name or "",
                e.first_name or "",
                e.fathers_name or "",
                e.position or "",
                str(e.shift) if e.shift is not None else "",
                e.outlet.name if e.outlet else "",
                e.phone_number or "",
            ]
        })
    return JsonResponse({"rows": rows})


@user_passes_test(is_admin)
@require_http_methods(["GET"])
def employee_detail(request: HttpRequest, pk: int) -> JsonResponse:
    obj = get_object_or_404(Employee.objects.select_related("outlet"), pk=pk)
    return JsonResponse({
        "id": obj.id,
        "last_name": obj.last_name or "",
        "first_name": obj.first_name or "",
        "fathers_name": obj.fathers_name or "",
        "position": obj.position or "",
        "shift": int(obj.shift or 0),
        "phone_number": obj.phone_number or "",
        "outlet_id": obj.outlet_id,
    })


@csrf_exempt
@user_passes_test(is_admin)
@require_http_methods(["POST"])
def employee_edit(request: HttpRequest, pk: Optional[int] = None) -> JsonResponse:
    data = _parse_json(request)

    obj = None
    if pk is not None:
        obj = get_object_or_404(Employee, pk=pk)
    else:
        obj = Employee()

    obj.last_name = (data.get("last_name") or "").strip()
    obj.first_name = (data.get("first_name") or "").strip()
    obj.fathers_name = (data.get("fathers_name") or "").strip() or None
    obj.position = (data.get("position") or "").strip()
    obj.shift = int(data.get("shift") or 0)
    obj.phone_number = (data.get("phone_number") or "").strip()

    outlet_id = data.get("outlet_id") or data.get("outlet")
    obj.outlet_id = int(outlet_id) if outlet_id else None

    obj.save()
    return _json_ok({"id": obj.id})


@csrf_exempt
@user_passes_test(is_admin)
@require_http_methods(["POST"])
def employee_delete(request: HttpRequest, pk: int) -> JsonResponse:
    obj = get_object_or_404(Employee, pk=pk)
    obj.delete()
    return _json_ok()



@user_passes_test(is_admin)
@require_http_methods(["GET"])
def client_list(request: HttpRequest) -> JsonResponse:
    clients = Client.objects.select_related("bonus_card").all()

    rows = []
    for c in clients:
        rows.append({
            "id": c.pk,
            "values": [
                str(c.pk),
                c.last_name or "",
                c.first_name or "",
                c.fathers_name or "",
                c.bonus_card.type if c.bonus_card else "",
                str(c.bonus_count) if c.bonus_count is not None else "0",
                c.phone_number or "",
            ]
        })
    return JsonResponse({"rows": rows})


@csrf_exempt
@user_passes_test(is_admin)
@require_http_methods(["POST"])
def client_delete(request: HttpRequest, pk: int) -> JsonResponse:
    Client.objects.filter(pk=pk).delete()
    return _json_ok()



@user_passes_test(is_admin)
@require_http_methods(["GET"])
def supplier_list(request: HttpRequest) -> JsonResponse:
    suppliers = Supplier.objects.all()
    rows = _build_rows(suppliers, fields=["id", "name", "address", "phone_number"])
    return JsonResponse({"rows": rows})


@user_passes_test(is_admin)
@require_http_methods(["GET"])
def supplier_detail(request: HttpRequest, pk: int) -> JsonResponse:
    obj = get_object_or_404(Supplier, pk=pk)

    spices = list(
        SupplierSpice.objects
        .filter(supplier=obj)
        .select_related("spice")
        .values_list("spice__name", flat=True)
    )

    return JsonResponse({
        "id": obj.id,
        "name": obj.name or "",
        "address": obj.address or "",
        "phone_number": obj.phone_number or "",
        "spices": spices,
    })


@csrf_exempt
@user_passes_test(is_admin)
@require_http_methods(["POST"])
def supplier_edit(request: HttpRequest, pk: Optional[int] = None) -> JsonResponse:
    data = _parse_json(request)

    obj = None
    if pk is not None:
        obj = get_object_or_404(Supplier, pk=pk)
    else:
        obj = Supplier()

    obj.name = (data.get("name") or "").strip()
    obj.address = (data.get("address") or "").strip()
    obj.phone_number = (data.get("phone_number") or "").strip()
    obj.save()

    return _json_ok({"id": obj.id})


@csrf_exempt
@user_passes_test(is_admin)
@require_http_methods(["POST"])
@transaction.atomic
def supplier_delete(request: HttpRequest, pk: int) -> JsonResponse:
    supplier = get_object_or_404(Supplier, pk=pk)

    relations = SupplierSpice.objects.filter(supplier=supplier).select_related("spice")

    for rel in relations:
        spice = rel.spice
        other_suppliers_count = (
            SupplierSpice.objects
            .filter(spice=spice)
            .exclude(supplier=supplier)
            .count()
        )
        if other_suppliers_count == 0:
            spice.delete()

    supplier.delete()
    return _json_ok()


@user_passes_test(is_admin)
@require_http_methods(["GET"])
def supplier_spices(request: HttpRequest, supplier_id: int) -> JsonResponse:
    supplier = get_object_or_404(Supplier, pk=supplier_id)
    rels = SupplierSpice.objects.filter(supplier=supplier).select_related("spice")
    spices = [r.spice.name for r in rels if r.spice]

    return JsonResponse({
        "supplier_id": supplier.id,
        "supplier_name": supplier.name or "",
        "spices": spices,
    })


def spa_index(request):
    path = settings.BASE_DIR / "web_app" / "dist" / "index.html"
    return FileResponse(open(path, "rb"))
