from abc import ABC, abstractmethod


class Klyent:
    __table__ = "клієнти"
    __mapping__ = {
        "id": "id",
        "prizvyshche": "прізвище",
        "imya": "ім'я",
        "pobatkovi": "по-батькові",
        "data": "дата входження в систему",
        "bonusy": "Кількість бонусів",
        "id_kartka": "id типу картки"
    }

    def __init__(self, id, prizvyshche, imya, pobatkovi, data, bonusy, id_kartka):
        self.id = id
        self.prizvyshche = prizvyshche
        self.imya = imya
        self.pobatkovi = pobatkovi
        self.data = data
        self.bonusy = bonusy
        self.id_kartka = id_kartka

    def add_bonus(self, suma: int, kartka):
        self.bonusy += kartka.calculate_bonus(suma)

    def __repr__(self):
        return (f"Klyent(id={self.id}, prizvyshche='{self.prizvyshche}', "
                f"imya='{self.imya}', pobatkovi='{self.pobatkovi}', "
                f"data='{self.data}', bonusy={self.bonusy}, id_kartka={self.id_kartka})")


class Pracivnyk:
    __table__ = "працівники"
    __mapping__ = {
        "id": "id",
        "prizvyshche": "прізвище",
        "imya": "ім'я",
        "pobatkovi": "по-батькові",
        "status": "статус",
        "zmina": "Зміна",
        "id_tochka": "id торгової точки",
        "nomerTelefonu": "номер телефону"
    }

    def __init__(self, id, prizvyshche, imya, pobatkovi, status, zmina=None, id_tochka=None, nomerTelefonu=None):
        self.id = id
        self.prizvyshche = prizvyshche
        self.imya = imya
        self.pobatkovi = pobatkovi
        self.status = status
        self.zmina = zmina
        self.id_tochka = id_tochka
        self.nomerTelefonu = nomerTelefonu

    def get_full_name(self):
        return f"{self.prizvyshche} {self.imya} {self.pobatkovi}"

    def __repr__(self):
        return f"Pracivnyk(id={self.id}, name='{self.get_full_name()}', status='{self.status}')"


class TorhovaTochka:
    __table__ = "торгові точки"
    __mapping__ = {
        "id": "id",
        "nazva": "назва",
        "adres": "адреса"
    }

    def __init__(self, id, nazva, adres):
        self.id = id
        self.nazva = nazva
        self.adres = adres

    def print_info(self):
        print(f"Торгова точка: {self.nazva}, адреса: {self.adres}")

    def __repr__(self):
        return f"TorhovaTochka(id={self.id}, nazva='{self.nazva}', adres='{self.adres}')"


