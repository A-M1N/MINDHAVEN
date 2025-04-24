from rest_framework import serializers
from .models import Users, MoodLogs, JournalEntries, BlogPosts, Comments, Exercises, Challenges, ChatLogs, HappyUserTracking, MoodSummaries

class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = ["_id", "name", "email", "preferences"]

class MoodLogsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodLogs
        fields = '__all__'

class JournalEntriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntries
        fields = '__all__'

class BlogPostsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPosts
        fields = '__all__'

class CommentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comments
        fields = '__all__'

class ExercisesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercises
        fields = '__all__'

class ChallengesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Challenges
        fields = '__all__'

class ChatLogsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatLogs
        fields = '__all__'

class HappyUserTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = HappyUserTracking
        fields = '__all__'

class MoodSummariesSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodSummaries
        fields = '__all__' 