# main.py
import pymysql
from repository import RepositoryManager
from entities import Klyent

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'MySQL',
    'database': 'mydb',
    'cursorclass': pymysql.cursors.DictCursor
}


def demo(repos: RepositoryManager):

    for k in repos.klyenty.all():
        print(k)

    pracivnyky = repos.pracivnyky.all()
    kartka = repos.kartky.get_by_id(1)

    new_klyent = repos.klyenty.create(
        prizvyshche="Олійник",
        imya="Божена",
        pobatkovi="Ігорівна",
        data="2023-12-01",
        bonusy=300,
        id_kartka=kartka.id
    )
    print("Створили нового клієнта")

    new_klyent.add_bonus(500, kartka)
    repos.klyenty.update(new_klyent.id, bonusy=new_klyent.bonusy)

    print("Оновили бонуси клієнта")
    for k in repos.klyenty.all():
        print(k)


    print("Видалили клієнта")
    repos.klyenty.delete(new_klyent.id)

    for k in repos.klyenty.all():
        print(k)

    for p in pracivnyky:
        if p.id_tochka:
            tochka = repos.tochky.get_by_id(p.id_tochka)
            print(f"Працівник {p.prizvyshche} {p.imya} {p.pobatkovi} працює у точці {tochka.nazva}")


if __name__ == "__main__":
    conn = None
    try:
        conn = pymysql.connect(**DB_CONFIG)
        repos = RepositoryManager(conn)
        demo(repos)
        conn.commit()
    except Exception as e:
        print(f"{e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
