from pymongo import MongoClient
from mongoengine import connect
from core.models import (
    Users, MoodLogs, JournalEntries, BlogPosts, 
    Challenges, ChatLogs, HappyUserTracking, MoodSummaries
)

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['mindhaven']

# List of all collections
collections = [
    'users',
    'mood_logs',
    'journal_entries',
    'blog_posts',
    'challenges',
    'chat_logs',
    'happy_user_tracking',
    'mood_summaries'
]

# Create collections
for collection_name in collections:
    try:
        db.create_collection(collection_name)
        print(f"Created collection: {collection_name}")
    except Exception as e:
        if "already exists" in str(e):
            print(f"Collection {collection_name} already exists")
        else:
            print(f"Error creating {collection_name}: {e}")

# Also ensure indexes through MongoEngine
connect('mindhaven')
models = [Users, MoodLogs, JournalEntries, BlogPosts, 
          Challenges, ChatLogs, HappyUserTracking, MoodSummaries]

for model in models:
    print(f"\nEnsuring indexes for {model.__name__}")
    model.ensure_indexes()

print("\nDone! All collections should now be visible in MongoDB Compass.") 