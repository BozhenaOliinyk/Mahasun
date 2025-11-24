import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Turkish_mahasyn.settings')
django.setup()

from appi_app.models import Klyent, TypBonusnoiKartky, Pracivnyk, TorhovaTochka


def demo():
    for k in Klyent.objects.all():
        print(f"ID: {k.id}, Ім'я: {k.prizvyshche} {k.imya}, Бонуси: {k.bonusy}")

    try:
        kartka = TypBonusnoiKartky.objects.get(pk=1)
        print(f"Знайдено картку: {kartka.typ}")
    except TypBonusnoiKartky.DoesNotExist:
        print("Помилка: Картку з ID=1 не знайдено в БД! Створіть її через адмінку або сайт.")
        return

    print("\n--- 3. СТВОРЕННЯ НОВОГО КЛІЄНТА ---")
    new_klyent = Klyent.objects.create(
        prizvyshche="Олійник",
        imya="Божена",
        pobatkovi="Ігорівна",
        data="2023-12-01",
        bonusy=300,
        kartka=kartka
    )
    print(f"Створили клієнта: {new_klyent}")

    new_klyent.add_bonus(500)

    new_klyent.refresh_from_db()
    print(f"Бонуси після нарахування: {new_klyent.bonusy}")

    new_klyent.delete()
    print("Клієнта успішно видалено.")

    pracivnyky = Pracivnyk.objects.all()
    for p in pracivnyky:
        if p.tochka:
            print(f"Працівник {p.get_full_name()} працює у точці: {p.tochka.nazva}")
        else:
            print(f"Працівник {p.get_full_name()} не закріплений за точкою.")


if __name__ == "__main__":
    try:
        demo()
    except Exception as e:
        print(f"Виникла помилка: {e}")