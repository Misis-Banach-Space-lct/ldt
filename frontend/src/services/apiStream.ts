import { STREAM_URL } from '../config'
import axios from "axios";

type Channel = {
    url: string;
    on_demand: boolean;
    debug: boolean;
};


interface CreateStreamData {
    name: string;
    channels: {
        [key: string]: Channel;
    };
}

const ApiStream = {

    async createStream(data: CreateStreamData) {
        function generateUUID(): string {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0,
                    v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        const uuid = generateUUID()

        return await axios.post(`${STREAM_URL}/stream/${uuid}/add`, data);
    },
    async getAllStreams() {
        return await axios.get(`${STREAM_URL}/streams`);
    },
    async getStreamInfo(stream_id: string) {
        return await axios.get(`${STREAM_URL}/stream/${stream_id}/info`);
    },
};
export default ApiStream;