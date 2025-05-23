# Add this new URL pattern for profile image uploads
path(
    "api/upload_profile_image/<str:user_id>/",
    views.upload_profile_image,
    name="upload_profile_image",
),
