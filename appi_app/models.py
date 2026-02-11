from django.db import models


class BonusCard(models.Model):
    type = models.CharField(max_length=100)
    bonus_percent = models.IntegerField()
    discount = models.IntegerField()

    class Meta:
        db_table = "bonus_cards"
        verbose_name = "Bonus Card"

    def calculate_bonus(self, amount: int) -> int:
        return int((amount * self.bonus_percent) / 100)

    def __str__(self) -> str:
        return self.type


class Client(models.Model):
    last_name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    fathers_name = models.CharField(max_length=100, blank=True, null=True)

    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)

    bonus_count = models.IntegerField(default=0)
    bonus_card = models.ForeignKey(BonusCard, on_delete=models.SET_NULL, null=True, blank=True)

    phone_number = models.CharField(max_length=100)

    class Meta:
        db_table = "clients"
        verbose_name = "Client"

    def add_bonus(self, amount: int) -> None:
        if self.bonus_card:
            self.bonus_count += self.bonus_card.calculate_bonus(amount)
            self.save(update_fields=["bonus_count"])

    def __str__(self) -> str:
        return f"{self.last_name} {self.first_name}"


class RetailOutlet(models.Model):
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=200)

    class Meta:
        db_table = "retail_outlets"
        verbose_name = "Retail Outlet"

    def __str__(self) -> str:
        return self.name


class Employee(models.Model):
    last_name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    fathers_name = models.CharField(max_length=100, blank=True, null=True)

    position = models.CharField(max_length=100)
    shift = models.IntegerField()

    outlet = models.ForeignKey(RetailOutlet, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=100)

    class Meta:
        db_table = "employees"
        verbose_name = "Employee"

    def __str__(self) -> str:
        return f"{self.last_name} {self.first_name}"


class Supplier(models.Model):
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=200)
    phone_number = models.CharField(max_length=100)

    class Meta:
        db_table = "suppliers"
        verbose_name = "Supplier"

    def __str__(self) -> str:
        return self.name


class Spice(models.Model):
    name = models.CharField(max_length=100)
    type = models.TextField()
    purpose = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "spices"
        verbose_name = "Spice"

    def __str__(self) -> str:
        return self.name


class Favorite(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    spice = models.ForeignKey(Spice, on_delete=models.CASCADE)

    class Meta:
        db_table = "favorite"
        verbose_name = "Favorite"

    def __str__(self) -> str:
        return f"{self.client} {self.spice}"


class SupplierSpice(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    spice = models.ForeignKey(Spice, on_delete=models.CASCADE)

    class Meta:
        db_table = "supplier_spice"
        verbose_name = "Supplier Spice"

    def __str__(self) -> str:
        return f"{self.supplier} {self.spice}"
