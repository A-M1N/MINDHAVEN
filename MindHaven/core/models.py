from datetime import datetime
from bson.objectid import ObjectId
from pymongo import MongoClient
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password

# MongoDB connection
client = MongoClient(settings.MONGODB_HOST)
db = client[settings.MONGODB_NAME]


# ==============================
# Base MongoDB Collection Class
# ==============================
class BaseCollection:
    """Base class for MongoDB collection interactions."""

    collection_name = None

    @classmethod
    def get_collection(cls):
        return db[cls.collection_name]

    @classmethod
    def create(cls, **kwargs):
        if "created_at" not in kwargs:
            kwargs["created_at"] = datetime.utcnow()
        return cls.get_collection().insert_one(kwargs)

    @classmethod
    def find_by_id(cls, id):
        if isinstance(id, str):
            id = ObjectId(id)
        return cls.get_collection().find_one({"_id": id})

    @classmethod
    def find(cls, filter=None, **kwargs):
        return cls.get_collection().find(filter or kwargs)

    @classmethod
    def update(cls, id, update_data):
        if isinstance(id, str):
            id = ObjectId(id)
        return cls.get_collection().update_one({"_id": id}, {"$set": update_data})

    @classmethod
    def delete(cls, id):
        if isinstance(id, str):
            id = ObjectId(id)
        return cls.get_collection().delete_one({"_id": id})

    @classmethod
    def get_all(cls):
        return cls.get_collection().find()


# =====================
# User Model
# =====================
class Users(BaseCollection):
    collection_name = "users"

    @classmethod
    def create_user(cls, name, email, password, preferences=None):
        hashed_password = make_password(password)
        return cls.create(
            name=name,
            email=email,
            password=hashed_password,
            preferences=preferences or {}
        )

    @classmethod
    def find_by_email(cls, email):
        return cls.get_collection().find_one({"email": email})

    @classmethod
    def verify_password(cls, user, raw_password):
        return user and "password" in user and check_password(raw_password, user["password"])


# =====================
# Mood Logs
# =====================
class MoodLogs(BaseCollection):
    collection_name = "mood_logs"

    @classmethod
    def create_log(cls, user_id, date, mood, notes="", score=None):
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return cls.create(user_id=user_id, date=date, mood=mood, notes=notes, score=score)

    @classmethod
    def find_by_user(cls, user_id):
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return cls.find({"user_id": user_id})


# =====================
# Journal Entries
# =====================
class JournalEntries(BaseCollection):
    collection_name = "journal_entries"

    @classmethod
    def create_entry(cls, user_id, content):
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return cls.create(user_id=user_id, content=content)


# =====================
# Blog Posts
# =====================

class BlogPosts(BaseCollection):
    collection_name = 'blog_posts'  # Use collection_name instead of collection

    @classmethod
    def create_post(cls, user_id, title, content, is_anonymous=False):
        user = Users.find_by_id(user_id)
        user_name = user.get("name", "Anonymous") if user else "Anonymous"
        
        post_data = {
            "user_id": ObjectId(user_id),
            "title": title,
            "content": content,
            "is_anonymous": is_anonymous,
            "author_name": "Anonymous" if is_anonymous else user_name,
            "likes": [],
            "like_count": 0
            # No need to add created_at, BaseCollection.create() will add it
        }
        return cls.create(**post_data)  # Use the create method from BaseCollection

    @classmethod
    def get_posts(cls, sort_by_date=True):
        posts = cls.get_all()
        if sort_by_date:
            return posts.sort("created_at", -1)
        return posts

    @classmethod
    def add_like(cls, post_id, user_id):
        post = cls.find_by_id(post_id)
        if not post:
            raise Exception("Post not found")

        user_id_obj = ObjectId(user_id)
        likes = post.get("likes", [])
        
        # Check if user already liked
        if user_id_obj in [like["user_id"] for like in likes]:
            # Remove like
            cls.update(post_id, {
                "likes": [like for like in likes if like["user_id"] != user_id_obj],
                "like_count": len(likes) - 1
            })
            return False
        else:
            # Add like
            new_like = {"user_id": user_id_obj, "created_at": datetime.utcnow()}
            likes.append(new_like)
            cls.update(post_id, {
                "likes": likes,
                "like_count": len(likes)
            })
            return True

    @classmethod
    def get_user_posts(cls, user_id):
        return cls.find(user_id=ObjectId(user_id))

