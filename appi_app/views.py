from django.shortcuts import render, get_object_or_404, redirect
from .models import Spice, Supplier, BonusCard, RetailOutlet, Client, Employee
from .forms import (
    SpiceForm, SupplierForm, BonusCardForm, RetailOutletForm,
    ClientForm, EmployeeForm
)

def generic_list_view(request, model_class, url_prefix):
    queryset = model_class.objects.all()
    headers = [field.verbose_name for field in model_class._meta.fields]
    rows = []
    for obj in queryset:
        values = [str(getattr(obj, field.name)) for field in model_class._meta.fields]
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
def employee_edit(request, pk=None): return generic_edit_view(request, Employee, EmployeeForm, 'employee', pk)
def employee_delete(request, pk): return generic_delete_view(request, Employee, 'employee', pk)

def spice_list(request): return generic_list_view(request, Spice, 'spice')
def spice_detail(request, pk): return generic_detail_view(request, Spice, 'spice', pk)
def spice_edit(request, pk=None): return generic_edit_view(request, Spice, SpiceForm, 'spice', pk)
def spice_delete(request, pk): return generic_delete_view(request, Spice, 'spice', pk)

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
def supplier_delete(request, pk): return generic_delete_view(request, Supplier, 'supplier', pk)