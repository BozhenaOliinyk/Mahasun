from django.shortcuts import render, get_object_or_404, redirect
from django.apps import apps
from .models import (
    TypBonusnoiKartky, TorhovaTochka, Klyent, Pracivnyk,
    Specii, Sukhofrukty, Pereviznyky, Postachalnyky,
    Reklama, PostachannyaProduktsii, ZnyzhkaNaSpecii, ZnyzhkaNaSukhofrukty
)
from .forms import (
    TypBonusnoiKartkyForm, TorhovaTochkaForm, KlyentForm, PracivnykForm,
    SpeciiForm, SukhofruktyForm, PereviznykyForm, PostachalnykyForm,
    ReklamaForm, PostachannyaProduktsiiForm, ZnyzhkaNaSpeciiForm, ZnyzhkaNaSukhofruktyForm
)



def generic_list_view(request, model_class, url_prefix):
    queryset = model_class.objects.all()

    headers = [field.verbose_name for field in model_class._meta.fields]

    rows = []
    for obj in queryset:
        values = []
        for field in model_class._meta.fields:
            val = getattr(obj, field.name)
            if field.is_relation and val is not None:
                val = str(val)
            values.append(val)

        rows.append({
            'id': obj.pk,
            'values': values
        })

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

    data = []
    for field in model_class._meta.fields:
        val = getattr(obj, field.name)
        if field.is_relation and val is not None:
            val = str(val)
        data.append((field.verbose_name, val))

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
    if pk:
        obj = get_object_or_404(model_class, pk=pk)
        form = form_class(request.POST or None, instance=obj)
        title = f"Редагування: {model_class._meta.verbose_name}"
    else:
        obj = None
        form = form_class(request.POST or None)
        title = f"Додавання: {model_class._meta.verbose_name}"

    if request.method == 'POST':
        if form.is_valid():
            form.save()
            return redirect(f"{url_prefix}_list")

    context = {
        'form': form,
        'title': title,
        'back_url': f"{url_prefix}_list"
    }
    return render(request, 'universal_form.html', context)


def generic_delete_view(request, model_class, url_prefix, pk):
    obj = get_object_or_404(model_class, pk=pk)
    if request.method == 'POST':
        obj.delete()
        return redirect(f"{url_prefix}_list")

    context = {
        'obj': obj,
        'title': f"Видалення: {model_class._meta.verbose_name}",
        'back_url': f"{url_prefix}_detail",
        'back_id': pk
    }
    return render(request, 'universal_confirm_delete.html', context)



def klyent_list(request): return generic_list_view(request, Klyent, 'klyent')
def klyent_detail(request, pk): return generic_detail_view(request, Klyent, 'klyent', pk)
def klyent_edit(request, pk=None): return generic_edit_view(request, Klyent, KlyentForm, 'klyent', pk)
def klyent_delete(request, pk): return generic_delete_view(request, Klyent, 'klyent', pk)


def pracivnyk_list(request): return generic_list_view(request, Pracivnyk, 'pracivnyk')
def pracivnyk_detail(request, pk): return generic_detail_view(request, Pracivnyk, 'pracivnyk', pk)
def pracivnyk_edit(request, pk=None): return generic_edit_view(request, Pracivnyk, PracivnykForm, 'pracivnyk', pk)
def pracivnyk_delete(request, pk): return generic_delete_view(request, Pracivnyk, 'pracivnyk', pk)


def tochka_list(request): return generic_list_view(request, TorhovaTochka, 'tochka')
def tochka_detail(request, pk): return generic_detail_view(request, TorhovaTochka, 'tochka', pk)
def tochka_edit(request, pk=None): return generic_edit_view(request, TorhovaTochka, TorhovaTochkaForm, 'tochka', pk)
def tochka_delete(request, pk): return generic_delete_view(request, TorhovaTochka, 'tochka', pk)


def kartka_list(request): return generic_list_view(request, TypBonusnoiKartky, 'kartka')
def kartka_detail(request, pk): return generic_detail_view(request, TypBonusnoiKartky, 'kartka', pk)
def kartka_edit(request, pk=None): return generic_edit_view(request, TypBonusnoiKartky, TypBonusnoiKartkyForm, 'kartka',
                                                            pk)
def kartka_delete(request, pk): return generic_delete_view(request, TypBonusnoiKartky, 'kartka', pk)


