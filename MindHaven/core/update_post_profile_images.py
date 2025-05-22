from pymongo import MongoClient
from bson.objectid import ObjectId
from django.conf import settings

client = MongoClient(settings.MONGODB_HOST)
db = client[settings.MONGODB_NAME]


def update_blog_posts_with_profile_images():
    posts = db.blog_posts.find({})
    updated = 0
    for post in posts:
        if post.get("is_anonymous"):
            image = None
        else:
            user = db.users.find_one({"_id": post["user_id"]})
            image = user.get("profile_image") if user else None
        db.blog_posts.update_one({"_id": post["_id"]}, {"$set": {"image": image}})
        updated += 1
    print(f"Updated {updated} blog posts with profile images.")


if __name__ == "__main__":
    update_blog_posts_with_profile_images()
