import { User } from '../types';

export const users: User[] = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex.johnson@university.edu",
    major: "Computer Science",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    skills: ["JavaScript", "React", "Python", "Machine Learning", "UI/UX Design"],
    interests: ["Technology", "Innovation", "Entrepreneurship", "Web Development", "AI"],
    year: "3rd Year"
  },
  {
    id: "2",
    name: "Sarah Wilson",
    email: "sarah.wilson@university.edu",
    major: "Data Science",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=150&h=150&fit=crop&crop=face",
    skills: ["Python", "Machine Learning", "Statistics"],
    interests: ["AI", "Research", "Data Analytics"],
    year: "4th Year"
  },
  {
    id: "3", 
    name: "Marcus Thompson",
    email: "marcus.thompson@university.edu",
    major: "Business Administration",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    skills: ["Marketing", "Strategy", "Leadership"],
    interests: ["Entrepreneurship", "Finance", "Innovation"],
    year: "2nd Year"
  },
  {
    id: "4",
    name: "Emma Rodriguez",
    email: "emma.rodriguez@university.edu", 
    major: "Design",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    skills: ["UI/UX", "Figma", "Adobe Creative Suite"],
    interests: ["Design", "Art", "Technology"],
    year: "3rd Year"
  },
  {
    id: "5",
    name: "David Kim",
    email: "david.kim@university.edu",
    major: "Engineering",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    skills: ["Robotics", "CAD", "Programming"],
    interests: ["Innovation", "Technology", "Problem Solving"],
    year: "4th Year"
  }
];

export const currentUser = users[0];
