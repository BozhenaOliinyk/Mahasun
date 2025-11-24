from django import forms
from .models import (
    TypBonusnoiKartky, TorhovaTochka, Klyent, Pracivnyk,
    Specii, Sukhofrukty, Pereviznyky, Postachalnyky,
    Reklama, PostachannyaProduktsii, ZnyzhkaNaSpecii, ZnyzhkaNaSukhofrukty
)

class TypBonusnoiKartkyForm(forms.ModelForm):
    class Meta:
        model = TypBonusnoiKartky
        fields = '__all__'

class TorhovaTochkaForm(forms.ModelForm):
    class Meta:
        model = TorhovaTochka
        fields = '__all__'

class KlyentForm(forms.ModelForm):
    class Meta:
        model = Klyent
        fields = '__all__'

class PracivnykForm(forms.ModelForm):
    class Meta:
        model = Pracivnyk
        fields = '__all__'

class SpeciiForm(forms.ModelForm):
    class Meta:
        model = Specii
        fields = '__all__'

class SukhofruktyForm(forms.ModelForm):
    class Meta:
        model = Sukhofrukty
        fields = '__all__'

class PereviznykyForm(forms.ModelForm):
    class Meta:
        model = Pereviznyky
        fields = '__all__'

class PostachalnykyForm(forms.ModelForm):
    class Meta:
        model = Postachalnyky
        fields = '__all__'

class ReklamaForm(forms.ModelForm):
    class Meta:
        model = Reklama
        fields = '__all__'

class PostachannyaProduktsiiForm(forms.ModelForm):
    class Meta:
        model = PostachannyaProduktsii
        fields = '__all__'

class ZnyzhkaNaSpeciiForm(forms.ModelForm):
    class Meta:
        model = ZnyzhkaNaSpecii
        fields = '__all__'

class ZnyzhkaNaSukhofruktyForm(forms.ModelForm):
    class Meta:
        model = ZnyzhkaNaSukhofrukty
        fields = '__all__'