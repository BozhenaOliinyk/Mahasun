import pymysql
from pymysql.connections import Connection as MySQLConnection
from typing import List, Callable, Any

from entities import (
    Klyent, Pracivnyk, TorhovaTochka, TypBonusnoiKartky, Specii, Sukhofrukty,
    ZnyzhkaNaSpecii, ZnyzhkaNaSukhofrukty, Pereviznyky, Postachalnyky,
    PostachannyaProduktsii, Reklama
)


class BaseRepository:
    def __init__(self, connection: MySQLConnection, entity_class: Any, table_name: str, mapper: Callable = None):
        self.conn = connection
        self.entity_class = entity_class
        self.table = table_name
        self.mapper = mapper

        self.mapping = getattr(self.entity_class, "__mapping__", {})
        self.id_col_py = 'id'
        self.id_col_db = self.mapping.get(self.id_col_py, self.id_col_py)
        self.reverse_map = {v: k for k, v in self.mapping.items()}

    def _execute_read_query(self, sql: str, params=None):
        with self.conn.cursor() as cur:
            cur.execute(sql, params)
            return cur

    def _execute_write_query(self, sql: str, params=None):
        with self.conn.cursor() as cur:
            cur.execute(sql, params)
        self.conn.commit()

    def map_row_to_entity(self, row):
        if row is None:
            return None
        if self.mapper:
            return self.mapper(row)

        kwargs = {self.reverse_map.get(col, col): val for col, val in row.items()}
        return self.entity_class(**kwargs)

    def all(self) -> List:
        cur = self._execute_read_query(f"SELECT * FROM `{self.table}`")
        rows = cur.fetchall()
        return [self.map_row_to_entity(row) for row in rows]

    def get_by_id(self, id: int):
        sql = f"SELECT * FROM `{self.table}` WHERE `{self.id_col_db}` = %s"
        cur = self._execute_read_query(sql, (id,))
        row = cur.fetchone()
        return self.map_row_to_entity(row)

    def create(self, **kwargs):
        cur = self._execute_read_query(f"SELECT MAX(`{self.id_col_db}`) AS max_id FROM `{self.table}`")
        result = cur.fetchone()
        next_id = (result.get('max_id') or 0) + 1
        kwargs[self.id_col_py] = next_id

        cols = []
        vals = []
        for py_field, val in kwargs.items():
            db_col = self.mapping.get(py_field, py_field)
            if db_col:
                cols.append(f"`{db_col}`")
                vals.append(val)

        cols_sql = ", ".join(cols)
        placeholders = ", ".join(["%s"] * len(vals))
        sql = f"INSERT INTO `{self.table}` ({cols_sql}) VALUES ({placeholders})"

        self._execute_write_query(sql, vals)

        return self.get_by_id(next_id)

    def update(self, id: int, **kwargs):
        set_parts = []
        vals = []

        for py_field, val in kwargs.items():
            if py_field == self.id_col_py:
                continue
            db_col = self.mapping.get(py_field, py_field)
            if db_col:
                set_parts.append(f"`{db_col}` = %s")
                vals.append(val)

        if not set_parts:
            return self.get_by_id(id)

        sql = f"UPDATE `{self.table}` SET {', '.join(set_parts)} WHERE `{self.id_col_db}` = %s"
        vals.append(id)

        self._execute_write_query(sql, vals)

        return self.get_by_id(id)

    def delete(self, id: int):
        sql = f"DELETE FROM `{self.table}` WHERE `{self.id_col_db}` = %s"
        self._execute_write_query(sql, (id,))



class KlyentRepository(BaseRepository):
    def __init__(self, connection):
        super().__init__(connection, Klyent, "клієнти", self._map_row)

    @staticmethod
    def _map_row(row):
        return Klyent(
            id=row.get('id'),
            prizvyshche=row.get('прізвище'),
            imya=row.get("ім'я"),
            pobatkovi=row.get('по-батькові'),
            data=row.get('дата входження в систему'),
            bonusy=row.get('Кількість бонусів'),
            id_kartka=row.get('id типу картки')
        )


