"""
AI-powered club recommendation system using machine learning
"""
import os
from typing import List, Dict, Any
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import google.generativeai as genai
from pydantic import BaseModel

# Configure Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

class UserProfile(BaseModel):
    interests: List[str]
    skills: List[str]
    year_of_study: int
    department: str
    preferred_activities: List[str]
    time_commitment: str  # "low", "medium", "high"
    leadership_interest: bool

class ClubData(BaseModel):
    id: str
    name: str
    description: str
    tags: List[str]
    category: str
    member_count: int
    activities: List[str]
    time_commitment: str
    leadership_opportunities: bool

class ClubRecommender:
    def __init__(self):
        self.clubs_data = self._get_clubs_data()
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        self.scaler = StandardScaler()
        self._prepare_data()
    
    def _get_clubs_data(self) -> List[ClubData]:
        """Get comprehensive club data with enhanced features"""
        return [
            ClubData(
                id="1",
                name="Tech Innovation Club",
                description="A community of tech enthusiasts working on cutting-edge projects, hackathons, and technological innovations. Members collaborate on web development, mobile apps, AI projects, and open-source contributions.",
                tags=["Technology", "Innovation", "Programming", "AI", "Web Development", "Mobile Apps"],
                category="Technology",
                member_count=150,
                activities=["Hackathons", "Workshops", "Project Development", "Tech Talks", "Code Reviews"],
                time_commitment="medium",
                leadership_opportunities=True
            ),
            ClubData(
                id="2",
                name="Entrepreneurship Society",
                description="Building the next generation of business leaders and startup founders. Focus on business plan development, pitch competitions, startup incubation, and connecting with industry mentors.",
                tags=["Business", "Startups", "Leadership", "Finance", "Marketing", "Innovation"],
                category="Business",
                member_count=200,
                activities=["Pitch Competitions", "Business Plan Development", "Networking Events", "Mentorship Programs", "Startup Workshops"],
                time_commitment="high",
                leadership_opportunities=True
            ),
            ClubData(
                id="3",
                name="Data Science Club",
                description="Explore the world of data analytics, machine learning, and artificial intelligence. Work on real-world datasets, participate in kaggle competitions, and build predictive models.",
                tags=["Data Science", "Machine Learning", "AI", "Analytics", "Python", "R", "Statistics"],
                category="Technology",
                member_count=120,
                activities=["Kaggle Competitions", "Data Analysis Projects", "ML Workshops", "Research Papers", "Industry Projects"],
                time_commitment="medium",
                leadership_opportunities=True
            ),
            ClubData(
                id="4",
                name="Design Collective",
                description="Creative minds coming together to shape beautiful user experiences and visual designs. Focus on UI/UX design, graphic design, branding, and design thinking methodologies.",
                tags=["Design", "UI/UX", "Creative", "Graphics", "Branding", "User Experience"],
                category="Design",
                member_count=80,
                activities=["Design Challenges", "Portfolio Reviews", "Client Projects", "Design Thinking Workshops", "Creative Sessions"],
                time_commitment="medium",
                leadership_opportunities=False
            ),
            ClubData(
                id="5",
                name="Robotics and Automation Club",
                description="Building autonomous systems and robotic solutions. Work with Arduino, Raspberry Pi, sensors, and participate in robotics competitions.",
                tags=["Robotics", "Automation", "Hardware", "Arduino", "Engineering", "IoT"],
                category="Technology",
                member_count=90,
                activities=["Robot Building", "Competitions", "Hardware Projects", "IoT Development", "Automation Projects"],
                time_commitment="high",
                leadership_opportunities=True
            ),
            ClubData(
                id="6",
                name="Cultural and Arts Society",
                description="Celebrating creativity through music, dance, drama, and visual arts. Organize cultural events, talent shows, and artistic collaborations.",
                tags=["Arts", "Culture", "Music", "Dance", "Drama", "Creative Expression"],
                category="Arts",
                member_count=180,
                activities=["Cultural Events", "Talent Shows", "Art Exhibitions", "Music Concerts", "Drama Productions"],
                time_commitment="medium",
                leadership_opportunities=True
            ),
            ClubData(
                id="7",
                name="Environmental Action Club",
                description="Promoting sustainability and environmental awareness through green initiatives, conservation projects, and environmental research.",
                tags=["Environment", "Sustainability", "Conservation", "Green Technology", "Climate Action"],
                category="Social Impact",
                member_count=75,
                activities=["Green Initiatives", "Research Projects", "Awareness Campaigns", "Conservation Activities", "Sustainability Workshops"],
                time_commitment="low",
                leadership_opportunities=True
            ),
            ClubData(
                id="8",
                name="Sports and Fitness Club",
                description="Promoting physical fitness and sportsmanship through various sports activities, fitness training, and athletic competitions.",
                tags=["Sports", "Fitness", "Athletics", "Health", "Team Building", "Competition"],
                category="Sports",
                member_count=200,
                activities=["Sports Tournaments", "Fitness Training", "Team Building", "Athletic Events", "Health Workshops"],
                time_commitment="medium",
                leadership_opportunities=True
            )
        ]
    
    def _prepare_data(self):
        """Prepare data for machine learning models"""
        # Create feature matrix
        club_texts = []
        numerical_features = []
        
        for club in self.clubs_data:
            # Text features: combine description and tags
            text_content = f"{club.description} {' '.join(club.tags)} {' '.join(club.activities)}"
            club_texts.append(text_content)
            
            # Numerical features
            time_commitment_score = {"low": 1, "medium": 2, "high": 3}[club.time_commitment]
            leadership_score = 1 if club.leadership_opportunities else 0
            popularity_score = min(club.member_count / 50, 5)  # Normalize member count
            
            numerical_features.append([time_commitment_score, leadership_score, popularity_score])
        
        # Vectorize text features
        self.text_features = self.vectorizer.fit_transform(club_texts)
        
        # Scale numerical features
        self.numerical_features = self.scaler.fit_transform(numerical_features)
    
    def recommend_clubs(self, user_profile: UserProfile, top_k: int = 5) -> List[Dict[str, Any]]:
        """Recommend clubs based on user profile using ML"""
        # Create user vector
        user_text = f"{' '.join(user_profile.interests)} {' '.join(user_profile.skills)} {' '.join(user_profile.preferred_activities)}"
        user_text_vector = self.vectorizer.transform([user_text])
        
        # User numerical features
        time_commitment_score = {"low": 1, "medium": 2, "high": 3}[user_profile.time_commitment]
        leadership_score = 1 if user_profile.leadership_interest else 0
        year_factor = user_profile.year_of_study / 4.0  # Normalize year
        
        user_numerical = self.scaler.transform([[time_commitment_score, leadership_score, year_factor]])
        
        # Calculate similarities
        text_similarities = cosine_similarity(user_text_vector, self.text_features)[0]
        numerical_similarities = cosine_similarity(user_numerical, self.numerical_features)[0]
        
        # Combine similarities (weighted)
        combined_similarities = 0.7 * text_similarities + 0.3 * numerical_similarities
        
        # Get top recommendations
        top_indices = np.argsort(combined_similarities)[::-1][:top_k]
        
        recommendations = []
        for idx in top_indices:
            club = self.clubs_data[idx]
            similarity_score = combined_similarities[idx]
            
            # Generate explanation using AI
            explanation = self._generate_explanation(user_profile, club, similarity_score)
            
            recommendations.append({
                "club": club.dict(),
                "similarity_score": float(similarity_score),
                "explanation": explanation,
                "match_reasons": self._get_match_reasons(user_profile, club)
            })
        
        return recommendations
    
    def _generate_explanation(self, user_profile: UserProfile, club: ClubData, score: float) -> str:
        """Generate AI explanation for why this club is recommended"""
        try:
            model = genai.GenerativeModel('gemini-pro')
            
            prompt = f"""
            As an AI advisor, explain why {club.name} is recommended for this student:
            
            Student Profile:
            - Interests: {', '.join(user_profile.interests)}
            - Skills: {', '.join(user_profile.skills)}
            - Year: {user_profile.year_of_study}
            - Department: {user_profile.department}
            - Preferred Activities: {', '.join(user_profile.preferred_activities)}
            - Time Commitment: {user_profile.time_commitment}
            - Leadership Interest: {user_profile.leadership_interest}
            
            Club Details:
            - Name: {club.name}
            - Description: {club.description}
            - Tags: {', '.join(club.tags)}
            - Activities: {', '.join(club.activities)}
            - Time Commitment: {club.time_commitment}
            - Leadership Opportunities: {club.leadership_opportunities}
            
            Match Score: {score:.2f}
            
            Provide a personalized 2-3 sentence explanation of why this club matches the student's profile.
            Focus on specific connections between their interests/skills and club activities.
            """
            
            response = model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            # Fallback explanation
            return f"This club aligns well with your interests in {', '.join(user_profile.interests[:2])} and offers activities that match your preferences."
    
    def _get_match_reasons(self, user_profile: UserProfile, club: ClubData) -> List[str]:
        """Get specific reasons why the club matches"""
        reasons = []
        
        # Interest matches
        user_interests_lower = [i.lower() for i in user_profile.interests]
        club_tags_lower = [t.lower() for t in club.tags]
        
        for interest in user_interests_lower:
            for tag in club_tags_lower:
                if interest in tag or tag in interest:
                    reasons.append(f"Matches your interest in {interest}")
        
        # Skill matches
        user_skills_lower = [s.lower() for s in user_profile.skills]
        for skill in user_skills_lower:
            for tag in club_tags_lower:
                if skill in tag or tag in skill:
                    reasons.append(f"Utilizes your {skill} skills")
        
        # Time commitment match
        if user_profile.time_commitment == club.time_commitment:
            reasons.append(f"Perfect time commitment match ({club.time_commitment})")
        
        # Leadership match
        if user_profile.leadership_interest and club.leadership_opportunities:
            reasons.append("Offers leadership opportunities you're seeking")
        
        return list(set(reasons))  # Remove duplicates

