from .views import *
from django.urls import path

urlpatterns = [
    # User endpoints
    path("login/", login, name="login"),
    path("add_user/", add_user, name="add_user"),
    path("get_user/<str:user_id>/", get_user, name="get_user"),
    path("get_all/", get_all, name="get_all"),
    # MoodLogs endpoints
    path("add_mood_log/", add_mood_log, name="add_mood_log"),
    path(
        "get_user_mood_logs/<str:user_id>/",
        get_user_mood_logs,
        name="get_user_mood_logs",
    ),
    # Journal entries endpoints
    path("add_journal_entry/", add_journal_entry, name="add_journal_entry"),
    path(
        "get_user_journal_entries/<str:user_id>/",
        get_user_journal_entries,
        name="get_user_journal_entries",
    ),
    # Blog posts endpoints
    path('get_blog_posts/', get_blog_posts, name='get_blog_posts'),
    path('create_blog_post/', create_blog_post, name='create_blog_post'),
    path('toggle_like/<str:post_id>/',toggle_like, name='toggle_like'),
   
    # Comments endpoints
    path("add_comment/", add_comment, name="add_comment"),
    path(
        "get_post_comments/<str:post_id>/", get_post_comments, name="get_post_comments"
    ),
    path('toggle_comment_like/<str:comment_id>/', toggle_comment_like, name='toggle_comment_like'),

   
    # Exercises endpoints
    path("add_exercise/", add_exercise, name="add_exercise"),
    path(
        "get_user_exercises/<str:user_id>/",
        get_user_exercises,
        name="get_user_exercises",
    ),
    # Challenges endpoints
    path("add_challenge/", add_challenge, name="add_challenge"),
    path(
        "get_user_challenges/<str:user_id>/",
        get_user_challenges,
        name="get_user_challenges",
    ),
    # Chat logs endpoints
    path("add_chat_log/", add_chat_log, name="add_chat_log"),
    path(
        "get_user_chat_logs/<str:user_id>/",
        get_user_chat_logs,
        name="get_user_chat_logs",
    ),
    # Happy user tracking endpoints
    path("add_happy_tracking/", add_happy_tracking, name="add_happy_tracking"),
    path(
        "get_user_happy_tracking/<str:user_id>/",
        get_user_happy_tracking,
        name="get_user_happy_tracking",
    ),
    # Mood summaries endpointss
    path("add_mood_summary/", add_mood_summary, name="add_mood_summary"),
    path(
        "get_user_mood_summaries/<str:user_id>/",
        get_user_mood_summaries,
        name="get_user_mood_summaries",
    ),
    
]
