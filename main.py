import os
import django
from dotenv import load_dotenv

load_dotenv()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Turkish_mahasyn.settings')
django.setup()

def demo():
    from appi_app.models import Client
    print(f"Кількість клієнтів у Neon: {Client.objects.count()}")

if __name__ == "__main__":
    try:
        demo()
    except Exception as e:
        print(f"Виникла помилка: {e}")