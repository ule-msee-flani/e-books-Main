from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('verify-email/', views.verify_email, name='verify-email'),
    
    # Profile
    path('me/', views.profile, name='profile'),
    path('change-password/', views.change_password, name='change-password'),
    path('password-reset/', views.password_reset_request, name='password-reset'),
    
    # Addresses
    path('addresses/', views.addresses, name='addresses'),
    path('addresses/<uuid:pk>/', views.address_detail, name='address-detail'),
    
    # Seller
    path('seller/', views.seller_profile, name='seller-profile'),
]