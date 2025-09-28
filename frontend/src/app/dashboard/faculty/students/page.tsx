'use client';

import { useState, useEffect } from 'react';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiTrendingUp, 
  FiTrendingDown,
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiEdit,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle
} from 'react-icons/fi';

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  course: string;
  semester: string;
  batch: string;
  subjects: {
    name: string;
    code: string;
    marks: number;
    attendance: number;
    assignments: {
      submitted: number;
      total: number;
    };
  }[];
  overallPerformance: {
    cgpa: number;
    attendance: number;
    grade: string;
    status: 'excellent' | 'good' | 'average' | 'poor';
  };
  recentActivity: {
    lastSeen: string;
    lastSubmission: string;
  };
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [performanceFilter, setPerformanceFilter] = useState('all');

  useEffect(() => {
    // Simulate API call
    const fetchStudents = async () => {
      try {
        const mockStudents: Student[] = [
          {
            id: 1,
            name: 'Rahul Sharma',
            rollNumber: 'CS21B1001',
            email: 'rahul.sharma@university.edu',
            phone: '+91 9876543210',
            course: 'Computer Science Engineering',
            semester: '6th Semester',
            batch: '2021-2025',
            subjects: [
              {
                name: 'Data Structures & Algorithms',
                code: 'CS301',
                marks: 85,
                attendance: 92,
                assignments: { submitted: 8, total: 8 }
              },
              {
                name: 'Web Development',
                code: 'CS302',
                marks: 78,
                attendance: 88,
                assignments: { submitted: 7, total: 8 }
              },
              {
                name: 'Database Systems',
                code: 'CS303',
                marks: 92,
                attendance: 95,
                assignments: { submitted: 8, total: 8 }
              }
            ],
            overallPerformance: {
              cgpa: 8.5,
              attendance: 91.7,
              grade: 'A',
              status: 'excellent'
            },
            recentActivity: {
              lastSeen: '2 hours ago',
              lastSubmission: 'Yesterday'
            }
          },
          {
            id: 2,
            name: 'Priya Patel',
            rollNumber: 'CS21B1002',
            email: 'priya.patel@university.edu',
            phone: '+91 9876543211',
            course: 'Computer Science Engineering',
            semester: '6th Semester',
            batch: '2021-2025',
            subjects: [
              {
                name: 'Data Structures & Algorithms',
                code: 'CS301',
                marks: 72,
                attendance: 85,
                assignments: { submitted: 7, total: 8 }
              },
              {
                name: 'Web Development',
                code: 'CS302',
                marks: 80,
                attendance: 82,
                assignments: { submitted: 8, total: 8 }
              },
              {
                name: 'Database Systems',
                code: 'CS303',
                marks: 75,
                attendance: 88,
                assignments: { submitted: 7, total: 8 }
              }
            ],
            overallPerformance: {
              cgpa: 7.6,
              attendance: 85.0,
              grade: 'B+',
              status: 'good'
            },
            recentActivity: {
              lastSeen: '5 hours ago',
              lastSubmission: '2 days ago'
            }
          },
          {
            id: 3,
            name: 'Amit Kumar',
            rollNumber: 'CS21B1003',
            email: 'amit.kumar@university.edu',
            phone: '+91 9876543212',
            course: 'Computer Science Engineering',
            semester: '6th Semester',
            batch: '2021-2025',
            subjects: [
              {
                name: 'Data Structures & Algorithms',
                code: 'CS301',
                marks: 58,
                attendance: 65,
                assignments: { submitted: 5, total: 8 }
              },
              {
                name: 'Web Development',
                code: 'CS302',
                marks: 62,
                attendance: 70,
                assignments: { submitted: 6, total: 8 }
              },
              {
                name: 'Database Systems',
                code: 'CS303',
                marks: 55,
                attendance: 68,
                assignments: { submitted: 5, total: 8 }
              }
            ],
            overallPerformance: {
              cgpa: 5.8,
              attendance: 67.7,
              grade: 'C',
              status: 'poor'
            },
            recentActivity: {
              lastSeen: '1 day ago',
              lastSubmission: '1 week ago'
            }
          }
        ];

        setStudents(mockStudents);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching students:', error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'average': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <FiCheckCircle className="text-green-500" />;
      case 'good': return <FiTrendingUp className="text-blue-500" />;
      case 'average': return <FiAlertTriangle className="text-yellow-500" />;
      case 'poor': return <FiTrendingDown className="text-red-500" />;
      default: return <FiXCircle className="text-gray-500" />;
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPerformance = performanceFilter === 'all' || student.overallPerformance.status === performanceFilter;
    return matchesSearch && matchesPerformance;
  });

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Management</h1>
          <p className="text-gray-600">Monitor student performance, attendance, and progress</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="all">All Subjects</option>
              <option value="CS301">Data Structures & Algorithms</option>
              <option value="CS302">Web Development</option>
              <option value="CS303">Database Systems</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value)}
            >
              <option value="all">All Performance Levels</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Student Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiUser className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.rollNumber}</p>
                      <p className="text-xs text-gray-500">{student.course} - {student.semester}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${getStatusColor(student.overallPerformance.status)}`}>
                      {getStatusIcon(student.overallPerformance.status)}
                      <span className="ml-1">{student.overallPerformance.grade}</span>
                    </span>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="View Details">
                      <FiEye className="h-4 w-4 text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg" title="Edit Student">
                      <FiEdit className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <FiMail className="mr-2" />
                    {student.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FiPhone className="mr-2" />
                    {student.phone}
                  </div>
                </div>

                {/* Performance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">CGPA</p>
                    <p className="text-xl font-bold text-blue-900">{student.overallPerformance.cgpa}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">Attendance</p>
                    <p className="text-xl font-bold text-green-900">{student.overallPerformance.attendance}%</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Assignments</p>
                    <p className="text-xl font-bold text-yellow-900">
                      {student.subjects.reduce((sum, subject) => sum + subject.assignments.submitted, 0)}/
                      {student.subjects.reduce((sum, subject) => sum + subject.assignments.total, 0)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">Avg Marks</p>
                    <p className="text-xl font-bold text-purple-900">
                      {Math.round(student.subjects.reduce((sum, subject) => sum + subject.marks, 0) / student.subjects.length)}%
                    </p>
                  </div>
                </div>

                {/* Subject Performance */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Subject Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {student.subjects.map((subject, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-sm text-gray-900">{subject.name}</h5>
                          <span className="text-xs text-gray-500">{subject.code}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Marks:</span>
                            <span className={`font-medium ${subject.marks >= 75 ? 'text-green-600' : subject.marks >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {subject.marks}%
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Attendance:</span>
                            <span className={`font-medium ${subject.attendance >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                              {subject.attendance}%
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Assignments:</span>
                            <span className="font-medium text-blue-600">
                              {subject.assignments.submitted}/{subject.assignments.total}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-4">
                  <div className="flex items-center">
                    <FiCalendar className="mr-1" />
                    Last seen: {student.recentActivity.lastSeen}
                  </div>
                  <div className="flex items-center">
                    <FiDownload className="mr-1" />
                    Last submission: {student.recentActivity.lastSubmission}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiUser className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            <p className="text-sm text-gray-600">Total Students</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiCheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {students.filter(s => s.overallPerformance.status === 'excellent').length}
            </p>
            <p className="text-sm text-gray-600">Excellent Performance</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiAlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {students.filter(s => s.overallPerformance.attendance < 75).length}
            </p>
            <p className="text-sm text-gray-600">Low Attendance</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiTrendingDown className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {students.filter(s => s.overallPerformance.status === 'poor').length}
            </p>
            <p className="text-sm text-gray-600">Need Attention</p>
          </div>
        </div>
      </div>
    </div>
  );
}