# Chatbot for club-related queries
class ClubChatbot:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-pro')
        self.clubs_data = ClubRecommender()._get_clubs_data()
        self.context = self._build_context()
    
    def _build_context(self) -> str:
        """Build context about all clubs for the chatbot"""
        context = "You are CampusBuddy AI, a helpful assistant for students interested in clubs and committees. Here's information about available clubs:\n\n"
        
        for club in self.clubs_data:
            context += f"**{club.name}** (ID: {club.id})\n"
            context += f"- Category: {club.category}\n"
            context += f"- Description: {club.description}\n"
            context += f"- Tags: {', '.join(club.tags)}\n"
            context += f"- Member Count: {club.member_count}\n"
            context += f"- Activities: {', '.join(club.activities)}\n"
            context += f"- Time Commitment: {club.time_commitment}\n"
            context += f"- Leadership Opportunities: {'Yes' if club.leadership_opportunities else 'No'}\n\n"
        
        context += """
        Guidelines for responses:
        1. Only answer questions related to clubs, committees, and student activities
        2. Provide helpful, accurate information about club details, activities, and membership
        3. Suggest relevant clubs based on student interests
        4. If asked about club heads or specific members, explain that this information can be found through the club's official channels
        5. Be friendly, enthusiastic, and encouraging about club participation
        6. If a question is not related to clubs/committees, politely redirect to club-related topics
        """
        
        return context
    
    async def get_response(self, user_message: str, user_context: Dict = None) -> str:
        """Get chatbot response using Gemini AI"""
        try:
            # Enhanced prompt with context
            prompt = f"""
            {self.context}
            
            User Context: {user_context if user_context else 'No specific user context provided'}
            
            User Question: {user_message}
            
            Please provide a helpful response about clubs and committees. If the question is not related to clubs/committees, 
            politely redirect the conversation to club-related topics.
            """
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            return "I'm sorry, I'm having trouble processing your request right now. Please try asking about our clubs and committees, and I'll be happy to help!"
    
    def get_club_suggestions(self, interests: List[str]) -> str:
        """Get club suggestions based on interests"""
        suggestions = []
        interests_lower = [i.lower() for i in interests]
        
        for club in self.clubs_data:
            club_tags_lower = [t.lower() for t in club.tags]
            if any(interest in tag or tag in interest for interest in interests_lower for tag in club_tags_lower):
                suggestions.append(f"**{club.name}**: {club.description[:100]}...")
        
        if suggestions:
            return f"Based on your interests in {', '.join(interests)}, here are some club suggestions:\n\n" + "\n\n".join(suggestions[:3])
        else:
            return "I'd be happy to help you find clubs that match your interests! Could you tell me more about what you're passionate about?"

# Global instances
club_recommender = ClubRecommender()
club_chatbot = ClubChatbot()
