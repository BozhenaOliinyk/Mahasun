from django.db import models


class TypBonusnoiKartky(models.Model):
    id = models.AutoField(db_column='id', primary_key=True)
    typ = models.CharField(db_column='тип', max_length=50)
    nar_bon = models.IntegerField(db_column='Нарахування бонусів (%%)')

    class Meta:
        db_table = 'типи бонусних карток'
        managed = False
        verbose_name = "Типи бонусних карток"

    def calculate_bonus(self, suma: int) -> int:
        return int(suma + ((suma // 100) * self.nar_bon))

    def __str__(self):
        return self.typ


class Klyent(models.Model):
    id = models.AutoField(db_column='id', primary_key=True)
    prizvyshche = models.CharField(db_column='прізвище', max_length=100)
    imya = models.CharField(db_column="ім'я", max_length=100)
    pobatkovi = models.CharField(db_column='по-батькові', max_length=100)
    data = models.CharField(db_column='дата входження в систему',
                            max_length=50)
    bonusy = models.IntegerField(db_column='Кількість бонусів', default=0)
    kartka = models.ForeignKey(TypBonusnoiKartky, models.DO_NOTHING, db_column='id типу картки')

    class Meta:
        db_table = 'клієнти'
        managed = False
        verbose_name = "Клієнти"

    def add_bonus(self, suma: int):
        if self.kartka:
            self.bonusy += self.kartka.calculate_bonus(suma)
            self.save()

    def __str__(self):
        return f"{self.prizvyshche} {self.imya}"


class TorhovaTochka(models.Model):
    id = models.AutoField(db_column='id', primary_key=True)
    nazva = models.CharField(db_column='назва', max_length=100)
    adres = models.CharField(db_column='адреса', max_length=200)

    class Meta:
        db_table = 'торгові точки'
        managed = False
        verbose_name = "Торгові точки"

    def __str__(self):
        return self.nazva


class Pracivnyk(models.Model):
    id = models.AutoField(db_column='id', primary_key=True)
    prizvyshche = models.CharField(db_column='прізвище', max_length=100)
    imya = models.CharField(db_column="ім'я", max_length=100)
    pobatkovi = models.CharField(db_column='по-батькові', max_length=100)
    status = models.CharField(db_column='статус', max_length=50)
    zmina = models.CharField(db_column='Зміна', max_length=50, blank=True, null=True)
    tochka = models.ForeignKey(TorhovaTochka, models.DO_NOTHING, db_column='id торгової точки', blank=True, null=True)
    nomer_telefonu = models.CharField(db_column='номер телефону', max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'працівники'
        managed = False
        verbose_name = "Працівники"

    def get_full_name(self):
        return f"{self.prizvyshche} {self.imya} {self.pobatkovi}"

    def __str__(self):
        return self.get_full_name()


class Pereviznyky(models.Model):
    id = models.AutoField(db_column='id', primary_key=True)
    prizvyshche = models.CharField(db_column='Прізвище', max_length=100)
    imya = models.CharField(db_column="Ім'я", max_length=100)
    pobatkovi = models.CharField(db_column='По-батькові', max_length=100)
    nomer_telefonu = models.CharField(db_column='Номер телефону', max_length=20)

    class Meta:
        db_table = 'перевізники'
        managed = False
        verbose_name = "Перевізники"

    def __str__(self):
        return f"{self.prizvyshche} {self.imya}"


class Postachalnyky(models.Model):
    id = models.AutoField(db_column='id', primary_key=True)
    nazva_merezhi = models.CharField(db_column='Назва мережі', max_length=100)
    adres = models.CharField(db_column='Адреса', max_length=200)
    nomer_telefonu = models.CharField(db_column='Номер телефону', max_length=20)

    class Meta:
        db_table = 'постачальники'
        managed = False
        verbose_name = "Постачальники"

    def __str__(self):
        return self.nazva_merezhi


class Specii(models.Model):
    id = models.AutoField(db_column='id', primary_key=True)
    nazva = models.CharField(db_column='Назва', max_length=100)
    vyd = models.CharField(db_column='Вид', max_length=100)
    pryznachennya = models.CharField(db_column='Призначення', max_length=200)

    class Meta:
        db_table = 'спеції'
        managed = False
        verbose_name = "Спеції"

    def __str__(self):
        return self.nazva


class Sukhofrukty(models.Model):
    id = models.AutoField(db_column='id', primary_key=True)
    nazva = models.CharField(db_column='Назва', max_length=100)
    vyd = models.CharField(db_column='Вид', max_length=100)
    met_vys = models.CharField(db_column='Метод висушування', max_length=100)

    class Meta:
        db_table = 'сухофрукти'
        managed = False
        verbose_name = "Сухофрукти"

    def __str__(self):
        return self.nazva


class Reklama(models.Model):
    id = models.AutoField(db_column='id', primary_key=True)
    adres = models.CharField(db_column='Адреса', max_length=500)
    vyd = models.CharField(db_column='Вид', max_length=100)
    tochka = models.ForeignKey(TorhovaTochka, models.DO_NOTHING, db_column='id торгової точки', null=True, blank=True)
    pracivnyk = models.ForeignKey(Pracivnyk, models.DO_NOTHING, db_column='id працівника', null=True, blank=True)

    class Meta:
        db_table = 'реклама'
        verbose_name = "Реклами"
        managed = False


class PostachannyaProduktsii(models.Model):
    id = models.AutoField(db_column='id', primary_key=True)
    postachalnyk = models.ForeignKey(Postachalnyky, models.DO_NOTHING, db_column='id постачальника')
    pereviznyk = models.ForeignKey(Pereviznyky, models.DO_NOTHING, db_column='id перевізника')
    tochka = models.ForeignKey(TorhovaTochka, models.DO_NOTHING, db_column='id торгової точки')
    specii = models.ForeignKey(Specii, models.DO_NOTHING, db_column='id спеції', blank=True, null=True)
    sukhofrukt = models.ForeignKey(Sukhofrukty, models.DO_NOTHING, db_column='id сухофрукту', blank=True, null=True)
    price = models.DecimalField(db_column='Ціна (100гр)', max_digits=10, decimal_places=2)
    quantity = models.DecimalField(db_column='Кількість (кг)', max_digits=10, decimal_places=2)
    expdate = models.CharField(db_column='Термін придатності', max_length=50)

    class Meta:
        db_table = 'постачання продукції'
        verbose_name = "Постачання продукції"
        managed = False


class ZnyzhkaNaSpecii(models.Model):
    id = models.AutoField(db_column='id', primary_key=True)
    karta = models.ForeignKey(TypBonusnoiKartky, models.DO_NOTHING, db_column='id типу картки')
    znyzhka = models.IntegerField(db_column='Знижка на спецію(%%)', default=0)
    specia = models.ForeignKey(Specii, models.DO_NOTHING, db_column='id спеції')

    class Meta:
        db_table = 'знижка на спеції'
        verbose_name = "знижки на спеції"
        managed = False

    def save(self, *args, **kwargs):
        first = [2, 2, 0, 0, 0, 0]
        second = [4, 4, 3, 0, 3, 0]
        third = [6, 6, 5, 3, 5, 3]

        try:
            if self.karta.id == 1:
                self.znyzhka = first[self.specia.id - 1]
            elif self.karta.id == 2:
                self.znyzhka = second[self.specia.id - 1]
            elif self.karta.id == 3:
                self.znyzhka = third[self.specia.id - 1]
        except (IndexError, AttributeError):
            pass
        super().save(*args, **kwargs)


class ZnyzhkaNaSukhofrukty(models.Model):
    id = models.AutoField(db_column='id', primary_key=True)
    karta = models.ForeignKey(TypBonusnoiKartky, models.DO_NOTHING, db_column='id типу картки')
    znyzhka = models.IntegerField(db_column='Знижка на сухофрукт (%%)', default=0)
    frukt = models.ForeignKey(Sukhofrukty, models.DO_NOTHING, db_column='id сухофрукту')

    class Meta:
        db_table = 'знижка на сухофрукти'
        verbose_name = "знижки на сухофрукти"
        managed = False

    def save(self, *args, **kwargs):
        first = [0, 4, 0, 0]
        second = [3, 5, 0, 3]
        third = [5, 7, 3, 4]
        try:
            if self.karta.id == 1:
                self.znyzhka = first[self.frukt.id - 1]
            elif self.karta.id == 2:
                self.znyzhka = second[self.frukt.id - 1]
            elif self.karta.id == 3:
                self.znyzhka = third[self.frukt.id - 1]
        except (IndexError, AttributeError):
            pass
        super().save(*args, **kwargs)