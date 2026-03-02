from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserVerification, UserAddress, SellerProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'is_verified', 'is_seller', 'is_active', 'date_joined']
    list_filter = ['is_verified', 'is_seller', 'is_staff', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone', 'avatar', 'bio')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'is_seller', 'groups', 'user_permissions')}),
        ('Preferences', {'fields': ('currency', 'language', 'email_notifications', 'sms_notifications')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )


@admin.register(UserVerification)
class UserVerificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'verification_type', 'created_at', 'expires_at', 'is_used']
    list_filter = ['verification_type', 'is_used']
    search_fields = ['user__email']


@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'address_type', 'city', 'country', 'is_default']
    list_filter = ['address_type', 'country']


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'user', 'verification_status', 'rating', 'total_sales']
    list_filter = ['verification_status']
    search_fields = ['business_name', 'user__email']