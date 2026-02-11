from django.contrib.auth import login, logout
from django.contrib.auth.decorators import user_passes_test
from django.contrib.auth.models import User
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect, render

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
    return user.is_authenticated and user.is_staff


def _build_rows(queryset, fields):
    rows = []
    for obj in queryset:
        values = []
        for f in fields:
            v = getattr(obj, f, "")
            values.append(str(v) if v is not None else "")
        rows.append({"id": obj.pk, "values": values})
    return rows



def register_view(request):
    if request.method == "POST":
        card = BonusCard.objects.filter(pk=1).first()

        client = Client.objects.create(
            last_name=request.POST.get("last_name", "").strip(),
            first_name=request.POST.get("first_name", "").strip(),
            fathers_name=(request.POST.get("fathers_name", "") or "").strip() or None,
            email=request.POST.get("email", "").strip(),
            password=request.POST.get("password", ""),
            bonus_count=100,
            bonus_card=card,
            phone_number=request.POST.get("phone_number", "").strip(),
        )
        request.session["client_id"] = client.id
        return redirect("profile")

    return render(request, "register.html")


def login_view(request):
    if request.method == "POST":
        email = (request.POST.get("email") or "").strip()
        password = request.POST.get("password") or ""

        ADMIN_EMAIL = "admin@spice.com"
        ADMIN_PASSWORD = "bozhenaspices"

        if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
            admin_user = User.objects.filter(email=ADMIN_EMAIL).first()
            if not admin_user:
                return render(request, "login.html", {"error": "Адміна не знайдено"})
            login(request, admin_user)
            return redirect("spice_list")

        client = Client.objects.filter(email=email, password=password).first()
        if client:
            request.session["client_id"] = client.id
            return redirect("profile")

        return render(request, "login.html", {"error": "Невірний логін або пароль"})

    return render(request, "login.html")


def logout_view(request):
    logout(request)
    request.session.pop("client_id", None)
    return redirect("login")



def profile_view(request):
    client_id = request.session.get("client_id")
    if not client_id:
        return redirect("login")

    client = get_object_or_404(Client.objects.select_related("bonus_card"), pk=client_id)

    if request.method == "POST":
        client.last_name = (request.POST.get("ln") or "").strip()
        client.first_name = (request.POST.get("fn") or "").strip()
        client.fathers_name = (request.POST.get("mn") or "").strip() or None
        client.phone_number = (request.POST.get("phone") or "").strip()
        client.save()
        return redirect("profile")

    return render(request, "profile.html", {"client_id": client})



def favorite_list(request):
    client_id = request.session.get("client_id")
    if not client_id:
        return render(request, "favorites_partial.html", {"favorites": []})

    favorites = Favorite.objects.filter(client_id=client_id).select_related("spice")
    return render(request, "favorites_partial.html", {"favorites": favorites})

def add_favorite(request, spice_id):
    client_id = request.session.get("client_id")
    if client_id:
        Favorite.objects.get_or_create(client_id=client_id, spice_id=spice_id)
    return redirect("spice_list")

def delete_favorite(request, fav_id):
    Favorite.objects.filter(pk=fav_id).delete()
    return redirect(request.META.get("HTTP_REFERER", "spice_list"))



def spice_list(request):
    spices = Spice.objects.all()

    client_id = request.session.get("client_id")
    fav_ids = []
    if client_id:
        fav_ids = list(
            Favorite.objects.filter(client_id=client_id).values_list("spice_id", flat=True)
        )

    rows = _build_rows(spices, fields=["id", "name", "type", "purpose", "price"])
    return render(request, "spice_catalog.html", {"rows": rows, "fav_ids": fav_ids})


def supplier_list(request):
    suppliers = Supplier.objects.all()
    rows = _build_rows(suppliers, fields=["id", "name", "address", "phone_number"])
    return render(request, "suppliers.html", {"rows": rows})


def card_list(request):
    cards = BonusCard.objects.all()
    rows = _build_rows(cards, fields=["id", "type", "bonus_percent", "discount"])
    return render(request, "bonus_cards.html", {"rows": rows})


def outlet_list(request):
    outlets = RetailOutlet.objects.all()
    rows = _build_rows(outlets, fields=["id", "name", "address"])
    return render(request, "outlets.html", {"rows": rows})


@user_passes_test(is_admin)
def employee_list(request):
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

    return render(request, "employees.html", {"rows": rows})


@user_passes_test(is_admin)
def client_list(request):
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
                str(c.bonus_count) if c.bonus_count is not None else "",
                c.phone_number or "",
            ]
        })

    return render(request, "clients.html", {"rows": rows})


@user_passes_test(is_admin)
def client_delete(request, pk):
    if request.method == "POST":
        Client.objects.filter(pk=pk).delete()
    return redirect("client_list")


@user_passes_test(is_admin)
def employee_edit(request, pk=None):
    obj = get_object_or_404(Employee, pk=pk) if pk else None
    outlets = RetailOutlet.objects.all()

    if request.method == "POST":
        if obj is None:
            obj = Employee()

        obj.last_name = (request.POST.get("last_name") or "").strip()
        obj.first_name = (request.POST.get("first_name") or "").strip()
        obj.fathers_name = (request.POST.get("fathers_name") or "").strip() or None
        obj.position = (request.POST.get("position") or "").strip()
        obj.shift = int(request.POST.get("shift")) if request.POST.get("shift") else 0
        obj.phone_number = (request.POST.get("phone_number") or "").strip()

        outlet_id = request.POST.get("outlet")
        obj.outlet_id = outlet_id if outlet_id else None

        obj.save()
        return redirect("employee_list")

    return render(request, "employee_form.html", {"obj": obj, "outlets": outlets})


