'use client';

import { useState, useEffect } from 'react';
import { 
  FiBook, 
  FiUsers, 
  FiCalendar, 
  FiClock, 
  FiMapPin, 
  FiPlus, 
  FiEdit, 
  FiEye,
  FiCheckCircle,
  FiActivity
} from 'react-icons/fi';

interface ClassInfo {
  id: number;
  subject: string;
  code: string;
  course: string;
  semester: string;
  students: number;
  schedule: {
    day: string;
    time: string;
    room: string;
    duration: string;
  }[];
  syllabus: {
    completed: number;
    total: number;
    topics: string[];
  };
  attendance: {
    average: number;
    lastClass: number;
  };
  assignments: {
    pending: number;
    graded: number;
  };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchClasses = async () => {
      try {
        const mockClasses: ClassInfo[] = [
          {
            id: 1,
            subject: 'Data Structures & Algorithms',
            code: 'CS301',
            course: 'Computer Science Engineering',
            semester: '6th Semester',
            students: 45,
            schedule: [
              { day: 'Monday', time: '09:00 AM - 10:30 AM', room: 'Room 301', duration: '90 min' },
              { day: 'Wednesday', time: '11:00 AM - 12:30 PM', room: 'Lab 2', duration: '90 min' },
              { day: 'Friday', time: '02:00 PM - 03:30 PM', room: 'Room 301', duration: '90 min' }
            ],
            syllabus: {
              completed: 12,
              total: 20,
              topics: ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs']
            },
            attendance: {
              average: 87.5,
              lastClass: 42
            },
            assignments: {
              pending: 3,
              graded: 5
            }
          },
          {
            id: 2,
            subject: 'Web Development',
            code: 'CS302',
            course: 'Computer Science Engineering',
            semester: '6th Semester',
            students: 40,
            schedule: [
              { day: 'Tuesday', time: '10:00 AM - 11:30 AM', room: 'Lab 3', duration: '90 min' },
              { day: 'Thursday', time: '02:00 PM - 03:30 PM', room: 'Lab 3', duration: '90 min' }
            ],
            syllabus: {
              completed: 8,
              total: 15,
              topics: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Databases']
            },
            attendance: {
              average: 92.3,
              lastClass: 38
            },
            assignments: {
              pending: 2,
              graded: 3
            }
          },
          {
            id: 3,
            subject: 'Database Systems',
            code: 'CS303',
            course: 'Computer Science Engineering',
            semester: '6th Semester',
            students: 48,
            schedule: [
              { day: 'Monday', time: '02:00 PM - 03:30 PM', room: 'Room 205', duration: '90 min' },
              { day: 'Wednesday', time: '09:00 AM - 10:30 AM', room: 'Lab 1', duration: '90 min' }
            ],
            syllabus: {
              completed: 10,
              total: 18,
              topics: ['SQL', 'Normalization', 'Indexing', 'Transactions', 'NoSQL']
            },
            attendance: {
              average: 85.2,
              lastClass: 41
            },
            assignments: {
              pending: 1,
              graded: 4
            }
          }
        ];

        setClasses(mockClasses);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Classes</h1>
            <p className="text-gray-600">Manage your courses, schedules, and student progress</p>
          </div>
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
            <FiPlus className="mr-2" />
            Add Class
          </button>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classInfo) => (
            <div key={classInfo.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Class Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{classInfo.subject}</h3>
                    <p className="text-sm text-gray-600">{classInfo.code}</p>
                    <p className="text-xs text-gray-500">{classInfo.course}</p>
                    <p className="text-xs text-gray-500">{classInfo.semester}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <FiEye className="h-4 w-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <FiEdit className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Students Count */}
                <div className="flex items-center mb-4">
                  <FiUsers className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-700">{classInfo.students} students enrolled</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Attendance</p>
                    <p className="text-lg font-bold text-green-900">{classInfo.attendance.average}%</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Syllabus</p>
                    <p className="text-lg font-bold text-blue-900">
                      {classInfo.syllabus.completed}/{classInfo.syllabus.total}
                    </p>
                  </div>
                </div>

                {/* Schedule */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FiCalendar className="mr-1" />
                    Schedule
                  </h4>
                  <div className="space-y-2">
                    {classInfo.schedule.slice(0, 2).map((schedule, index) => (
                      <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">{schedule.day}</span>
                          <span>{schedule.time}</span>
                        </div>
                        <div className="flex items-center text-gray-500 mt-1">
                          <FiMapPin className="h-3 w-3 mr-1" />
                          {schedule.room}
                        </div>
                      </div>
                    ))}
                    {classInfo.schedule.length > 2 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{classInfo.schedule.length - 2} more sessions
                      </p>
                    )}
                  </div>
                </div>

                {/* Assignments */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Assignments</h4>
                  <div className="flex justify-between text-xs">
                    <span className="text-orange-600">
                      {classInfo.assignments.pending} pending review
                    </span>
                    <span className="text-green-600">
                      {classInfo.assignments.graded} graded
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded flex items-center justify-center">
                    <FiCheckCircle className="mr-1 h-3 w-3" />
                    Take Attendance
                  </button>
                  <button className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-2 px-3 rounded flex items-center justify-center">
                    <FiActivity className="mr-1 h-3 w-3" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiBook className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            <p className="text-sm text-gray-600">Total Classes</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiUsers className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {classes.reduce((sum, cls) => sum + cls.students, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Students</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiCheckCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {classes.reduce((sum, cls) => sum + cls.assignments.pending, 0)}
            </p>
            <p className="text-sm text-gray-600">Pending Reviews</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiActivity className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(classes.reduce((sum, cls) => sum + cls.attendance.average, 0) / classes.length)}%
            </p>
            <p className="text-sm text-gray-600">Avg Attendance</p>
          </div>
        </div>
      </div>
    </div>
  );
}
