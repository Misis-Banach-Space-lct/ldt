import axios from "axios";
import storage from "../utils/storage";
import { BASE_URL } from '../config';


interface GetAllVideosData {
    limit: number;
    offset: number;
}

interface GetAllVideosDataFilter {
    limit: number;
    offset: number;
    groupId: number;
}

interface CreateVideoData {
    file: File;
    title: string;
    groupId: number;
}

interface updateVideoGroupdata {
    action: string;
    videoId: number;
    groupId: number;
}

interface getVideoFrames {
    videoId: string;
    type: string;
}

const ApiVideo = {

    async getAllVideos(data: GetAllVideosData) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }
        return await axios.get(`${BASE_URL}/api/v1/videos?offset=${data.offset}&limit=${data.limit}`, config);
    },
    async getAllVideosFilter(data: GetAllVideosDataFilter) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }
        return await axios.get(`${BASE_URL}/api/v1/videos?filter=${data.groupId}&offset=${data.offset}&limit=${data.limit}`, config);
    },
    async getVideoData(videoId: string) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }
        return await axios.get(`${BASE_URL}/api/v1/videos/${videoId}`, config);
    },
    async getVideoFrames(data: getVideoFrames) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }
        return await axios.get(`${BASE_URL}/api/v1/videos/${data.videoId}/frames/?type=${data.type}`, config);
    },
    async getVideoFile(source: string) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }
        return await axios.get(`${BASE_URL}/${source}`, config);
    },
    async createOneVideo(data: CreateVideoData) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }
    
        const formData = new FormData();
        formData.append('video', data.file); 
        formData.append('title', data.title); 
        formData.append('groupId', data.groupId.toString());
    
        return await axios.post(`${BASE_URL}/api/v1/videos`, formData, config);
    },
    async createVideosAll(data: CreateVideoData) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }
    
        const formData = new FormData();
        formData.append('archive', data.file); 
        formData.append('title', data.title); 
        formData.append('groupId', data.groupId.toString());
        console.log(formData)
    
        return await axios.post(`${BASE_URL}/api/v1/videos/many`, formData, config);
    },
    async updateVideoGroup(data: updateVideoGroupdata) {
        let config = {
            headers: {
                Authorization: `Bearer ${storage.getToken()}`
            }
        }

        return await axios.post(`${BASE_URL}/api/v1/videos/updateGroup`, data,config);
    }
};
export default ApiVideo;