const api_call = require('./api_call');
const db_call = require('./db_call');

// DB 연결 초기화
db_call.init().catch(err => console.log('DB 연결 오류 : ', err));

const serviceKey = 'nzOAw3IIvBYc44x%2FLAe1dvPuY4XMTsk%2F03LisDcVgY3E5va7eurpN%2FVsmsnRTr6gCI7fmIPlQbTAcIxrXZvz9Q%3D%3D';

const apiUrl = 'http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getHoliDeInfo?ServiceKey=' + serviceKey;

// API URL 조회
function getApiUrl(searchYear, searchMonth) {
    return apiUrl + '&solYear=' + searchYear + '&solMonth=' + searchMonth;
}

// 휴일정보 API 조회
function getHolidayList(url) {
    return new Promise((resolve, reject) => {
        api_call(url)
            .then(data => {

                // 데이터 파싱
                const jsonString = JSON.stringify(data);
                const jsonObject = JSON.parse(jsonString);
                const itemList = jsonObject.response.body.items.item;

                if (itemList) {
                    const items = Array.isArray(itemList) ? itemList : [itemList];

                    let holidayData = [];

                    items.forEach(item => {
                        let map = {
                            locdata: item.locdate,
                            isHoliday: item.isHoliday,
                            dateName: item.dateName
                        };

                        holidayData.push(map);
                    });

                    resolve(holidayData);
                } else {

                    resolve([]);
                }
            })
            .catch(err => {
                reject(err);
            });
    });
}

async function insertDB(holidayList) {
    let connection;

    try {
        connection = await db_call.getConnection();
        if (holidayList && holidayList.length > 0) {
            holidayList.forEach(async data => {
                if (data.isHoliday === 'Y') {
                    let id = String(data.locdata);
                    let year = id.substring(0, 4);
                    let month = id.substring(4, 6);
                    let day = id.substring(6, 8);
                    let name = String(data.dateName);

                    const result = await connection.execute(
                        `MERGE INTO PO_HOLIDAYS dest
                         USING (SELECT :val1 AS HOLIDAY_ID,
                                       :val2 AS HOLIDAY_YEAR,
                                       :val3 AS HOLIDAY_MONTH,
                                       :val4 AS HOLIDAY_DAY,
                                       :val5 AS HOLIDAY_NAME
                                FROM dual) src
                         ON (dest.HOLIDAY_ID = src.HOLIDAY_ID)
                         WHEN MATCHED THEN
                             UPDATE SET dest.HOLIDAY_YEAR = src.HOLIDAY_YEAR,
                                        dest.HOLIDAY_MONTH = src.HOLIDAY_MONTH,
                                        dest.HOLIDAY_DAY = src.HOLIDAY_DAY,
                                        dest.HOLIDAY_NAME = src.HOLIDAY_NAME,
                                        dest.UPDDT = sysdate
                         WHEN NOT MATCHED THEN
                             INSERT (dest.HOLIDAY_ID, dest.HOLIDAY_YEAR, dest.HOLIDAY_MONTH, dest.HOLIDAY_DAY, dest.HOLIDAY_NAME)
                             VALUES (src.HOLIDAY_ID, src.HOLIDAY_YEAR, src.HOLIDAY_MONTH, src.HOLIDAY_DAY, src.HOLIDAY_NAME)`,
                        {
                            val1: id,
                            val2: year,
                            val3: month,
                            val4: day,
                            val5: name
                        },
                        { autoCommit: true }
                    );
                    console.log("Inserted:", result.rowsAffected);
                }
            });
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

// main()
async function run() {
    var yearList = [
        '2024', '2025', '2026', '2027', '2028',
        '2029', '2030', '2031', '2032', '2033',
        '2034', '2035', '2036', '2037', '2038',
        '2039', '2040', '2041', '2042', '2043',
        '2044', '2045', '2046', '2047', '2048',
        '2049', '2050'
    ];

    var monthList = [
        '01', '02', '03', '04', '05', '06',
        '07', '08', '09', '10', '11', '12'
    ];

    var holidayList = [];

    for (const yearData of yearList) {
        for (const monthData of monthList) {
            const url = getApiUrl(yearData, monthData);
            try {
                const list = await getHolidayList(url);

                // 빈값체크
                if (!list || list.length === 0) {
                    console.log('[' + yearData + '/' + monthData + '] : 공휴일 없음.')
                } else {
                    list.forEach(item => {
                        holidayList.push(item);
                        console.log('[' + yearData + '/' + monthData + '] : ' + JSON.stringify(item));
                    });
                }

            } catch (err) {
                console.error('실행 오류 : ', err);
            }
        }
    }

    insertDB(holidayList);
}

run();
