import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Turkish_mahasyn.settings')
django.setup()


def check_tables():
    tables_to_check = [
        'перевізники',
        'реклама',
        'постачання продукції',
        'знижка на спеції',
        'знижка на сухофрукти'
    ]

    with connection.cursor() as cursor:
        for table in tables_to_check:
            try:
                cursor.execute(f"SHOW COLUMNS FROM `{table}`")
                columns = cursor.fetchall()
                print(f"\nТаблиця: {table}")
                print("-" * 30)
                for col in columns:
                    print(f"'{col[0]}'")
            except Exception as e:
                print(f"\nТаблиця {table} - ПОМИЛКА: {e}")


if __name__ == "__main__":
    check_tables()