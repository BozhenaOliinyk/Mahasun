from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.shortcuts import render, get_object_or_404, redirect
from .models import Spice, Supplier, BonusCard, RetailOutlet, Client, Employee, Favorite, SupplierSpice
from .forms import (
    SpiceForm, SupplierForm, BonusCardForm, RetailOutletForm,
    ClientForm, EmployeeForm, FavoriteForm, SupplierSpiceForm
)

def register_view(request):
    if request.method == 'POST':
        client = Client.objects.create(
            last_name=request.POST.get('last_name'),
            first_name=request.POST.get('first_name'),
            fathers_name=request.POST.get('fathers_name'),
            email=request.POST.get('email'),
            password=request.POST.get('password'),
            bonus_count=100,
            bonus_card_id=1,
            phone_number=request.POST.get('phone_number')
        )
        request.session['client_id'] = client.id
        return redirect('profile')
    return render(request, 'register.html')

def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        ADMIN_EMAIL = "admin@spice.com"
        ADMIN_PASSWORD = "bozhenaspices"

        if email == ADMIN_EMAIL and password == ADMIN_PASSWORD:
            from django.contrib.auth.models import User
            try:
                admin_user = User.objects.get(email=ADMIN_EMAIL)
                login(request, admin_user)
                return redirect('spice_list')
            except User.DoesNotExist:
                return render(request, 'login.html',
                              {'error': 'Адміна не знайдено'})

        client = Client.objects.filter(email=email, password=password).first()
        if client:
            request.session['client_id'] = client.id
            return redirect('profile')
        else:
            return render(request, 'login.html', {'error': 'Невірний логін або пароль'})

    return render(request, 'login.html')

def profile_view(request):
    client_id = request.session.get('client_id')

    if not client_id:
        return redirect('login')

    client = get_object_or_404(Client.objects.select_related('bonus_card_id'), id=client_id)

    if request.method == 'POST':
        client.last_name = request.POST.get('ln')
        client.first_name = request.POST.get('fn')
        client.fathers_name = request.POST.get('mn')
        client.phone_number = request.POST.get('phone')
        client.save()
        return redirect('profile')

    return render(request, 'profile.html', {'client': client})


def logout_view(request):
    logout(request)
    return redirect('login')



def generic_list_view(request, model_class, url_prefix):
    queryset = model_class.objects.all()
    headers = [field.verbose_name for field in model_class._meta.fields]
    rows = []
    for obj in queryset:
        values = []
        for field in model_class._meta.fields:
            value = getattr(obj, field.name)

            if field.is_relation and value is not None:
                values.append(str(value))
            else:
                values.append(str(value))

        rows.append({'id': obj.pk, 'values': values})

    context = {
        'title': model_class._meta.verbose_name,
        'headers': headers,
        'rows': rows,
        'url_prefix': url_prefix,
        'create_url': f"{url_prefix}_create"
    }
    return render(request, 'universal_list.html', context)

def generic_detail_view(request, model_class, url_prefix, pk):
    obj = get_object_or_404(model_class, pk=pk)
    data = [(field.verbose_name, getattr(obj, field.name)) for field in model_class._meta.fields]
    context = {
        'title': f"{model_class._meta.verbose_name}: {obj}",
        'data': data,
        'obj_id': pk,
        'url_prefix': url_prefix,
        'back_url': f"{url_prefix}_list",
        'edit_url': f"{url_prefix}_update",
        'delete_url': f"{url_prefix}_delete"
    }
    return render(request, 'universal_detail.html', context)

def generic_edit_view(request, model_class, form_class, url_prefix, pk=None):
    obj = get_object_or_404(model_class, pk=pk) if pk else None
    form = form_class(request.POST or None, instance=obj)
    if request.method == 'POST' and form.is_valid():
        form.save()
        return redirect(f"{url_prefix}_list")
    context = {
        'form': form,
        'title': f"{'Edit' if pk else 'Add'} {model_class._meta.verbose_name}",
        'back_url': f"{url_prefix}_list"
    }
    return render(request, 'universal_form.html', context)

def generic_delete_view(request, model_class, url_prefix, pk):
    obj = get_object_or_404(model_class, pk=pk)
    if request.method == 'POST':
        obj.delete()
        return redirect(f"{url_prefix}_list")
    return render(request, 'universal_confirm_delete.html', {'obj': obj, 'url_prefix': url_prefix})

def client_list(request): return generic_list_view(request, Client, 'client')
def client_detail(request, pk): return generic_detail_view(request, Client, 'client', pk)
def client_edit(request, pk=None): return generic_edit_view(request, Client, ClientForm, 'client', pk)
def client_delete(request, pk): return generic_delete_view(request, Client, 'client', pk)

def employee_list(request): return generic_list_view(request, Employee, 'employee')
def employee_detail(request, pk): return generic_detail_view(request, Employee, 'employee', pk)
def employee_edit(request, pk=None):
    extra_context = {'outlets': RetailOutlet.objects.all()}
    return generic_edit_view(request, Employee, EmployeeForm, 'employee', pk)
