import uuid
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserVerification, UserAddress, SellerProfile

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'confirm_password', 'first_name', 'last_name', 'phone']
    
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('confirm_password'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
    
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone', '')
        )
        
        # Create verification token
        verification = UserVerification.objects.create(
            user=user,
            verification_type='email',
            token=str(uuid.uuid4()),
            expires_at=timezone.now() + timedelta(days=1)
        )
        
        # Send verification email (mock for now)
        self.send_verification_email(user, verification.token)
        
        return user
    
    def send_verification_email(self, user, token):
        # In production, send actual email
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        print(f"Verification URL for {user.email}: {verification_url}")


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email').lower()
        password = attrs.get('password')
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid email or password.")
        
        if not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")
        
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")
        
        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name', 
            'phone', 'avatar', 'bio', 'is_verified', 'is_seller',
            'currency', 'language', 'date_joined'
        ]
        read_only_fields = ['id', 'email', 'is_verified', 'is_seller', 'date_joined']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone',
            'avatar', 'bio', 'is_verified', 'is_seller',
            'currency', 'language', 'email_notifications', 'sms_notifications'
        ]
        read_only_fields = ['id', 'email', 'is_verified', 'is_seller']


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"new_password": "Passwords don't match."})
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        if not User.objects.filter(email=value.lower()).exists():
            # Don't reveal if email exists
            pass
        return value.lower()


class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = [
            'id', 'address_type', 'is_default', 'street_address',
            'apartment', 'city', 'state', 'postal_code', 'country',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        user = self.context['request'].user
        
        # If this is the first address, make it default
        if not UserAddress.objects.filter(user=user).exists():
            validated_data['is_default'] = True
        
        # If setting as default, unset others
        if validated_data.get('is_default'):
            UserAddress.objects.filter(user=user, address_type=validated_data['address_type']).update(is_default=False)
        
        return UserAddress.objects.create(user=user, **validated_data)


class SellerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = SellerProfile
        fields = [
            'user', 'business_name', 'business_description', 'business_logo',
            'verification_status', 'tax_id', 'website',
            'total_sales', 'total_revenue', 'rating', 'review_count',
            'payout_method', 'payout_email', 'created_at'
        ]
        read_only_fields = [
            'verification_status', 'verified_at', 'total_sales',
            'total_revenue', 'rating', 'review_count', 'created_at'
        ]