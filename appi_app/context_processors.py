from .models import Favorite

def favorites_processor(request):
    client_id = request.session.get("client_id")

    if not client_id:
        return {"user_favorites": []}

    favs = (
        Favorite.objects
        .filter(client_id=client_id)
        .select_related("spice")
    )
    return {"user_favorites": favs}
