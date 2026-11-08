// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title Anonymous ReSys
/// @notice Manages teacher permissions, courses, student enrollment and reviews.
contract DecentralizedEduEvaluation {
    address public immutable schoolAdmin;

    // Keep field order compatible with the shared design in README.md.
    struct Course {
        string courseName;
        address teacher;
        bool exists;
        uint256 totalScore;
        uint256 reviewCount;
    }

    mapping(uint256 => Course) public courses;
    uint256 public courseCount;
    mapping(address => bool) public approvedTeachers;
    bool public evaluationOpen;

    // Student enrollment and one-review-per-course state.
    mapping(uint256 => mapping(address => bool)) public enrolledStudents;
    mapping(uint256 => mapping(address => bool)) public hasEvaluated;

    // UTF-8 byte limit, not a character count. Supports Vietnamese course names.
    uint256 public constant MAX_COURSE_NAME_BYTES = 480;

    error UnauthorizedAdmin(address caller);
    error TeacherNotApproved(address caller);
    error InvalidTeacherAddress();
    error TeacherAlreadyApproved(address teacher);
    error InvalidCourseName();
    error CourseNotFound(uint256 courseId);
    error StudentAlreadyEnrolled(uint256 courseId, address student);
    error StudentNotEnrolled(uint256 courseId, address student);
    error ReviewAlreadySubmitted(uint256 courseId, address student);
    error EvaluationClosed();
    error InvalidScore(uint256 score);

    event TeacherApproved(address indexed teacher);
    event EvaluationStatusChanged(bool evaluationOpen);
    event CourseCreated(uint256 indexed courseId, string courseName, address indexed teacher);
    event StudentJoined(uint256 indexed courseId, address indexed student);
    event ReviewSubmitted(uint256 indexed courseId, uint256 score);

    constructor() {
        schoolAdmin = msg.sender;
    }

    modifier onlyAdmin() {
        if (msg.sender != schoolAdmin) revert UnauthorizedAdmin(msg.sender);
        _;
    }

    modifier onlyApprovedTeacher() {
        if (!approvedTeachers[msg.sender]) revert TeacherNotApproved(msg.sender);
        _;
    }

    /// @notice Grant course creation permission after off-chain identity verification.
    function approveTeacher(address _teacher) external onlyAdmin {
        if (_teacher == address(0)) revert InvalidTeacherAddress();
        if (approvedTeachers[_teacher]) revert TeacherAlreadyApproved(_teacher);
        approvedTeachers[_teacher] = true;
        emit TeacherApproved(_teacher);
    }

    /// @notice Open or close the shared evaluation gate. Initially closed.
    function toggleEvaluation() external onlyAdmin {
        evaluationOpen = !evaluationOpen;
        emit EvaluationStatusChanged(evaluationOpen);
    }

    /// @notice Create a course owned by the caller, with zero-based IDs.
    /// @dev Reject empty, ASCII-whitespace-only and oversized names.
    /// Names are stored as supplied; trimming and character limits belong to the UI.
    function createCourse(string calldata _courseName) external onlyApprovedTeacher {
        bytes memory name = bytes(_courseName);
        if (name.length == 0 || name.length > MAX_COURSE_NAME_BYTES) revert InvalidCourseName();

        bool hasContent;
        for (uint256 i; i < name.length; ++i) {
            // Treat ASCII control characters and spaces as blank.
            if (uint8(name[i]) > 32) {
                hasContent = true;
                break;
            }
        }
        if (!hasContent) revert InvalidCourseName();

        uint256 courseId = courseCount;
        courses[courseId] = Course({
            courseName: _courseName,
            teacher: msg.sender,
            exists: true,
            totalScore: 0,
            reviewCount: 0
        });
        courseCount = courseId + 1;
        emit CourseCreated(courseId, _courseName, msg.sender);
    }

    /// @notice Join an existing course before submitting a review.
    function joinCourse(uint256 _courseId) external {
        Course storage course = courses[_courseId];
        if (!course.exists) revert CourseNotFound(_courseId);
        if (enrolledStudents[_courseId][msg.sender]) {
            revert StudentAlreadyEnrolled(_courseId, msg.sender);
        }

        enrolledStudents[_courseId][msg.sender] = true;
        emit StudentJoined(_courseId, msg.sender);
    }

    /// @notice Submit one score from 1 to 5 for a joined course.
    function submitReview(uint256 _courseId, uint256 _score) external {
        if (!evaluationOpen) revert EvaluationClosed();

        Course storage course = courses[_courseId];
        if (!course.exists) revert CourseNotFound(_courseId);
        if (!enrolledStudents[_courseId][msg.sender]) {
            revert StudentNotEnrolled(_courseId, msg.sender);
        }
        if (hasEvaluated[_courseId][msg.sender]) {
            revert ReviewAlreadySubmitted(_courseId, msg.sender);
        }
        if (_score < 1 || _score > 5) revert InvalidScore(_score);

        hasEvaluated[_courseId][msg.sender] = true;
        course.totalScore += _score;
        course.reviewCount += 1;

        emit ReviewSubmitted(_courseId, _score);
    }

    /// @notice Return the average score multiplied by 10 (for example, 4.5 is 45).
    function getAverageScore(uint256 _courseId) external view returns (uint256) {
        Course storage course = courses[_courseId];
        if (!course.exists) revert CourseNotFound(_courseId);
        if (course.reviewCount == 0) return 0;
        return (course.totalScore * 10) / course.reviewCount;
    }
}
