from django import forms
from .models import (
    Client, Spice, Supplier, BonusCard, Employee, RetailOutlet
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