class PracivnykRepository(BaseRepository):
    def __init__(self, connection):
        super().__init__(connection, Pracivnyk, "працівники", self._map_row)

    @staticmethod
    def _map_row(row):
        return Pracivnyk(
            id=row.get('id'),
            prizvyshche=row.get('прізвище'),
            imya=row.get("ім'я"),
            pobatkovi=row.get('по-батькові'),
            status=row.get('статус'),
            zmina=row.get('Зміна'),
            id_tochka=row.get('id торгової точки'),
            nomerTelefonu=row.get('номер телефону')
        )


class TorhovaTochkaRepository(BaseRepository):
    def __init__(self, connection):
        super().__init__(connection, TorhovaTochka, "торгові точки", self._map_row)

    @staticmethod
    def _map_row(row):
        return TorhovaTochka(
            id=row.get('id'),
            nazva=row.get('назва'),
            adres=row.get('адреса')
        )


class TypBonusnoiKartkyRepository(BaseRepository):
    def __init__(self, connection):
        super().__init__(connection, TypBonusnoiKartky, "типи бонусних карток", self._map_row)

    @staticmethod
    def _map_row(row):
        return TypBonusnoiKartky(
            id=row.get('id'),
            typ=row.get('тип'),
            narBon=row.get('Нарахування бонусів (%)')
        )


class SpeciiRepository(BaseRepository):
    def __init__(self, connection):
        super().__init__(connection, Specii, "спеції", self._map_row)

    @staticmethod
    def _map_row(row):
        return Specii(
            id=row.get('id'),
            nazva=row.get('Назва'),
            vyd=row.get('Вид'),
            pryznachennya=row.get('Призначення')
        )


class SukhofruktyRepository(BaseRepository):
    def __init__(self, connection):
        super().__init__(connection, Sukhofrukty, "сухофрукти", self._map_row)

    @staticmethod
    def _map_row(row):
        return Sukhofrukty(
            id=row.get('id'),
            nazva=row.get('Назва'),
            vyd=row.get('Вид'),
            metVys=row.get('Метод висушування')
        )


class PereviznykyRepository(BaseRepository):
    def __init__(self, connection):
        super().__init__(connection, Pereviznyky, "перевізники", self._map_row)

    @staticmethod
    def _map_row(row):
        return Pereviznyky(
            id=row.get('id'),
            prizvyshche=row.get('Прізвище'),
            imya=row.get("Ім’я"),
            pobatkovi=row.get('По-батькові'),
            nomerTelefonu=row.get('Номер телефону')
        )


class PostachalnykyRepository(BaseRepository):
    def __init__(self, connection):
        super().__init__(connection, Postachalnyky, "постачальники", self._map_row)

    @staticmethod
    def _map_row(row):
        return Postachalnyky(
            id=row.get('id'),
            nazvaMerezhi=row.get('Назва мережі'),
            adres=row.get('Адреса'),
            nomerTelefonu=row.get('Номер телефону')
        )


class ReklamaRepository(BaseRepository):
    def __init__(self, connection):
        super().__init__(connection, Reklama, "реклама", self._map_row)

    @staticmethod
    def _map_row(row):
        return Reklama(
            id=row.get('id'),
            adres=row.get('Адреса'),
            vyd=row.get('Вид'),
            id_tochka=row.get('id торгової точки'),
            id_pracivnyk=row.get('id працівника')
        )


class PostachannyaProduktsiiRepository(BaseRepository):
    def __init__(self, connection):
        super().__init__(connection, PostachannyaProduktsii, "постачання продукції", self._map_row)

    @staticmethod
    def _map_row(row):
        return PostachannyaProduktsii(
            id=row.get('id'),
            id_postachalnyk=row.get('id постачальника'),
            id_pereviznyk=row.get('id перевізника'),
            id_tochka=row.get('id торгової точки'),
            id_specii=row.get('id спеції'),
            id_sukhofrukt=row.get('id сухофрукту'),
            price=row.get('Ціна (100гр)'),
            quantity=row.get('Кількість (кг)'),
            expdate=row.get('Термін придатності')
        )


