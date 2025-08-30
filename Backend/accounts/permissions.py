from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow admin users.
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_admin()
        )


class IsAdminOrOwner(permissions.BasePermission):
    """
    Custom permission to only allow admin users or object owners.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Admin users can access anything
        if request.user.is_admin():
            return True
        
        # Object owners can access their own objects
        if hasattr(obj, 'author'):
            return obj.author == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        else:
            return obj == request.user


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        if hasattr(obj, 'author'):
            return obj.author == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        else:
            return obj == request.user