@user_passes_test(is_admin)
def employee_delete(request, pk):
    obj = get_object_or_404(Employee, pk=pk)
    if request.method == "POST":
        obj.delete()
    return redirect("employee_list")


@user_passes_test(is_admin)
def outlet_edit(request, pk=None):
    obj = get_object_or_404(RetailOutlet, pk=pk) if pk else None

    if request.method == "POST":
        if obj is None:
            obj = RetailOutlet()

        obj.name = (request.POST.get("name") or "").strip()
        obj.address = (request.POST.get("address") or "").strip()
        obj.save()
        return redirect("outlet_list")

    return render(request, "outlet_form.html", {"obj": obj})


@user_passes_test(is_admin)
def outlet_delete(request, pk):
    obj = get_object_or_404(RetailOutlet, pk=pk)
    if request.method == "POST":
        obj.delete()
    return redirect("outlet_list")


@user_passes_test(lambda u: u.is_authenticated and u.is_staff)
def card_edit(request, pk=None):
    obj = get_object_or_404(BonusCard, pk=pk) if pk else None

    if request.method == "POST":
        if obj is None:
            obj = BonusCard()

        obj.type = (request.POST.get("type") or "").strip()
        obj.bonus_percent = int(request.POST.get("bonus_percent") or 0)
        obj.discount = int(request.POST.get("discount") or 0)
        obj.save()
        return redirect("card_list")

    return render(request, "bonus_card_form.html", {"obj": obj})


@user_passes_test(is_admin)
def card_delete(request, pk):
    obj = get_object_or_404(BonusCard, pk=pk)
    if request.method == "POST":
        obj.delete()
    return redirect("card_list")


@user_passes_test(is_admin)
def supplier_edit(request, pk=None):
    obj = get_object_or_404(Supplier, pk=pk) if pk else None

    if request.method == "POST":
        if obj is None:
            obj = Supplier()
        obj.name = (request.POST.get("name") or "").strip()
        obj.address = (request.POST.get("address") or "").strip()
        obj.phone_number = (request.POST.get("phone_number") or "").strip()
        obj.save()
        return redirect("supplier_list")

    spices = []
    if obj:
        spices = (
            SupplierSpice.objects
            .filter(supplier=obj)
            .select_related("spice")
            .values_list("spice__name", flat=True)
        )

    return render(request, "supplier_form.html", {
        "obj": obj,
        "spices": list(spices),
    })


@user_passes_test(is_admin)
@transaction.atomic
def supplier_delete(request, pk):
    supplier = get_object_or_404(Supplier, pk=pk)

    if request.method == "POST":
        relations = SupplierSpice.objects.filter(supplier=supplier).select_related("spice")

        for rel in relations:
            spice = rel.spice
            other_suppliers_count = SupplierSpice.objects.filter(spice=spice).exclude(supplier=supplier).count()
            if other_suppliers_count == 0:
                spice.delete()

        supplier.delete()

    return redirect("supplier_list")


@user_passes_test(is_admin)
def supplier_spices(request, supplier_id):
    supplier = get_object_or_404(Supplier, pk=supplier_id)
    rels = SupplierSpice.objects.filter(supplier=supplier).select_related("spice")
    spices = [r.spice for r in rels]
    return render(request, "supplier_spices.html", {"supplier": supplier, "spices": spices})


@user_passes_test(is_admin)
@transaction.atomic
def spice_create(request):
    if request.method == "POST":
        spice = Spice.objects.create(
            name=(request.POST.get("name") or "").strip(),
            type=(request.POST.get("type") or "").strip(),
            purpose=(request.POST.get("purpose") or "").strip(),
            price=request.POST.get("price") or 0,
        )

        supplier_name = (request.POST.get("supplier_name") or "").strip()
        if supplier_name:
            supplier = Supplier.objects.filter(name__iexact=supplier_name).first()
            if supplier:
                SupplierSpice.objects.get_or_create(supplier=supplier, spice=spice)

        return redirect("spice_list")

    return render(request, "spice_form.html", {"object": None, "current_supplier": ""})


@user_passes_test(is_admin)
@transaction.atomic
def spice_edit(request, spice_id):
    spice = get_object_or_404(Spice, pk=spice_id)

    if request.method == "POST":
        spice.name = (request.POST.get("name") or "").strip()
        spice.type = (request.POST.get("type") or "").strip()
        spice.purpose = (request.POST.get("purpose") or "").strip()
        spice.price = request.POST.get("price") or 0
        spice.save()

        supplier_name = (request.POST.get("supplier_name") or "").strip()
        if supplier_name:
            supplier = Supplier.objects.filter(name__iexact=supplier_name).first()
            if supplier:
                SupplierSpice.objects.update_or_create(
                    spice=spice,
                    defaults={"supplier": supplier},
                )

        return redirect("spice_list")

    current_rel = SupplierSpice.objects.filter(spice=spice).select_related("supplier").first()
    return render(request, "spice_form.html", {
        "object": spice,
        "current_supplier": current_rel.supplier.name if current_rel else "",
    })


@user_passes_test(is_admin)
def spice_delete(request, spice_id):
    if request.method == "POST":
        Spice.objects.filter(pk=spice_id).delete()
    return redirect("spice_list")
