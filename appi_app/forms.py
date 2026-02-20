from django import forms
from .models import (
    Client, Spice, Supplier, BonusCard, Employee, RetailOutlet, SupplierSpice, Favorite
)

class ClientForm(forms.ModelForm):
    class Meta:
        model = Client
        fields = '__all__'

class SpiceForm(forms.ModelForm):
    class Meta:
        model = Spice
        fields = '__all__'

class SupplierForm(forms.ModelForm):
    class Meta:
        model = Supplier
        fields = '__all__'

class BonusCardForm(forms.ModelForm):
    class Meta:
        model = BonusCard
        fields = '__all__'

class EmployeeForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = '__all__'

class RetailOutletForm(forms.ModelForm):
    class Meta:
        model = RetailOutlet
        fields = '__all__'

class SupplierSpiceForm(forms.ModelForm):
    class Meta:
        model = SupplierSpice
        fields = '__all__'

class FavoriteForm(forms.ModelForm):
    class Meta:
        model = Favorite
        fields = '__all__'