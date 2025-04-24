from django.contrib import admin
from .models import (
    Users,
    MoodLogs,
    JournalEntries,
    BlogPosts,
    Comments,
    Exercises,
    Challenges,
    ChatLogs,
    HappyUserTracking,
    MoodSummaries,
)


class MongoDBModelAdmin(admin.ModelAdmin):
    """Custom admin for MongoDB collections via pymongo"""

    # Default list display and search fields
    list_display = ("id",)
    search_fields = ()
    list_filter = ()

    # The pymongo collection this admin manages
    collection = None

    def get_queryset(self, request):
        """Return pymongo cursor as a queryset-like object"""
        if self.collection:
            return self.collection.get_all()
        return []

    def save_model(self, request, obj, form, change):
        """Save the object to MongoDB"""
        data = {field: getattr(obj, field) for field in form.cleaned_data}
        if change and hasattr(obj, "_id"):
            return self.collection.update(obj._id, data)
        else:
            return self.collection.create(**data)

    def delete_model(self, request, obj):
        """Delete the object from MongoDB"""
        if hasattr(obj, "_id"):
            return self.collection.delete(obj._id)

    def has_add_permission(self, request):
        return True

    def has_change_permission(self, request, obj=None):
        return True

    def has_delete_permission(self, request, obj=None):
        return True

    def lookup_allowed(self, lookup, value):
        return True


# Register your models with their collections
class UsersAdmin(MongoDBModelAdmin):
    collection = Users
    list_display = ("name", "email", "created_at")
    search_fields = ("name", "email")


class MoodLogsAdmin(MongoDBModelAdmin):
    collection = MoodLogs
    list_display = ("user_id", "date", "mood", "score")
    list_filter = ("mood", "date")


class JournalEntriesAdmin(MongoDBModelAdmin):
    collection = JournalEntries
    list_display = ("user_id", "created_at")
    search_fields = ("content",)


class BlogPostsAdmin(MongoDBModelAdmin):
    collection = BlogPosts
    list_display = ("title", "user_id", "is_anonymous", "created_at")
    list_filter = ("is_anonymous", "created_at")


class CommentsAdmin(MongoDBModelAdmin):
    collection = Comments
    list_display = ("user_id", "post_id", "created_at")


class ExercisesAdmin(MongoDBModelAdmin):
    collection = Exercises
    list_display = ("name", "type", "duration", "completed")
    list_filter = ("type", "completed")


class ChallengesAdmin(MongoDBModelAdmin):
    collection = Challenges
    list_display = ("name", "type", "start_date", "end_date", "status")
    list_filter = ("type", "status")


class ChatLogsAdmin(MongoDBModelAdmin):
    collection = ChatLogs
    list_display = ("user_id", "sender", "created_at")
    search_fields = ("message",)


class HappyUserTrackingAdmin(MongoDBModelAdmin):
    collection = HappyUserTracking
    list_display = ("user_id", "date", "trigger")
    list_filter = ("date",)


class MoodSummariesAdmin(MongoDBModelAdmin):
    collection = MoodSummaries
    list_display = ("user_id", "start_date", "end_date")
    list_filter = ("start_date", "end_date")


# Register all models
admin.site.register(Users, UsersAdmin)
admin.site.register(MoodLogs, MoodLogsAdmin)
admin.site.register(JournalEntries, JournalEntriesAdmin)
admin.site.register(BlogPosts, BlogPostsAdmin)
admin.site.register(Comments, CommentsAdmin)
admin.site.register(Exercises, ExercisesAdmin)
admin.site.register(Challenges, ChallengesAdmin)
admin.site.register(ChatLogs, ChatLogsAdmin)
admin.site.register(HappyUserTracking, HappyUserTrackingAdmin)
admin.site.register(MoodSummaries, MoodSummariesAdmin)