# =====================
# Comments
# =====================
class Comments(BaseCollection):
    collection_name = "comments"

    @classmethod
    def create_comment(cls, post_id, user_id, content):
        post_id = ObjectId(post_id) if isinstance(post_id, str) else post_id
        user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        user = db.users.find_one({"_id": user_id})
            # Get user information
       
        user_name = user.get("name", "Anonymous") if user else "Anonymous"
        comment_doc = {
        "post_id": post_id,
        "user_id": user_id,
        "content": content,
        "created_at": datetime.utcnow(),
        "user_name": user_name,
        "user_image": user.get("profile_image", None),
        "likes": [],
        "like_count": 0
        }
        result = cls.get_collection().insert_one(comment_doc)
        return result, comment_doc

    @classmethod
    def get_comments_for_post(cls, post_id):
        post_id = ObjectId(post_id) if isinstance(post_id, str) else post_id
        return cls.get_collection().find({"post_id": post_id}).sort("created_at", -1)

    @classmethod
    def add_like(cls, post_id, user_id):
        try:
            post_id = ObjectId(post_id) if isinstance(post_id, str) else post_id
            user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id

            post = cls.get_collection().find_one({
                "_id": post_id,
                "likes": {"$elemMatch": {"user_id": user_id}}
            })

            if post:
                cls.get_collection().update_one(
                    {"_id": post_id},
                    {"$pull": {"likes": {"user_id": user_id}}, "$inc": {"like_count": -1}}
                )
                liked = False
            else:
                cls.get_collection().update_one(
                    {"_id": post_id},
                    {"$push": {"likes": {"user_id": user_id, "created_at": datetime.utcnow()}},
                     "$inc": {"like_count": 1}},
                    upsert=True
                )
                liked = True

            updated_post = cls.get_collection().find_one({"_id": post_id})
            return {"liked": liked, "like_count": updated_post.get("like_count", 0)}

        except Exception as e:
            raise Exception(f"Error handling like: {str(e)}")

    @classmethod
    def get_post_likes(cls, post_id):
        try:
            post_id = ObjectId(post_id) if isinstance(post_id, str) else post_id
            post = cls.get_collection().find_one({"_id": post_id})
            return {
                "like_count": post.get("like_count", 0),
                "likes": post.get("likes", [])
            } if post else {"like_count": 0, "likes": []}
        except Exception as e:
            raise Exception(f"Error getting likes: {str(e)}")


# =====================
# Exercises
# =====================
class Exercises(BaseCollection):
    collection_name = "exercises"

    @classmethod
    def create_exercise(cls, user_id, name, type, duration, completed=False):
        user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        return cls.create(user_id=user_id, name=name, type=type, duration=duration, completed=completed)


# =====================
# Challenges
# =====================
class Challenges(BaseCollection):
    collection_name = "challenges"

    @classmethod
    def create_challenge(cls, user_id, name, description, type, duration, start_date, end_date, status="pending"):
        user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        return cls.create(
            user_id=user_id,
            name=name,
            description=description,
            type=type,
            duration=duration,
            start_date=start_date,
            end_date=end_date,
            status=status
        )


# =====================
# Chat Logs
# =====================
class ChatLogs(BaseCollection):
    collection_name = "chat_logs"

    @classmethod
    def create_log(cls, user_id, message, sender):
        user_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        return cls.create(user_id=user_id, message=message, sender=sender)


# =====================
# Happy User Tracking (Placeholder)
# =====================
class HappyUserTracking(BaseCollection):
    collection_name = "happy_user_tracking"
