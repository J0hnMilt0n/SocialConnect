from django.urls import path
from . import views

app_name = 'utils'

urlpatterns = [
    path('upload/image/', views.ImageUploadView.as_view(), name='upload_image'),
    path('upload/avatar/', views.AvatarUploadView.as_view(), name='upload_avatar'),
]