class ZnyzhkaNaSpeciiRepository(BaseRepository):
    def __init__(self, connection):
        super().__init__(connection, ZnyzhkaNaSpecii, "знижка на спеції", self._map_row)

    @staticmethod
    def _map_row(row):
        return ZnyzhkaNaSpecii(
            id=row.get('id'),
            idKarty=row.get('id типу картки'),
            znyzhka=row.get('Знижки на спецію(%)'),
            idSpecii=row.get('id спеції')
        )


class ZnyzhkaNaSukhofruktyRepository(BaseRepository):
    def __init__(self, connection):
        super().__init__(connection, ZnyzhkaNaSukhofrukty, "знижка на сухофрукти", self._map_row)

    @staticmethod
    def _map_row(row):
        return ZnyzhkaNaSukhofrukty(
            id=row.get('id'),
            idKarty=row.get('id типу картки'),
            znyzhka=row.get('Знижки на сухофрукт (%)'),
            idFrukta=row.get('id сухофрукту')
        )



class RepositoryManager:
    def __init__(self, connection: MySQLConnection):
        self.conn = connection
        self._klyent_repo = None
        self._pracivnyk_repo = None
        self._tochka_repo = None
        self._kartka_repo = None
        self._specia_repo = None
        self._frykt_repo = None
        self._postachalnyk_repo = None
        self._pereviznyk_repo = None
        self._postachannya_repo = None
        self._reklama_repo = None
        self._znyzka_specii_repo = None
        self._znyzka_frykt_repo = None

    @property
    def klyenty(self) -> KlyentRepository:
        if self._klyent_repo is None:
            self._klyent_repo = KlyentRepository(self.conn)
        return self._klyent_repo

    @property
    def pracivnyky(self) -> PracivnykRepository:
        if self._pracivnyk_repo is None:
            self._pracivnyk_repo = PracivnykRepository(self.conn)
        return self._pracivnyk_repo

    @property
    def tochky(self) -> TorhovaTochkaRepository:
        if self._tochka_repo is None:
            self._tochka_repo = TorhovaTochkaRepository(self.conn)
        return self._tochka_repo

    @property
    def kartky(self) -> TypBonusnoiKartkyRepository:
        if self._kartka_repo is None:
            self._kartka_repo = TypBonusnoiKartkyRepository(self.conn)
        return self._kartka_repo

    @property
    def specii(self) -> SpeciiRepository:
        if self._specia_repo is None:
            self._specia_repo = SpeciiRepository(self.conn)
        return self._specia_repo

    @property
    def frykty(self) -> SukhofruktyRepository:
        if self._frykt_repo is None:
            self._frykt_repo = SukhofruktyRepository(self.conn)
        return self._frykt_repo

    @property
    def postachalnyky(self) -> PostachalnykyRepository:
        if self._postachalnyk_repo is None:
            self._postachalnyk_repo = PostachalnykyRepository(self.conn)
        return self._postachalnyk_repo

    @property
    def pereviznyky(self) -> PereviznykyRepository:
        if self._pereviznyk_repo is None:
            self._pereviznyk_repo = PereviznykyRepository(self.conn)
        return self._pereviznyk_repo

    @property
    def postachannya(self) -> PostachannyaProduktsiiRepository:
        if self._postachannya_repo is None:
            self._postachannya_repo = PostachannyaProduktsiiRepository(self.conn)
        return self._postachannya_repo

    @property
    def reklamy(self) -> ReklamaRepository:
        if self._reklama_repo is None:
            self._reklama_repo = ReklamaRepository(self.conn)
        return self._reklama_repo

    @property
    def znyzky_na_specii(self) -> ZnyzhkaNaSpeciiRepository:
        if self._znyzka_specii_repo is None:
            self._znyzka_specii_repo = ZnyzhkaNaSpeciiRepository(self.conn)
        return self._znyzka_specii_repo

    @property
    def znyzky_na_frykty(self) -> ZnyzhkaNaSukhofruktyRepository:
        if self._znyzka_frykt_repo is None:
            self._znyzka_frykt_repo = ZnyzhkaNaSukhofruktyRepository(self.conn)
        return self._znyzka_frykt_repo