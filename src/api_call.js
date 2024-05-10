const axios = require('axios'); // axios 라이브러리 불러오기

async function callGetApi(apiUrl) {
    try {
        // GET 방식 요청
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        throw new Error('API 호출 오류 : ${error.message}');
    }

}

module.exports = callGetApi;