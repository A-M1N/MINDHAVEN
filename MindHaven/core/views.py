from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import json
from bson import ObjectId
from .models import BlogPosts, Users, Comments, Exercises, ChatLogs
import traceback
from .models import MoodLogs
from datetime import datetime
from bson import ObjectId
from datetime import datetime
from django.conf import settings
import os
import sys


@csrf_exempt
def get_blog_posts(request):
    if request.method == "GET":
        try:
            posts_cursor = BlogPosts.get_posts(sort_by_date=True)
            posts_list = []

            for post in posts_cursor:
                user = Users.find_by_id(post["user_id"])
                author_name = user.get("name", "Anonymous") if user else "Anonymous"
                profile_image = (
                    user.get("profile_image", Users.DEFAULT_PROFILE_IMAGE)
                    if user
                    else Users.DEFAULT_PROFILE_IMAGE
                )
                # Count comments for this post
                comment_count = Comments.get_collection().count_documents(
                    {"post_id": post["_id"]}
                )

                post_data = {
                    "_id": str(post["_id"]),
                    "user_id": str(post["user_id"]),
                    "title": post.get("title", ""),
                    "content": post.get("content", ""),
                    "is_anonymous": post.get("is_anonymous", False),
                    "author_name": (
                        "Anonymous" if post.get("is_anonymous") else author_name
                    ),
                    "author_profile_image": (
                        None if post.get("is_anonymous") else profile_image
                    ),
                    "like_count": post.get("like_count", 0),
                    "comment_count": comment_count,
                    "created_at": post["created_at"].isoformat(),
                    "likes": [
                        {
                            "user_id": str(like["user_id"]),
                            "created_at": like["created_at"].isoformat(),
                        }
                        for like in post.get("likes", [])
                    ],
                }
                posts_list.append(post_data)

            return JsonResponse({"blog_posts": posts_list})

        except Exception as e:
            print(f"Error in get_blog_posts: {str(e)}")
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def create_blog_post(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            result = BlogPosts.create_post(
                user_id=data["user_id"],
                title=data["title"],
                content=data["content"],
                is_anonymous=data.get("is_anonymous", False),
            )

            return JsonResponse(
                {
                    "success": True,
                    "message": "Post created successfully",
                    "post_id": str(result.inserted_id),
                }
            )

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def toggle_like(request, post_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")

            if not user_id:
                return JsonResponse({"error": "User ID is required"}, status=400)

            liked = BlogPosts.add_like(post_id, user_id)

            return JsonResponse({"success": True, "liked": liked})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def user_profile(request):
    if request.method == "GET":
        try:
            # Assuming you have a way to identify the current user, e.g., through a session or token
            user = Users.find_by_id(
                "current_user_id"
            )  # Replace 'current_user_id' with actual user identification logic

            if user:
                # Calculate mood stats (this is a placeholder, you'll need to implement this based on your actual data)
                mood_stats = 75  # Example value

                return JsonResponse(
                    {
                        "name": user["name"],
                        "email": user["email"],
                        "profileImage": "default_profile_image_url",  # Replace with actual image URL
                        "moodStats": mood_stats,
                    }
                )
            else:
                return JsonResponse({"error": "User not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def login(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")
            password = data.get("password")

            if not email or not password:
                return JsonResponse(
                    {"error": "Email and password are required"}, status=400
                )

            user = Users.find_by_email(email)

            if user is None:
                return JsonResponse({"error": "User not found"}, status=404)

            # Since user is a dictionary, use '_id' to access the user ID
            print(f"User found: {user}")  # Log user object for debugging

            if Users.verify_password(user, password):
                # Use '_id' instead of 'id' for MongoDB
                return JsonResponse(
                    {
                        "message": "Login successful",
                        "user_id": str(
                            user["_id"]
                        ),  # MongoDB's _id should be converted to string
                    },
                    status=200,
                )
            else:
                return JsonResponse(
                    {"error": "Email or password is incorrect"}, status=401
                )
        except Exception as e:
            traceback.print_exc()  # Show full error stack trace in terminal
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Create your views here.
@csrf_exempt  # Needed for POST requests from external clients
def add_user(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            # Extract values from the data dictionary
            name = data.get("name")
            email = data.get("email")
            password = data.get("password")
            preferences = data.get("preferences", {})

            # Use the create_user method from our MongoDB model
            result = Users.create_user(
                name=name, email=email, password=password, preferences=preferences
            )

            return JsonResponse(
                {
                    "message": "User added successfully",
                    "user_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# --- Profile Image Upload ---
@csrf_exempt
def upload_profile_image(request):
    if request.method == "POST":
        try:
            print("\n=== Starting Profile Image Upload ===")

            # Debug request information
            print("Content Type:", request.content_type)
            print("POST data:", dict(request.POST))
            print("FILES data:", dict(request.FILES))

            # Get user_id from POST data
            user_id = request.POST.get("user_id")
            print(f"User ID from POST: {user_id}")

            # Get image from FILES
            image = request.FILES.get("image")
            print(f"Image from FILES: {image}")
            if image:
                print(f"Image name: {image.name}")
                print(f"Image size: {image.size}")
                print(f"Image content type: {image.content_type}")

            if not user_id:
                return JsonResponse({"error": "Missing user_id"}, status=400)
            if not image:
                return JsonResponse({"error": "Missing image file"}, status=400)

            # Get absolute paths
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            media_root = os.path.join(base_dir, "media")
            upload_dir = os.path.join(media_root, "profile_images")

            print(f"Base directory: {base_dir}")
            print(f"Media root path: {media_root}")
            print(f"Upload directory path: {upload_dir}")

            # Ensure directories exist
            try:
                os.makedirs(media_root, exist_ok=True)
                os.makedirs(upload_dir, exist_ok=True)
                print("Directories created/verified successfully")
            except Exception as e:
                print(f"Error creating directories: {str(e)}")
                return JsonResponse(
                    {"error": f"Failed to create upload directory: {str(e)}"},
                    status=500,
                )

            # Generate filename and path
            filename = f"{user_id}_{image.name}"
            image_path = os.path.join(upload_dir, filename)

            print(f"Attempting to save image to: {image_path}")

            # Save the file with error handling
            try:
                with open(image_path, "wb+") as destination:
                    for chunk in image.chunks():
                        destination.write(chunk)
                print(f"File saved successfully to {image_path}")

                # Verify file exists and size
                if not os.path.exists(image_path):
                    raise Exception("File was not saved successfully")

                file_size = os.path.getsize(image_path)
                print(f"Saved file size: {file_size} bytes")

                if file_size == 0:
                    raise Exception("File was saved but is empty")

            except Exception as e:
                print(f"Error saving file: {str(e)}")
                return JsonResponse(
                    {"error": f"Failed to save image: {str(e)}"}, status=500
                )

            # Build the absolute URL to serve the image
            image_url = f"http://127.0.0.1:8000/media/profile_images/{filename}"
            print(f"Image URL: {image_url}")

            # Update the user profile_image field with absolute URL
            try:
                result = Users.update_profile_image(user_id, image_url)
                if not result.acknowledged:
                    raise Exception("MongoDB update was not acknowledged")

                # Verify the update was successful
                updated_user = Users.find_by_id(user_id)
                if updated_user and updated_user.get("profile_image") == image_url:
                    print("User profile successfully updated with new image URL")
                else:
                    raise Exception("Failed to verify user profile update")

            except Exception as e:
                print(f"Error updating user profile: {str(e)}")
                return JsonResponse(
                    {"error": f"Failed to update user profile: {str(e)}"}, status=500
                )

            print("=== Profile Image Upload Complete ===\n")
            return JsonResponse(
                {
                    "profile_image": f"/media/profile_images/{filename}",
                    "success": True,
                    "message": "Profile image updated successfully",
                }
            )

        except Exception as e:
            print("\n=== Error in Profile Image Upload ===")
            print(f"Error type: {type(e).__name__}")
            print(f"Error message: {str(e)}")
            import traceback

            traceback.print_exc()
            print("===================================\n")
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user(request, user_id):
    if request.method == "GET":
        try:
            # Find user by ID
            user = Users.find_by_id(user_id)

            if user:
                # Convert ObjectId to string for JSON serialization
                user["_id"] = str(user["_id"])
                # Add default profile image if none exists
                if "profile_image" not in user:
                    user["profile_image"] = (
                        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
                    )
                return JsonResponse(user)
            else:
                return JsonResponse({"error": "User not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_all(request):
    if request.method == "GET":
        try:
            # Get all users and convert cursor to list
            users_cursor = Users.get_all()
            users_list = []

            # Convert each document to be JSON serializable
            for user in users_cursor:
                # Convert ObjectId to string
                user["_id"] = str(user["_id"])
                users_list.append(user)

            return JsonResponse({"users": users_list}, safe=True)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# MoodLogs Views
@csrf_exempt
def add_mood_log(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            date = data.get("date")
            mood = data.get("mood")
            notes = data.get("notes", "")
            score = data.get("score")

            result = MoodLogs.create_log(
                user_id=user_id, date=date, mood=mood, notes=notes, score=score
            )

            return JsonResponse(
                {
                    "message": "Mood log added successfully",
                    "log_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_mood_logs(request, user_id):
    if request.method == "GET":
        try:
            logs_cursor = MoodLogs.find_by_user(user_id)
            logs_list = []

            for log in logs_cursor:
                log["_id"] = str(log["_id"])
                log["user_id"] = str(log["user_id"])
                logs_list.append(log)

            return JsonResponse({"mood_logs": logs_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Journal Entries Views
@csrf_exempt
def add_journal_entry(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            content = data.get("content")

            result = JournalEntries.create_entry(user_id=user_id, content=content)

            return JsonResponse(
                {
                    "message": "Journal entry added successfully",
                    "entry_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_journal_entries(request, user_id):
    if request.method == "GET":
        try:
            entries_cursor = JournalEntries.find({"user_id": ObjectId(user_id)})
            entries_list = []

            for entry in entries_cursor:
                entry["_id"] = str(entry["_id"])
                entry["user_id"] = str(entry["user_id"])
                entries_list.append(entry)

            return JsonResponse({"journal_entries": entries_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Comments Views
@csrf_exempt
def add_comment(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            post_id = data.get("post_id")
            user_id = data.get("user_id")
            content = data.get("content")

            if not all([post_id, user_id, content]):
                return JsonResponse({"error": "Missing required fields"}, status=400)

            try:
                result, comment_doc = Comments.create_comment(
                    post_id=post_id, user_id=user_id, content=content
                )

                return JsonResponse(
                    {
                        "message": "Comment added successfully",
                        "comment_id": str(result.inserted_id),
                        "comment": {
                            "post_id": str(post_id),
                            "user_id": str(user_id),
                            "content": content,
                            "created_at": comment_doc["created_at"].isoformat(),
                            "user_name": comment_doc["user_name"],
                            "user_image": comment_doc["user_image"],
                        },
                    },
                    status=201,
                )

            except Exception as e:
                return JsonResponse({"error": f"Database error: {str(e)}"}, status=500)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def get_post_comments(request, post_id):
    if request.method == "GET":
        try:
            comments_cursor = Comments.get_comments_for_post(post_id)
            comments_list = []

            for comment in comments_cursor:
                user = Users.find_by_id(comment["user_id"])
                user_name = user.get("name", "Anonymous") if user else "Anonymous"
                comments_list.append(
                    {
                        "_id": str(comment["_id"]),
                        "user_id": str(comment["user_id"]),
                        "post_id": str(comment["post_id"]),
                        "content": comment["content"],
                        "created_at": comment["created_at"].isoformat(),
                        "user_name": user_name,
                        "user_name": comment.get("user_name", "Unknown"),
                        "user_image": comment.get("user_image", None),
                    }
                )

            return JsonResponse({"comments": comments_list})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def toggle_comment_like(request, comment_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")

            if not user_id:
                return JsonResponse({"error": "User ID is required"}, status=400)

            result = Comments.add_like(comment_id, user_id)

            return JsonResponse(
                {
                    "success": True,
                    "liked": result["liked"],
                    "like_count": result["like_count"],
                }
            )

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Exercises Views
@csrf_exempt
def add_exercise(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            name = data.get("name")
            type = data.get("type")
            duration = data.get("duration")
            completed = data.get("completed", False)

            result = Exercises.create_exercise(
                user_id=user_id,
                name=name,
                type=type,
                duration=duration,
                completed=completed,
            )
            print("saved successfully")

            return JsonResponse(
                {
                    "message": "Exercise added successfully",
                    "exercise_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_exercises(request, user_id):
    if request.method == "GET":
        try:
            exercises_cursor = Exercises.find({"user_id": ObjectId(user_id)})
            exercises_list = []

            for exercise in exercises_cursor:
                exercise["_id"] = str(exercise["_id"])
                exercise["user_id"] = str(exercise["user_id"])
                exercises_list.append(exercise)

            return JsonResponse({"exercises": exercises_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Challenges Views
@csrf_exempt
def add_challenge(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            name = data.get("name")
            description = data.get("description")
            type = data.get("type")
            duration = data.get("duration")
            start_date = data.get("start_date")
            end_date = data.get("end_date")
            status = data.get("status", "pending")

            result = Challenges.create_challenge(
                user_id=user_id,
                name=name,
                description=description,
                type=type,
                duration=duration,
                start_date=start_date,
                end_date=end_date,
                status=status,
            )

            return JsonResponse(
                {
                    "message": "Challenge added successfully",
                    "challenge_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_challenges(request, user_id):
    if request.method == "GET":
        try:
            challenges_cursor = Challenges.find({"user_id": ObjectId(user_id)})
            challenges_list = []

            for challenge in challenges_cursor:
                challenge["_id"] = str(challenge["_id"])
                challenge["user_id"] = str(challenge["user_id"])
                challenges_list.append(challenge)

            return JsonResponse({"challenges": challenges_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Chat Logs Views
@csrf_exempt
def add_chat_log(request):
    if request.method == "POST":
        try:
            print("[add_chat_log] Raw body:", request.body, file=sys.stderr)
            data = json.loads(request.body)
            print("[add_chat_log] Parsed data:", data, file=sys.stderr)
            user_id = data.get("user_id")
            message = data.get("message")
            sender = data.get("sender")

            result = ChatLogs.create_log(
                user_id=user_id, message=message, sender=sender
            )

            print("[add_chat_log] Saved successfully", file=sys.stderr)
            return JsonResponse(
                {
                    "message": "Chat log added successfully",
                    "log_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            import traceback

            print("[add_chat_log] Exception:", str(e), file=sys.stderr)
            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_chat_logs(request, user_id):
    if request.method == "GET":
        try:
            logs_cursor = ChatLogs.find({"user_id": ObjectId(user_id)})
            logs_list = []

            for log in logs_cursor:
                log["_id"] = str(log["_id"])
                log["user_id"] = str(log["user_id"])
                logs_list.append(log)

            return JsonResponse({"chat_logs": logs_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Happy User Tracking Views
@csrf_exempt
def add_happy_tracking(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            date = data.get("date")
            trigger = data.get("trigger")
            context = data.get("context")

            result = HappyUserTracking.create_tracking(
                user_id=user_id, date=date, trigger=trigger, context=context
            )

            return JsonResponse(
                {
                    "message": "Happy tracking added successfully",
                    "tracking_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_happy_tracking(request, user_id):
    if request.method == "GET":
        try:
            tracking_cursor = HappyUserTracking.find({"user_id": ObjectId(user_id)})
            tracking_list = []

            for tracking in tracking_cursor:
                tracking["_id"] = str(tracking["_id"])
                tracking["user_id"] = str(tracking["user_id"])
                tracking_list.append(tracking)

            return JsonResponse({"happy_tracking": tracking_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


# Mood Summaries Views
@csrf_exempt
def add_mood_summary(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            user_id = data.get("user_id")
            start_date = data.get("start_date")
            end_date = data.get("end_date")
            summary = data.get("summary")

            result = MoodSummaries.create_summary(
                user_id=user_id,
                start_date=start_date,
                end_date=end_date,
                summary=summary,
            )

            return JsonResponse(
                {
                    "message": "Mood summary added successfully",
                    "summary_id": str(result.inserted_id),
                },
                status=201,
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


def get_user_mood_summaries(request, user_id):
    if request.method == "GET":
        try:
            summaries_cursor = MoodSummaries.find({"user_id": ObjectId(user_id)})
            summaries_list = []

            for summary in summaries_cursor:
                summary["_id"] = str(summary["_id"])
                summary["user_id"] = str(summary["user_id"])
                summaries_list.append(summary)

            return JsonResponse({"mood_summaries": summaries_list})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def update_default_profile_images(request):
    if request.method == "POST":
        try:
            # Update all users without profile images
            updated_count = Users.set_default_profile_images()
            return JsonResponse(
                {
                    "message": f"Updated {updated_count} users with default profile images",
                    "updated_count": updated_count,
                }
            )
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)
