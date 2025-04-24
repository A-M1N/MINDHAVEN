import os
import django
import json
from datetime import datetime

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mindhaven.settings")
django.setup()

from core.models import *
from bson import ObjectId


def load_sample_data():
    # Read the sample data
    with open("sample_data.json", "r") as file:
        data = json.load(file)

    # Create users first to get their IDs
    user_id_map = {}  # Map to store email to ObjectId mapping
    for user_data in data["users"]:
        result = Users.create_user(
            name=user_data["name"],
            email=user_data["email"],
            password=user_data["password"],
            preferences=user_data["preferences"],
        )
        # Store the mapping of email to ObjectId
        user_id_map[user_data["email"]] = result.inserted_id

    # Create a mapping for placeholder IDs
    id_mapping = {
        "USER_ID_1": user_id_map["john.smith@example.com"],
        "USER_ID_2": user_id_map["emma.wilson@example.com"],
        "USER_ID_3": user_id_map["michael.chen@example.com"],
    }

    # Create blog posts and store their IDs
    blog_post_ids = {}
    for post in data["blog_posts"]:
        result = BlogPosts.create_post(
            user_id=id_mapping[post["user_id"]],
            title=post["title"],
            content=post["content"],
            is_anonymous=post["is_anonymous"],
        )
        if "BLOG_POST_ID_1" not in blog_post_ids:
            blog_post_ids["BLOG_POST_ID_1"] = result.inserted_id
        else:
            blog_post_ids["BLOG_POST_ID_2"] = result.inserted_id

    # Create mood logs
    for log in data["mood_logs"]:
        MoodLogs.create_log(
            user_id=id_mapping[log["user_id"]],
            date=datetime.fromisoformat(log["date"].replace("Z", "+00:00")),
            mood=log["mood"],
            notes=log["notes"],
            score=log["score"],
        )

    # Create journal entries
    for entry in data["journal_entries"]:
        JournalEntries.create_entry(
            user_id=id_mapping[entry["user_id"]], content=entry["content"]
        )

    # Create comments
    for comment in data["comments"]:
        Comments.create_comment(
            post_id=blog_post_ids[comment["post_id"]],
            user_id=id_mapping[comment["user_id"]],
            content=comment["content"],
        )

    # Create exercises
    for exercise in data["exercises"]:
        Exercises.create_exercise(
            user_id=id_mapping[exercise["user_id"]],
            name=exercise["name"],
            type=exercise["type"],
            duration=exercise["duration"],
            completed=exercise["completed"],
        )

    # Create challenges
    for challenge in data["challenges"]:
        Challenges.create_challenge(
            user_id=id_mapping[challenge["user_id"]],
            name=challenge["name"],
            description=challenge["description"],
            type=challenge["type"],
            duration=challenge["duration"],
            start_date=datetime.fromisoformat(
                challenge["start_date"].replace("Z", "+00:00")
            ),
            end_date=datetime.fromisoformat(
                challenge["end_date"].replace("Z", "+00:00")
            ),
            status=challenge["status"],
        )

    # Create chat logs
    for log in data["chat_logs"]:
        ChatLogs.create_log(
            user_id=id_mapping[log["user_id"]],
            message=log["message"],
            sender=log["sender"],
        )

    # Create happy user tracking
    for tracking in data["happy_user_tracking"]:
        HappyUserTracking.create_tracking(
            user_id=id_mapping[tracking["user_id"]],
            date=datetime.fromisoformat(tracking["date"].replace("Z", "+00:00")),
            trigger=tracking["trigger"],
            context=tracking["context"],
        )

    # Create mood summaries
    for summary in data["mood_summaries"]:
        MoodSummaries.create_summary(
            user_id=id_mapping[summary["user_id"]],
            start_date=datetime.fromisoformat(
                summary["start_date"].replace("Z", "+00:00")
            ),
            end_date=datetime.fromisoformat(summary["end_date"].replace("Z", "+00:00")),
            summary=summary["summary"],
        )


if __name__ == "__main__":
    try:
        load_sample_data()
        print("Sample data loaded successfully!")
    except Exception as e:
        print(f"Error loading sample data: {str(e)}")
