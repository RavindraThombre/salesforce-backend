const axios = require("axios");

const getAccessToken = async () => {
    const res = await axios.post(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
        {},
        {
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(
                        `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
                    ).toString("base64"),
            },
        }
    );

    return res.data.access_token;
};

// ✅ CREATE MEETING
exports.createZoomMeeting = async ({ topic, date, time }) => {
    const token = await getAccessToken();

    const startTime = new Date(`${date}T${time}:00`);

    const res = await axios.post(
        "https://api.zoom.us/v2/users/me/meetings",
        {
            topic,
            type: 2,
            start_time: startTime.toISOString(),
            duration: 60,
            timezone: "Asia/Kolkata",
            settings: {
                join_before_host: true,
            },
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return res.data.join_url;
};