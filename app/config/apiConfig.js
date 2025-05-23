import { Platform } from 'react-native';

let API_BASE_URL;
if (Platform.OS === 'android') {
    API_BASE_URL = "http://10.0.2.2:8000"; // Android emulator
} else {
    API_BASE_URL = "http://localhost:8000"; // Web, iOS simulator, desktop
}

export const API_URLS = {
    // Auth endpoints
    LOGIN: `${API_BASE_URL}/api/login/`,
    REGISTER: `${API_BASE_URL}/api/register/`,

    // User endpoints
    USER_PROFILE: `${API_BASE_URL}/api/get_user/`,
    UPDATE_PROFILE_IMAGE: (userId) => `${API_BASE_URL}/api/upload_profile_image/${userId}/`,

    // Blog endpoints
    BLOG_POSTS: `${API_BASE_URL}/api/get_blog_posts/`,
    CREATE_POST: `${API_BASE_URL}/api/create_blog_post/`,
    USER_LIKES: `${API_BASE_URL}/api/get_user_likes/`,
    TOGGLE_LIKE: `${API_BASE_URL}/api/toggle_like/`,
    POST_COMMENTS: `${API_BASE_URL}/api/get_post_comments/`,
    ADD_COMMENT: `${API_BASE_URL}/api/add_comment/`,
    TOGGLE_COMMENT_LIKE: `${API_BASE_URL}/api/toggle_comment_like/`,
    ADD_USER: `${API_BASE_URL}/api/add_user/`,
};

export default API_URLS; 