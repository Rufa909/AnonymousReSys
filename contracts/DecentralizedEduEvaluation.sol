// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title Anonymous ReSys - Phase 2, member 1
/// @notice Implements school administration and teacher course creation only.
/// @dev Student enrollment and review functions belong to member 2.
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

    // Shared storage for member 2 to implement joinCourse / submitReview.
    mapping(uint256 => mapping(address => bool)) public enrolledStudents;
    mapping(uint256 => mapping(address => bool)) public hasEvaluated;

    // UTF-8 byte limit, not a character count. Supports Vietnamese course names.
    uint256 public constant MAX_COURSE_NAME_BYTES = 480;

    error UnauthorizedAdmin(address caller);
    error TeacherNotApproved(address caller);
    error InvalidTeacherAddress();
    error TeacherAlreadyApproved(address teacher);
    error InvalidCourseName();

    event TeacherApproved(address indexed teacher);
    event EvaluationStatusChanged(bool evaluationOpen);
    event CourseCreated(uint256 indexed courseId, string courseName, address indexed teacher);

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
}