def employee_delete(request, pk): return generic_delete_view(request, Employee, 'employee', pk)

def outlet_list(request): return generic_list_view(request, RetailOutlet, 'outlet')
def outlet_detail(request, pk): return generic_detail_view(request, RetailOutlet, 'outlet', pk)
def outlet_edit(request, pk=None): return generic_edit_view(request, RetailOutlet, RetailOutletForm, 'outlet', pk)
def outlet_delete(request, pk): return generic_delete_view(request, RetailOutlet, 'outlet', pk)

def card_list(request): return generic_list_view(request, BonusCard, 'card')
def card_detail(request, pk): return generic_detail_view(request, BonusCard, 'card', pk)
def card_edit(request, pk=None): return generic_edit_view(request, BonusCard, BonusCardForm, 'card', pk)
def card_delete(request, pk): return generic_delete_view(request, BonusCard, 'card', pk)

def supplier_list(request): return generic_list_view(request, Supplier, 'supplier')
def supplier_detail(request, pk): return generic_detail_view(request, Supplier, 'supplier', pk)
def supplier_edit(request, pk=None): return generic_edit_view(request, Supplier, SupplierForm, 'supplier', pk)

def supplier_spice_list(request): return generic_list_view(request, SupplierSpice, 'supplier_spice')
def supplier_spice_detail(request, pk): return generic_detail_view(request, SupplierSpice, 'supplier_spice', pk)
def supplier_spice_edit(request, pk=None): return generic_edit_view(request, SupplierSpice, SupplierSpiceForm, 'supplier_spice', pk)
def supplier_spice_delete(request, pk): return generic_delete_view(request, SupplierSpice, 'supplier_spice', pk)


def favorite_list(request):
    client_id = request.session.get('client_id')
    favorites = Favorite.objects.filter(client_id_id=client_id).select_related('spice_id')
    return render(request, 'favorites_partial.html', {'favorites': favorites})


def add_favorite(request, spice_id):
    client_id = request.session.get('client_id')
    if client_id:
        Favorite.objects.get_or_create(client_id_id=client_id, spice_id_id=spice_id)
    return redirect('spice_list')


def delete_favorite(request, fav_id):
    Favorite.objects.filter(id=fav_id).delete()
    return redirect(request.META.get('HTTP_REFERER', 'spice_list'))


def spice_list(request):
    response = generic_list_view(request, Spice, 'spice')

    client_id = request.session.get('client_id')
    fav_ids = []
    if client_id:
        fav_ids = Favorite.objects.filter(client_id_id=client_id).values_list('spice_id_id', flat=True)

    response.context_data['fav_ids'] = list(fav_ids)
    return response

@transaction.atomic
def spice_create(request):
    if request.method == 'POST':
        spice = Spice.objects.create(
            name=request.POST.get('name'),
            type=request.POST.get('type') == 'on',
            purpose=request.POST.get('purpose'),
            price=request.POST.get('price')
        )
        supplier_name = request.POST.get('supplier_name')
        supplier = Supplier.objects.filter(name=supplier_name).first()
        if supplier:
            SupplierSpice.objects.create(supplier_id=supplier, spice_id=spice)

        return redirect('spice_list')
    return render(request, 'spice_form.html')


@transaction.atomic
def spice_edit(request, spice_id):
    spice = get_object_or_404(Spice, id=spice_id)

    if request.method == 'POST':
        spice.name = request.POST.get('name')
        spice.price = request.POST.get('price')
        spice.purpose = request.POST.get('purpose')
        spice.save()

        supplier_name = request.POST.get('supplier_name')
        supplier = Supplier.objects.filter(name=supplier_name).first()
        if supplier:
            SupplierSpice.objects.update_or_create(
                spice_id=spice,
                defaults={'supplier_id': supplier}
            )
        return redirect('spice_list')

    current_rel = SupplierSpice.objects.filter(spice_id=spice).first()
    return render(request, 'spice_form.html', {
        'object': spice,
        'current_supplier': current_rel.supplier_id.name if current_rel else ""
    })


def spice_delete(request, spice_id):
    Spice.objects.filter(id=spice_id).delete()
    return redirect('spice_list')


def supplier_spices(request, supplier_id):
    supplier = get_object_or_404(Supplier, id=supplier_id)
    spice_relations = SupplierSpice.objects.filter(supplier_id=supplier).select_related('spice_id')
    return render(request, 'supplier_spices.html', {
        'supplier': supplier,
        'spices': [rel.spice_id for rel in spice_relations]
    })


@transaction.atomic
def supplier_delete(request, pk):
    supplier = get_object_or_404(Supplier, id=pk)

    if request.method == 'POST':
        relations = SupplierSpice.objects.filter(supplier_id=supplier)

        for rel in relations:
            spice = rel.spice_id
            other_suppliers_count = SupplierSpice.objects.filter(spice_id=spice).count()

            if other_suppliers_count <= 1:
                spice.delete()

        supplier.delete()

        return redirect('supplier_list')

    return render(request, 'universal_confirm_delete.html', {'obj': supplier, 'url_prefix': 'supplier'})
