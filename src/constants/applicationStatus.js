const APPLICATION_STATUS = {
    APPLIED: "Applied",
    UNDER_REVIEW: "Under Review",
    SHORTLISTED: "Shortlisted",
    INTERVIEW_SCHEDULED: "Interview Scheduled",
    INTERVIEW_COMPLETED: "Interview Completed",
    OFFERED: "Offered",
    HIRED: "Hired",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
};

const APPLICATION_STATUS_LIST = Object.values(APPLICATION_STATUS);

module.exports = {
    APPLICATION_STATUS,
    APPLICATION_STATUS_LIST,
};