class TypBonusnoiKartky:
    __table__ = "типи бонусних карток"
    __mapping__ = {
        "id": "id",
        "typ": "тип",
        "narBon": "Нарахування бонусів (%)"
    }

    def __init__(self, id, typ, narBon):
        self.id = id
        self.typ = typ
        self.narBon = narBon

    def calculate_bonus(self, suma: int) -> int:
        return suma + ((suma // 100) * self.narBon)

    def __repr__(self):
        return f"TypBonusnoiKartky(id={self.id}, typ='{self.typ}', narBon={self.narBon})"


class Pereviznyky:
    __table__ = "перевізники"
    __mapping__ = {
        "id": "id",
        "prizvyshche": "Прізвище",
        "imya": "Ім’я",
        "pobatkovi": "По-батькові",
        "nomerTelefonu": "Номер телефону"
    }

    def __init__(self, id, prizvyshche, imya, pobatkovi, nomerTelefonu):
        self.id = id
        self.prizvyshche = prizvyshche
        self.imya = imya
        self.pobatkovi = pobatkovi
        self.nomerTelefonu = nomerTelefonu

    def get_id(self):
        return self.id

    def get_full_name(self):
        return f"{self.prizvyshche} {self.imya} {self.pobatkovi}"

    def __private_data(self):
        return f"Номер телефону перевізника: {self.nomerTelefonu}"


class Postachalnyky:
    __table__ = "постачальники"
    __mapping__ = {
        "id": "id",
        "nazvaMerezhi": "Назва мережі",
        "adres": "Адреса",
        "nomerTelefonu": "Номер телефону"
    }

    def __init__(self, id, nazvaMerezhi, adres, nomerTelefonu):
        self.id = id
        self.nazvaMerezhi = nazvaMerezhi
        self.adres = adres
        self.nomerTelefonu = nomerTelefonu

    def get_id(self):
        return self.id

    def print_info(self):
        print(f"Постачальник: {self.nazvaMerezhi}, адреса: {self.adres}")

    def __private_data(self):
        return f"Номер телефону постачальника: {self.nomerTelefonu}"


class Product(ABC):
    def __init__(self, id, nazva, vyd, specifier):
        self.id = id
        self.nazva = nazva
        self.vyd = vyd
        self.specifier = specifier

    def get_id(self):
        return self.id

    @abstractmethod
    def get_product_type(self):
        pass

    @abstractmethod
    def get_specifier(self):
        pass

    def info(self):
        return f"{self.get_product_type()}: {self.nazva}, вид: {self.vyd}"


class Specii(Product):
    __table__ = "спеції"
    __mapping__ = {
        "id": "id",
        "nazva": "Назва",
        "vyd": "Вид",
        "pr": "Призначення"
    }

    def __init__(self, id, nazva, vyd, pryznachennya):
        super().__init__(id, nazva, vyd, pryznachennya)
        self.pr = pryznachennya

    def get_product_type(self):
        return "Спеція"

    def get_specifier(self):
        return self.pr


    def info(self):
        return f"{super().info()}, призначення: {self.get_specifier()}"


class Sukhofrukty(Product):
    __table__ = "сухофрукти"
    __mapping__ = {
        "id": "id",
        "nazva": "Назва",
        "vyd": "Вид",
        "mv": "Метод висушування"
    }

    def __init__(self, id, nazva, vyd, metVys):
        super().__init__(id, nazva, vyd, metVys)
        self.mv = metVys

    def get_product_type(self):
        return "Сухофрукти"

    def get_specifier(self):
        return self.mv

    def info(self):
        return f"{super().info()}, метод висушення: {self.get_specifier()}"


class Reklama:
    __table__ = "реклама"
    __mapping__ = {
        "id": "id",
        "adres": "Адреса",
        "vyd": "Вид",
        "id_tochka": "id торгової точки",
        "id_pracivnyk": "id працівника"
    }

    def __init__(self, id, adres, vyd, id_tochka, id_pracivnyk):
        self.id = id
        self.adres = adres
        self.vyd = vyd
        self.id_tochka = id_tochka
        self.id_pracivnyk = id_pracivnyk

    def print_ad_info(self):
        print(f"Реклама типу {self.vyd} в точці №{self.id_tochka}")


class PostachannyaProduktsii:
    __table__ = "постачання продукції"
    __mapping__ = {
        "id": "id",
        "id_postachalnyk": "id постачальника",
        "id_pereviznyk": "id перевізника",
        "id_tochka": "id торгової точки",
        "id_specii": "id спеції",
        "id_sukhofrukt": "id сухофрукту",
        "price": "Ціна (100гр)",
        "quantity": "Кількість (кг)",
        "expdate": "Термін придатності"
    }

    def __init__(self, id, id_postachalnyk, id_pereviznyk, id_tochka, id_specii, id_sukhofrukt, price, quantity,
                 expdate):
        self.id = id
        self.id_postachalnyk = id_postachalnyk
        self.id_pereviznyk = id_pereviznyk
        self.id_tochka = id_tochka
        self.id_specii = id_specii
        self.id_sukhofrukt = id_sukhofrukt
        self.price = price
        self.quantity = quantity
        self.expdate = expdate

    def print_delivery_details(self):
        print(f"Товар: спеція {self.id_specii}, сухофрукт {self.id_sukhofrukt}, "
              f"кількість: {self.quantity}, ціна: {self.price}, придатний до: {self.expdate}")


class Znyzhka(ABC):
    percent = 0

    @abstractmethod
    def zn(self, id, suma, kartka, product):
        pass

class ZnyzhkaNaSpecii(Znyzhka):
    __table__ = "знижка на спеції"
    __mapping__ = {
        "id": "id",
        "idKarty": "id типу картки",
        "znyzhka": "Знижки на спецію(%)",
        "idSpecii": "id спеції"
    }

    def __init__(self, id, idKarty, znyzhka, idSpecii):
        self.id = id
        self.znyzhka = znyzhka
        self.idKarty = idKarty
        self.idSpecii = idSpecii

    def zn(self, id, suma, kartka, product):
        self.id = id
        self.idKarty = kartka.id
        self.idSpecii = product.id
        first = [2, 2, 0, 0, 0, 0]
        second = [4, 4, 3, 0, 3, 0]
        third = [6, 6, 5, 3, 5, 3]
        if self.idKarty == 1:
            self.znyzhka = first[self.idSpecii - 1]
        elif self.idKarty == 2:
            self.znyzhka = second[self.idSpecii - 1]
        elif self.idKarty == 3:
            self.znyzhka = third[self.idSpecii - 1]
        return suma - ((suma / 100) * self.znyzhka)


class ZnyzhkaNaSukhofrukty(Znyzhka):
    __table__ = "знижка на сухофрукти"
    __mapping__ = {
        "id": "id",
        "idKarty": "id типу картки",
        "znyzhka": "Знижки на сухофрукт (%)",
        "idFrukta": "id сухофрукту"
    }

    def __init__(self, id, idKarty, znyzhka, idFrukta):
        self.id = id
        self.znyzhka = znyzhka
        self.idKarty = idKarty
        self.idFrukta = idFrukta

    def zn(self, id, suma, kartka, product):
        self.id = id
        self.idKarty = kartka.id
        self.idFrukta = product.id
        first = [0, 4, 0, 0]
        second = [3, 5, 0, 3]
        third = [5, 7, 3, 4]
        if self.idKarty == 1:
            self.znyzhka = first[self.idFrukta - 1]
        elif self.idKarty == 2:
            self.znyzhka = second[self.idFrukta - 1]
        elif self.idKarty == 3:
            self.znyzhka = third[self.idFrukta - 1]
        return suma - ((suma / 100) * self.znyzhka)