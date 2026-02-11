from .models import Favorite

def favorites_processor(request):
    client_id = request.session.get('client_id')
    if client_id:
        favs = Favorite.objects.filter(client_id_id=client_id).select_related('spice_id')
        return {'user_favorites': favs}
    return {'user_favorites': []}