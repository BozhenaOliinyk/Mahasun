import pandas as pd
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Sum, Count, Avg, Max, Min, F, Q
from .models import (
    PostachannyaProduktsii, Klyent, Pracivnyk,
    TorhovaTochka, ZnyzhkaNaSpecii, IvankaClient
)


class AnalyticsBaseView(APIView):
    def df_to_response(self, queryset):
        data = list(queryset)

        if not data:
            return Response({"message": "No data available", "data": []})

        df = pd.DataFrame(data)

        if 'total_quantity' in df.columns:
            df['total_quantity'] = df['total_quantity'].astype(float).round(2)

        return Response(df.to_dict(orient='records'))

class SupplyVolumeByShopView(AnalyticsBaseView):
    def get(self, request):
        queryset = PostachannyaProduktsii.objects.values(
            shop_name=F('tochka__nazva'),
            shop_address=F('tochka__adres')
        ).annotate(
            total_quantity=Sum('quantity'),
            total_cost=Sum(F('price') * F('quantity'))
        ).order_by('-total_cost')

        return self.df_to_response(queryset)


class ClientBonusesStatsView(AnalyticsBaseView):
    def get(self, request):
        queryset = Klyent.objects.values(
            card_type=F('kartka__typ')
        ).annotate(
            client_count=Count('id'),
            avg_bonuses=Avg('bonusy'),
            max_bonuses=Max('bonusy')
        ).order_by('card_type')

        return self.df_to_response(queryset)


class SupplierEfficiencyView(APIView):
    def get(self, request):
        queryset = PostachannyaProduktsii.objects.values(
            'price',
            provider=F('postachalnyk__nazva_merezhi')
        )

        df = pd.DataFrame(list(queryset))

        if df.empty:
            return Response([])

        df['price'] = df['price'].astype(float)

        stats_df = df.groupby('provider')['price'].agg(
            supply_count='count',
            min_price='min',
            max_price='max',
            avg_price='mean',
            median_price='median'
        ).reset_index()

        cols = ['avg_price', 'median_price']
        stats_df[cols] = stats_df[cols].round(2)

        stats_df = stats_df.sort_values(by='median_price')

        result_data = stats_df.to_dict(orient='records')

        return Response(result_data)



class ShopStaffingView(AnalyticsBaseView):
    def get(self, request):
        queryset = TorhovaTochka.objects.annotate(
            worker_count=Count('pracivnyk')
        ).filter(
            worker_count__gt=0
        ).values(
            'nazva',
            'adres',
            'worker_count'
        ).order_by('-worker_count')

        return self.df_to_response(queryset)


class DiscountAnalysisView(AnalyticsBaseView):
    def get(self, request):
        queryset = ZnyzhkaNaSpecii.objects.values(
            card_type=F('karta__typ'),
            spice_name=F('specia__nazva')
        ).annotate(
            avg_discount=Avg('znyzhka')
        ).order_by('card_type', '-avg_discount')

        return self.df_to_response(queryset)


class DriedFruitWorkersView(AnalyticsBaseView):
    def get(self, request):
        queryset = Pracivnyk.objects.filter(
            tochka__postachannyaproduktsii__sukhofrukt__isnull=False
        ).values(
            full_name=F('prizvyshche'),
            shop=F('tochka__nazva')
        ).distinct()

        return self.df_to_response(queryset)




class IvankaClientDeleteAPI(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def delete(self, request, pk):
        try:
            client = IvankaClient.objects.using('colleague_db').get(pk=pk)
            client.delete()
            return Response(
                {"message": f"Клієнта {pk} успішно видалено"},
                status=status.HTTP_204_NO_CONTENT
            )
        except IvankaClient.DoesNotExist:
            return Response(
                {"error": "Клієнт не знайдений"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )