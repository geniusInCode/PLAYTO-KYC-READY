from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import HttpResponse
import os


def spa_index(request):
    """Serve the React SPA's index.html for all non-API routes."""
    dist_index = settings.BASE_DIR.parent / 'frontend' / 'dist' / 'index.html'
    if dist_index.exists():
        with open(dist_index, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return HttpResponse('<h1>Frontend not built. Run: npm run build</h1>', status=503)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('accounts.urls')),
    path('api/v1/', include('kyc.urls')),
    # SPA fallback — must be last
    re_path(r'^(?!api/|admin/|static/|media/).*$', spa_index),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
