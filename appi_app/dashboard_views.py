import time
import concurrent.futures
import pandas as pd
import plotly.express as px
from plotly.offline import plot
from bokeh.plotting import figure
from bokeh.embed import components
from bokeh.models import ColumnDataSource, HoverTool
from bokeh.palettes import Spectral6, Viridis256
from bokeh.transform import linear_cmap
from bokeh.resources import CDN

from django.shortcuts import render
from django.db.models import Sum, Count, Avg, F
from .models import (
    PostachannyaProduktsii, Klyent, Pracivnyk,
    TorhovaTochka, ZnyzhkaNaSpecii
)


def get_analytics_data():

    q1 = PostachannyaProduktsii.objects.values(
        shop_name=F('tochka__nazva')
    ).annotate(total_cost=Sum(F('price') * F('quantity')))
    df1 = pd.DataFrame(list(q1))
    if not df1.empty and 'total_cost' in df1.columns:
        df1['total_cost'] = df1['total_cost'].astype(float)

    q2 = Klyent.objects.values(card_type=F('kartka__typ')).annotate(count=Count('id'))
    df2 = pd.DataFrame(list(q2))

    q3 = PostachannyaProduktsii.objects.values(
        'price',
        'postachalnyk__nazva_merezhi'
    )
    df3 = pd.DataFrame(list(q3))
    if not df3.empty:
        df3.rename(columns={'postachalnyk__nazva_merezhi': 'provider'}, inplace=True)
        df3['price'] = df3['price'].astype(float)
        df3 = df3.groupby('provider')['price'].mean().reset_index(name='avg_price')

    q4 = TorhovaTochka.objects.annotate(worker_count=Count('pracivnyk')).filter(worker_count__gt=0).values('nazva',
                                                                                                           'worker_count')
    df4 = pd.DataFrame(list(q4))

    q5 = ZnyzhkaNaSpecii.objects.values(
        card_type=F('karta__typ'),
        spice_name=F('specia__nazva')
    ).annotate(avg_discount=Avg('znyzhka'))
    df5 = pd.DataFrame(list(q5))
    if not df5.empty and 'avg_discount' in df5.columns:
        df5['avg_discount'] = df5['avg_discount'].astype(float)

    q6 = Pracivnyk.objects.filter(tochka__postachannyaproduktsii__sukhofrukt__isnull=False).values(
        'tochka__nazva').annotate(cnt=Count('id'))
    df6 = pd.DataFrame(list(q6))

    return df1, df2, df3, df4, df5, df6


def dashboard_plotly(request):
    df1, df2, df3, df4, df5, df6 = get_analytics_data()

    min_cost = float(request.GET.get('min_cost', 0))
    if not df1.empty and 'total_cost' in df1.columns:
        df1 = df1[df1['total_cost'] >= min_cost]

    graphs = []

    if not df1.empty:
        fig1 = px.bar(df1, x='shop_name', y='total_cost', title="1. Вартість постачання", color='total_cost')
        graphs.append(plot(fig1, output_type='div'))

    if not df2.empty:
        fig2 = px.pie(df2, names='card_type', values='count', title="2. Бонусні картки клієнтів")
        graphs.append(plot(fig2, output_type='div'))

    if not df3.empty:
        fig3 = px.scatter(df3, x='provider', y='avg_price', size='avg_price', title="3. Ціни постачальників")
        graphs.append(plot(fig3, output_type='div'))

    if not df4.empty:
        fig4 = px.bar(df4, x='nazva', y='worker_count', title="4. Працівники точок", color='worker_count')
        graphs.append(plot(fig4, output_type='div'))

    if not df5.empty:
        fig5 = px.density_heatmap(df5, x='card_type', y='spice_name', z='avg_discount', title="5. Знижки на спеції",
                                  text_auto=True)
        graphs.append(plot(fig5, output_type='div'))

    if not df6.empty:
        fig6 = px.funnel(df6, x='cnt', y='tochka__nazva', title="6. Працівники точок з сухофруктами")
        graphs.append(plot(fig6, output_type='div'))

    return render(request, 'dashboard_plotly.html', {'graphs': graphs})


def dashboard_bokeh(request):
    df1, df2, df3, df4, df5, df6 = get_analytics_data()

    scripts_divs = []

    if not df1.empty:
        source = ColumnDataSource(df1)
        x_range = list(map(str, df1['shop_name'].unique()))
        p = figure(x_range=x_range, height=350, title="1. Вартість постачання")
        p.vbar(x='shop_name', top='total_cost', width=0.9, source=source, color="#718dbf")
        scripts_divs.append(components(p))

    if not df2.empty:
        source = ColumnDataSource(df2)
        x_range = list(map(str, df2['card_type'].unique()))
        p = figure(x_range=x_range, height=350, title="2. Бонусні картки клієнтів")
        p.vbar(x='card_type', top='count', width=0.5, source=source, color="green")
        scripts_divs.append(components(p))

    if not df3.empty:
        source = ColumnDataSource(df3)
        x_range = list(map(str, df3['provider'].unique()))
        p = figure(x_range=x_range, height=350, title="3. Ціни постачальників")
        p.circle(x='provider', y='avg_price', size=15, source=source, color="navy", alpha=0.5)
        scripts_divs.append(components(p))

    if not df4.empty:
        source = ColumnDataSource(df4)
        x_range = list(map(str, df4['nazva'].unique()))
        p = figure(x_range=x_range, height=350, title="4. Працівники точок")
        p.vbar(x='nazva', top='worker_count', width=0.5, source=source, color="orange")
        scripts_divs.append(components(p))

    if not df5.empty:
        source = ColumnDataSource(df5)
        x_range = list(map(str, df5['card_type'].unique()))
        p = figure(x_range=x_range, height=350, title="5. Знижки на спеції")
        mapper = linear_cmap(field_name='avg_discount', palette=Viridis256, low=0, high=10)
        p.circle(x='card_type', y='avg_discount', size=20, source=source, color=mapper, legend_label="Знижка %")
        scripts_divs.append(components(p))

    if not df6.empty:
        source = ColumnDataSource(df6)
        y_range = list(map(str, df6['tochka__nazva'].unique()))
        p = figure(y_range=y_range, height=350, title="6. Працівники точок з сухофруктами")
        p.hbar(y='tochka__nazva', right='cnt', height=0.5, source=source, color="purple")
        scripts_divs.append(components(p))

    plots_context = [{'script': s, 'div': d} for s, d in scripts_divs]

    resources = CDN.render()

    return render(request, 'dashboard_bokeh.html', {
        'plots': plots_context,
        'resources': resources
    })




def run_db_query(n):
    return PostachannyaProduktsii.objects.count()


def performance_test_view(request):
    results = []
    total_queries = 50
    thread_counts = [1, 2, 4, 8, 16]

    for max_workers in thread_counts:
        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(run_db_query, i) for i in range(total_queries)]
            for future in concurrent.futures.as_completed(futures):
                pass
        end_time = time.time()
        duration = end_time - start_time
        results.append({'threads': max_workers, 'time': duration})

    df_perf = pd.DataFrame(results)

    fig = px.line(
        df_perf, x='threads', y='time', markers=True,
        title=f'Залежність часу виконання {total_queries} запитів від к-сті потоків',
        labels={'threads': 'Кількість потоків', 'time': 'Час виконання (сек)'}
    )

    graph = plot(fig, output_type='div')

    return render(request, 'dashboard_performance.html', {
        'graph': graph,
        'table': df_perf.to_dict(orient='records')
    })