def specii_list(request): return generic_list_view(request, Specii, 'specii')
def specii_detail(request, pk): return generic_detail_view(request, Specii, 'specii', pk)
def specii_edit(request, pk=None): return generic_edit_view(request, Specii, SpeciiForm, 'specii', pk)
def specii_delete(request, pk): return generic_delete_view(request, Specii, 'specii', pk)


def sukhofrukty_list(request): return generic_list_view(request, Sukhofrukty, 'sukhofrukty')
def sukhofrukty_detail(request, pk): return generic_detail_view(request, Sukhofrukty, 'sukhofrukty', pk)
def sukhofrukty_edit(request, pk=None): return generic_edit_view(request, Sukhofrukty, SukhofruktyForm, 'sukhofrukty',
                                                                 pk)
def sukhofrukty_delete(request, pk): return generic_delete_view(request, Sukhofrukty, 'sukhofrukty', pk)


def pereviznyky_list(request): return generic_list_view(request, Pereviznyky, 'pereviznyky')
def pereviznyky_detail(request, pk): return generic_detail_view(request, Pereviznyky, 'pereviznyky', pk)
def pereviznyky_edit(request, pk=None): return generic_edit_view(request, Pereviznyky, PereviznykyForm, 'pereviznyky',
                                                                 pk)
def pereviznyky_delete(request, pk): return generic_delete_view(request, Pereviznyky, 'pereviznyky', pk)


def postachalnyky_list(request): return generic_list_view(request, Postachalnyky, 'postachalnyky')
def postachalnyky_detail(request, pk): return generic_detail_view(request, Postachalnyky, 'postachalnyky', pk)
def postachalnyky_edit(request, pk=None): return generic_edit_view(request, Postachalnyky, PostachalnykyForm,
                                                                   'postachalnyky', pk)
def postachalnyky_delete(request, pk): return generic_delete_view(request, Postachalnyky, 'postachalnyky', pk)


def reklama_list(request): return generic_list_view(request, Reklama, 'reklama')
def reklama_detail(request, pk): return generic_detail_view(request, Reklama, 'reklama', pk)
def reklama_edit(request, pk=None): return generic_edit_view(request, Reklama, ReklamaForm, 'reklama', pk)
def reklama_delete(request, pk): return generic_delete_view(request, Reklama, 'reklama', pk)


def postachannya_list(request): return generic_list_view(request, PostachannyaProduktsii, 'postachannya')
def postachannya_detail(request, pk): return generic_detail_view(request, PostachannyaProduktsii, 'postachannya', pk)
def postachannya_edit(request, pk=None): return generic_edit_view(request, PostachannyaProduktsii,
                                                                  PostachannyaProduktsiiForm, 'postachannya', pk)
def postachannya_delete(request, pk): return generic_delete_view(request, PostachannyaProduktsii, 'postachannya', pk)


def znyzhka_specii_list(request): return generic_list_view(request, ZnyzhkaNaSpecii, 'znyzhka_specii')
def znyzhka_specii_detail(request, pk): return generic_detail_view(request, ZnyzhkaNaSpecii, 'znyzhka_specii', pk)
def znyzhka_specii_edit(request, pk=None): return generic_edit_view(request, ZnyzhkaNaSpecii, ZnyzhkaNaSpeciiForm,
                                                                    'znyzhka_specii', pk)
def znyzhka_specii_delete(request, pk): return generic_delete_view(request, ZnyzhkaNaSpecii, 'znyzhka_specii', pk)


def znyzhka_sukhofrukty_list(request): return generic_list_view(request, ZnyzhkaNaSukhofrukty, 'znyzhka_sukhofrukty')

def znyzhka_sukhofrukty_detail(request, pk): return generic_detail_view(request, ZnyzhkaNaSukhofrukty,
                                                                        'znyzhka_sukhofrukty', pk)
def znyzhka_sukhofrukty_edit(request, pk=None): return generic_edit_view(request, ZnyzhkaNaSukhofrukty,
                                                                         ZnyzhkaNaSukhofruktyForm,
                                                                         'znyzhka_sukhofrukty', pk)
def znyzhka_sukhofrukty_delete(request, pk): return generic_delete_view(request, ZnyzhkaNaSukhofrukty,
                                                                        'znyzhka_sukhofrukty', pk)