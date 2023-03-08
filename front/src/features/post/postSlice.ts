import { createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import { RootState} from '../../app/store';
import axios from 'axios';
import { PROPS_NEWPOST,PROPS_LIKED,PROPS_COMMENT } from '../types';

const apiUrlPost= `${process.env.REACT_APP_DEV_API_URL}api/post/`
const apiUrlComment=`${process.env.REACT_APP_DEV_API_URL}api/comment/`

//投稿の一覧を取得する
export const fetchAsyncGetPosts = createAsyncThunk("post/get", async () => {
    const res = await axios.get(apiUrlPost, {
      headers: {
        Authorization: `JWT ${localStorage.localJWT}`,
      },
    });
    return res.data;
  });

//新規で投稿を作成する  
export const fetchAsyncNewPost = createAsyncThunk(
    "post/post",
    async (newPost: PROPS_NEWPOST) => {
      const uploadData = new FormData();
      uploadData.append("title", newPost.title);
      newPost.img && uploadData.append("img", newPost.img, newPost.img.name);
      const res = await axios.post(apiUrlPost, uploadData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${localStorage.localJWT}`,
        },
      });
      return res.data;
    }
  );

//postの中のlikedの属性を更新する
export const fetchAsyncPatchLiked = createAsyncThunk(
    "post/patch",
    async (liked: PROPS_LIKED) => {
      const currentLiked = liked.current;
      const uploadData = new FormData();
  
      let isOverlapped = false;
      currentLiked.forEach((current) => {//含まれている場合
        if (current === liked.new) {
          isOverlapped = true;
        } else {//含まれていない場合
          uploadData.append("liked", String(current));
        }
      });
  
      if (!isOverlapped) {//新しくlikeする
        uploadData.append("liked", String(liked.new));
      } else if (currentLiked.length === 1) {//既にlikeしていて自分しかlikeしていない
        uploadData.append("title", liked.title);
        const res = await axios.put(`${apiUrlPost}${liked.id}/`, uploadData, {//空の配列に初期化する。
          headers: {
            "Content-Type": "application/json",
            Authorization: `JWT ${localStorage.localJWT}`,
            },
            });
            return res.data;
      }
      const res = await axios.patch(`${apiUrlPost}${liked.id}/`, uploadData, {//自分がlikeしていた。他にもlikeがいる
        headers: {
          "Content-Type": "application/json",
          Authorization: `JWT ${localStorage.localJWT}`,
        },
      });
            return res.data;
    }
  );
  
//コメントの一覧を取得する
export const fetchAsyncGetComments = createAsyncThunk(
    "comment/get",
    async () => {
      const res = await axios.get(apiUrlComment, {
        headers: {
          Authorization: `JWT ${localStorage.localJWT}`,
        },
      });
      return res.data;
    }
  );
  
//コメントを新規で投稿する
export const fetchAsyncPostComment = createAsyncThunk(
    "comment/post",
    async (comment: PROPS_COMMENT) => {
      const res = await axios.post(apiUrlComment, comment, {
        headers: {
          Authorization: `JWT ${localStorage.localJWT}`,
        },
      });
      return res.data;
    }
  );


export const postSlice = createSlice({
    name: "post",
    initialState: {
      isLoadingPost: false,
      openNewPost: false,
      posts: [
        {
          id: 0,
          title: "",
          userPost: 0,
          created_on: "",
          img: "",
          liked: [0],
        },
      ],
      comments: [
        {
          id: 0,
          text: "",
          userComment: 0,
          post: 0,
        },
      ],
    },
    reducers: {
      fetchPostStart(state) {
        state.isLoadingPost = true;
      },
      fetchPostEnd(state) {
        state.isLoadingPost = false;
      },
      setOpenNewPost(state) {
        state.openNewPost = true;
      },
      resetOpenNewPost(state) {
        state.openNewPost = false;
      },
    },
    extraReducers: (builder) => {
        //投稿の一覧を取得する非同期関数が正常終了した場合
        builder.addCase(fetchAsyncGetPosts.fulfilled, (state, action) => {
          return {
            ...state,
            posts: action.payload,
          };
        });
        //新規で投稿する非同期関数が正常終了した場合
        builder.addCase(fetchAsyncNewPost.fulfilled, (state, action) => {
          return {
            ...state,
            posts: [...state.posts, action.payload],
          };
        });
        //コメントの一覧を取得する非同期関数が正常終了した場合
        builder.addCase(fetchAsyncGetComments.fulfilled, (state, action) => {
          return {
            ...state,
            comments: action.payload,
          };
        });
        //新規でコメントを投稿する非同期関数が正常終了した場合
        builder.addCase(fetchAsyncPostComment.fulfilled, (state, action) => {
          return {
            ...state,
            comments: [...state.comments, action.payload],
          };
        });
        //likeをする非同期関数が正常終了した場合
        builder.addCase(fetchAsyncPatchLiked.fulfilled, (state, action) => {
          return {
            ...state,
            posts: state.posts.map((post) =>
              post.id === action.payload.id ? action.payload : post
            ),
          };
        });
      },
});

export const {  fetchPostStart,fetchPostEnd,setOpenNewPost,resetOpenNewPost, } = postSlice.actions;



export const selectIsLoadingPost = (state: RootState) => state.post.isLoadingPost;

export const selectOpenNewPost = (state: RootState) => state.post.openNewPost;
export const selectPosts = (state: RootState) => state.post.posts;
export const selectComments = (state: RootState) => state.post.comments;

export default postSlice.reducer;
