from django.db import models

class BonusCard(models.Model):
    id = models.AutoField(primary_key=True)
    type = models.CharField(max_length=100)
    bonus_percent = models.IntegerField()
    discount = models.IntegerField()

    class Meta:
        db_table = 'bonus_cards'
        verbose_name = "Bonus Card"

    def calculate_bonus(self, amount: int) -> int:
        return int((amount * self.bonus_percent) / 100)

    def __str__(self):
        return self.type


class Client(models.Model):
    id = models.AutoField(primary_key=True)
    last_name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    fathers_name = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    bonus_count = models.IntegerField(default=0)
    bonus_card = models.ForeignKey(BonusCard, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'clients'
        verbose_name = "Client"

    def add_bonus(self, amount: int):
        if self.bonus_card:
            self.bonus_count += self.bonus_card.calculate_bonus(amount)
            self.save()

    def __str__(self):
        return f"{self.last_name} {self.first_name}"


class RetailOutlet(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=200)

    class Meta:
        db_table = 'retail_outlets'
        verbose_name = "Retail Outlet"

    def __str__(self):
        return self.name


class Employee(models.Model):
    id = models.AutoField(primary_key=True)
    last_name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    fathers_name = models.CharField(max_length=100, blank=True, null=True)
    position = models.CharField(max_length=100) # виправлено posiyion
    shift = models.IntegerField()
    outlet = models.ForeignKey(RetailOutlet, on_delete=models.CASCADE)
    phone_number = models.IntegerField()

    class Meta:
        db_table = 'employees'
        verbose_name = "Employee"

    def __str__(self):
        return f"{self.last_name} {self.first_name}"


class Supplier(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=200)
    phone_number = models.FloatField()

    class Meta:
        db_table = 'suppliers'
        verbose_name = "Supplier"

    def __str__(self):
        return self.name


class Spice(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    type = models.BooleanField(default=True)
    purpose = models.TextField()

    class Meta:
        db_table = 'spices'
        verbose_name = "Spice"

    def __str__(self):
        return self.name