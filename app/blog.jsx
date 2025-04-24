import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Header = ({ onProfilePress }) => (
  <View style={styles.header}>
    <View style={styles.logoAndTitle}>
      <Image
        source={require("../assets/images/logo.png")} // Replace with your logo
        style={styles.logo}
      />
      <Text style={styles.title}>MindHaven Blog</Text>
    </View>
    <TouchableOpacity onPress={onProfilePress}>
      <Image
        source={require("../assets/images/profile.jpg")} // Replace with user's profile image
        style={styles.profileImage}
      />
    </TouchableOpacity>
  </View>
);

const PostSection = ({ title, content, setTitle, setContent, onPost }) => (
  <View style={styles.postSection}>
    <TextInput
      style={styles.postInput}
      placeholder="Title"
      value={title}
      onChangeText={setTitle}
    />
    <TextInput
      style={[styles.postInput, { marginTop: 10, height: 100 }]}
      placeholder="What's on your mind?"
      value={content}
      onChangeText={setContent}
      multiline
    />
    <TouchableOpacity style={styles.postButton} onPress={onPost}>
      <Text style={styles.postButtonText}>Post</Text>
    </TouchableOpacity>
  </View>
);

const Post = ({
  id,
  imageSource,
  author,
  title,
  content,
  onLike,
  onCommentLike,
  onShare,
  likeCount,
  isLiked,
  comments,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  fetchComments,
}) => {
  const [hasLoadedComments, setHasLoadedComments] = useState(false);
  useEffect(() => {
    if (!hasLoadedComments && id) {
      fetchComments(id);
      setHasLoadedComments(true);
    }
  }, [id, hasLoadedComments, fetchComments]);

  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Image source={imageSource} style={styles.postImage} />
        <Text style={styles.postAuthor}>{author}</Text>
      </View>
      <Text style={styles.postTitle}>{title}</Text>
      <Text style={styles.postContent}>{content}</Text>

      <View style={styles.postActions}>
        <TouchableOpacity
          style={[styles.likeButton, isLiked && styles.likeButtonActive]}
          onPress={() => onLike(id)}
        >
          <Image
            source={
              isLiked
                ? require("../assets/images/heart-filled.png")
                : require("../assets/images/heart-outline.jpg")
            }
            style={styles.likeIcon}
          />
          <Text style={styles.likeCount}>{likeCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onShare(id)}>
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsSectionTitle}>Comments</Text>

        {comments && comments.length > 0 ? (
          comments.map((comment, index) => (
            <View key={index} style={styles.comment}>
              <View style={styles.commentHeader}>
                <Image
                  source={require("../assets/images/defaultProfile.png")}
                  style={styles.commentUserImage}
                />
                <View style={styles.commentUserInfo}>
                  <Text style={styles.commentUserName}>
                    {comment.user_name || "Anonymous"}
                  </Text>
                  <Text style={styles.commentTime}>
                    {new Date(comment.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Text style={styles.commentContent}>{comment.content}</Text>
              <TouchableOpacity
                style={[
                  styles.likeButton,
                  comment.isLiked && styles.likeButtonActive,
                ]}
                onPress={() => onCommentLike(comment._id)}
              >
                <Image
                  source={
                    comment.isLiked
                      ? require("../assets/images/heart-filled.png")
                      : require("../assets/images/heart-outline.jpg")
                  }
                  style={styles.likeIcon}
                />
                <Text style={styles.likeCount}>{comment.like_count || 0}</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noComments}>No comments yet</Text>
        )}

        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            value={commentText}
            onChangeText={(text) => onCommentTextChange(id, text)}
          />
          <TouchableOpacity
            style={styles.commentButton}
            onPress={() => onSubmitComment(id)}
          >
            <Text style={styles.commentButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const LatestPostsSection = ({
  posts,
  onPostLike,
  onCommentLike,
  onShare,
  comments,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  likedPosts,
  fetchComments,
}) => {
  return (
    <ScrollView style={styles.latestPostsSection}>
      <Text style={styles.latestPostsTitle}>Latest Posts</Text>
      {posts
        .filter((post) => post.title && post.content)
        .map((post, index) => (
          <Post
            key={post._id ? post._id : `post-${index}`}
            id={post._id}
            imageSource={
              post.image
                ? { uri: post.image }
                : require("../assets/images/defaultProfile.png")
            }
            author={post.is_anonymous ? "Anonymous" : post.author_name}
            title={post.title}
            content={post.content}
            likeCount={post.like_count || 0}
            isLiked={likedPosts[post._id] || false}
            comments={comments[post._id] || []}
            commentText={commentText[post._id] || ""}
            onCommentTextChange={onCommentTextChange}
            onSubmitComment={onSubmitComment}
            onLike={onPostLike}
            onCommentLike={onCommentLike}
            onShare={onShare}
            fetchComments={fetchComments}
          />
        ))}
    </ScrollView>
  );
};

const Blog = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posts, setPosts] = useState([]);
  const [user_id, setUserId] = useState(null);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [likedComments, setLikedComments] = useState({});

  useEffect(() => {
    fetchUserId();
    fetchPosts();
  }, []);

  const fetchUserId = async () => {
    try {
      const userId = await AsyncStorage.getItem("user_id");
      console.log("Fetched user_id from storage:", userId); // Log for debugging
      if (userId !== null) {
        setUserId(userId);
      } else {
        console.log("User_id not found in storage, redirecting to login");
        Alert.alert("Error", "User not logged in");
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching user_id:", error);
      Alert.alert("Error", error.message);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/get_blog_posts/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch posts");
      }

      console.log("Raw response:", data);

      if (!data.blog_posts) {
        throw new Error("No posts data received");
      }

      setPosts(data.blog_posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      Alert.alert("Error", error.message || "Failed to fetch posts");
    }
  };

  // Update handlePost to use new endpoint
  const handlePost = async () => {
    if (!title || !content) {
      Alert.alert("Error", "Title and content are required");
      return;
    }

    if (!user_id) {
      Alert.alert("Error", "User ID is required");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8000/api/create_blog_post/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user_id,
            title: title,
            content: content,
            is_anonymous: false,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create post");
      }

      setTitle("");
      setContent("");
      fetchPosts(); // Refresh posts after creating new one

      Alert.alert("Success", "Post created successfully");
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", error.message);
    }
  };

  // Update handlePostLike to use new endpoint
  const handlePostLike = async (postId) => {
    if (!user_id) {
      Alert.alert("Error", "You must be logged in to like posts");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/toggle_like/${postId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user_id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to toggle like");
      }

      // Update posts state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                like_count: post.like_count + (data.liked ? 1 : -1),
                isLiked: data.liked,
              }
            : post
        )
      );

      setLikedPosts((prev) => ({
        ...prev,
        [postId]: data.liked,
      }));
    } catch (error) {
      console.error("Error liking post:", error);
      Alert.alert("Error", error.message);
    }
  };
  const fetchComments = useCallback(async (postId) => {
    try {
      console.log("Fetching comments for post:", postId);

      const response = await fetch(
        `http://localhost:8000/api/get_post_comments/${postId}/`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch comments");
      }

      const data = await response.json();
      console.log("Fetched comments:", data);

      setComments((prev) => ({
        ...prev,
        [postId]: data.comments,
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      Alert.alert("Error", "Failed to fetch comments");
    }
  }, []);

  const handleCommentTextChange = (postId, text) => {
    setCommentText((prev) => ({
      ...prev,
      [postId]: text,
    }));
  };

  const handleSubmitComment = async (postId) => {
    if (!commentText[postId]?.trim()) {
      Alert.alert("Error", "Comment cannot be empty");
      return;
    }

    if (!user_id) {
      Alert.alert("Error", "You must be logged in to comment");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/add_comment/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          post_id: postId,
          user_id: user_id,
          content: commentText[postId],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit comment");
      }

      // Clear the comment input
      setCommentText((prev) => ({
        ...prev,
        [postId]: "",
      }));

      // Fetch fresh comments only after successful submission
      await fetchComments(postId);
      Alert.alert("Success", "Comment added successfully");
    } catch (error) {
      console.error("Error submitting comment:", error);
      Alert.alert("Error", error.message);
    }
  };

  const handleNewPost = (newPost) => {
    if (newPost.title && newPost.content) {
      setPosts((prevPosts) => [newPost, ...prevPosts]); // Add only valid posts
    }
  };

  const handleProfilePress = () => {
    // Navigate to profile page
    router.push("/profile");
  };

  const handleCommentLike = async (commentId) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/toggle_comment_like/${commentId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user_id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      // Update comments state with new like count
      setComments((prevComments) => {
        const newComments = { ...prevComments };
        Object.keys(newComments).forEach((postId) => {
          newComments[postId] = newComments[postId].map((comment) =>
            comment._id === commentId
              ? { ...comment, like_count: data.like_count }
              : comment
          );
        });
        return newComments;
      });

      // Update liked status
      setLikedComments((prev) => ({
        ...prev,
        [commentId]: data.liked,
      }));
    } catch (error) {
      console.error("Error liking comment:", error);
      Alert.alert("Error", error.message);
    }
  };

  const handleShare = (postId) => {
    // Handle share action
    console.log(`Shared post ${postId}`);
    // Here you would typically use a sharing functionality from React Native or a third-party library
  };

  return (
    <View style={styles.container}>
      <Header onProfilePress={handleProfilePress} />
      <PostSection
        title={title}
        content={content}
        setTitle={setTitle}
        setContent={setContent}
        onPost={handlePost}
      />
      <LatestPostsSection
        posts={posts}
        comments={comments}
        commentText={commentText}
        onCommentTextChange={handleCommentTextChange}
        onSubmitComment={handleSubmitComment}
        onShare={handleShare}
        likedPosts={likedPosts}
        likedComments={likedComments}
        onPostLike={handlePostLike}
        onCommentLike={handleCommentLike}
        fetchComments={fetchComments}
      />
    </View>
  );
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logoAndTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c1a4a",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postSection: {
    marginBottom: 20,
  },
  postInput: {
    borderWidth: 1,
    borderColor: "#5100F3",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    height: 100,
  },
  postButton: {
    backgroundColor: "#5100F3",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: "flex-end",
  },
  postButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  latestPostsSection: {
    flex: 1,
  },
  latestPostsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5100F3",
    marginBottom: 10,
  },
  post: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  postImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c1a4a",
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5100F3",
    marginBottom: 5,
  },
  postContent: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionText: {
    color: "#5100F3",
    fontSize: 16,
    fontWeight: "bold",
  },
  commentsSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  comment: {
    backgroundColor: "#f8f8f8",
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  commentAuthor: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 14,
  },
  commentInputContainer: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  commentButton: {
    backgroundColor: "#5100F3",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  commentButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2c1a4a",
  },
  comment: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  commentUserImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUserName: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#2c1a4a",
  },
  commentTime: {
    fontSize: 12,
    color: "#666",
  },
  commentContent: {
    fontSize: 14,
    color: "#333",
  },
  noComments: {
    fontStyle: "italic",
    color: "#666",
    textAlign: "center",
    padding: 10,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  commentButton: {
    backgroundColor: "#5100F3",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  commentButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  likeButtonActive: {
    backgroundColor: "#ffebee",
  },
  likeIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  likeCount: {
    fontSize: 14,
    color: "#666",
  },
});

export default Blog;
