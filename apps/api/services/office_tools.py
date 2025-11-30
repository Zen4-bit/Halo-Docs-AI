"""
Office Tools Service
Implements specialized AI office tools
"""
import logging
from typing import Optional, List
from services.halo_ai import HaloAIService

logger = logging.getLogger(__name__)

class OfficeToolsService:
    """Service for AI-powered office tools"""
    
    def __init__(self):
        self.halo_ai = HaloAIService()
    
    async def optimize_resume(
        self,
        resume_text: str,
        job_description: Optional[str] = None,
        target_role: Optional[str] = None
    ) -> str:
        """
        Optimize resume for ATS and improve content
        
        Args:
            resume_text: Current resume text
            job_description: Optional job description to tailor for
            target_role: Optional target role
        
        Returns:
            Optimized resume
        """
        if job_description:
            prompt = f"""Please optimize the following resume for this job description. Make it ATS-friendly, 
highlight relevant skills, and improve the content:

Job Description:
{job_description}

Current Resume:
{resume_text}

Optimized Resume:"""
        elif target_role:
            prompt = f"""Please optimize the following resume for a {target_role} position. Make it ATS-friendly, 
highlight relevant skills, and improve the content:

{resume_text}

Optimized Resume:"""
        else:
            prompt = f"""Please optimize the following resume. Make it ATS-friendly, improve formatting, 
enhance descriptions, and make it more impactful:

{resume_text}

Optimized Resume:"""
        
        return await self.halo_ai.generate_response(prompt)
    
    async def generate_proposal(
        self,
        project_name: str,
        project_description: str,
        proposal_type: str = "business",
        budget: Optional[str] = None,
        timeline: Optional[str] = None
    ) -> str:
        """
        Generate a professional proposal
        
        Args:
            project_name: Name of the project
            project_description: Description of the project
            proposal_type: Type of proposal (business, funding, technical)
            budget: Optional budget information
            timeline: Optional timeline information
        
        Returns:
            Generated proposal
        """
        budget_section = f"\nBudget: {budget}" if budget else ""
        timeline_section = f"\nTimeline: {timeline}" if timeline else ""
        
        type_instructions = {
            "business": "professional business proposal with executive summary, objectives, methodology, and expected outcomes",
            "funding": "compelling funding proposal with problem statement, solution, impact, and budget justification",
            "technical": "detailed technical proposal with architecture, implementation plan, and technical specifications"
        }
        
        prompt = f"""Please generate a {type_instructions[proposal_type]} for the following project:

Project Name: {project_name}

Project Description:
{project_description}{budget_section}{timeline_section}

Proposal:"""
        
        return await self.halo_ai.generate_response(prompt)
    
    async def generate_taglines(
        self,
        product_name: str,
        description: str,
        tone: str = "professional",
        count: int = 5
    ) -> List[str]:
        """
        Generate catchy taglines and slogans
        
        Args:
            product_name: Name of the product/service
            description: Description of the product/service
            tone: Desired tone (professional, playful, bold, minimal)
            count: Number of taglines to generate
        
        Returns:
            List of taglines
        """
        tone_instructions = {
            "professional": "professional and trustworthy",
            "playful": "playful and fun",
            "bold": "bold and impactful",
            "minimal": "minimal and elegant"
        }
        
        prompt = f"""Please generate {count} catchy, memorable taglines for the following product. 
Make them {tone_instructions[tone]}:

Product: {product_name}
Description: {description}

Generate exactly {count} taglines, one per line:"""
        
        response = await self.halo_ai.generate_response(prompt)
        
        # Parse taglines from response
        taglines = [line.strip() for line in response.split('\n') if line.strip()]
        # Remove numbering if present
        taglines = [line.split('.', 1)[-1].strip() if '.' in line[:3] else line for line in taglines]
        
        return taglines[:count]
    
    async def simplify_contract(self, contract_text: str) -> str:
        """
        Simplify legal documents into plain English
        
        Args:
            contract_text: Legal contract text
        
        Returns:
            Simplified version
        """
        prompt = f"""Please rewrite the following legal document in plain, easy-to-understand English. 
Maintain all key terms and conditions but make it accessible to non-lawyers:

{contract_text}

Simplified Version:"""
        
        return await self.halo_ai.generate_response(prompt)
    
    async def summarize_project(
        self,
        project_text: str,
        summary_type: str = "executive"
    ) -> str:
        """
        Create project summaries for different audiences
        
        Args:
            project_text: Project documentation
            summary_type: Type of summary (executive, technical, stakeholder)
        
        Returns:
            Project summary
        """
        type_instructions = {
            "executive": "executive summary focusing on business value, ROI, and key outcomes",
            "technical": "technical summary focusing on architecture, implementation, and technical details",
            "stakeholder": "stakeholder summary focusing on benefits, timeline, and impact"
        }
        
        prompt = f"""Please create a {type_instructions[summary_type]} for the following project:

{project_text}

Summary:"""
        
        return await self.halo_ai.generate_response(prompt)
    
    async def get_design_advice(
        self,
        project_type: str,
        description: str,
        target_audience: Optional[str] = None,
        brand_values: Optional[str] = None
    ) -> str:
        """
        Get AI-powered design suggestions
        
        Args:
            project_type: Type of project (website, presentation, document, logo)
            description: Project description
            target_audience: Optional target audience
            brand_values: Optional brand values
        
        Returns:
            Design advice
        """
        audience_section = f"\nTarget Audience: {target_audience}" if target_audience else ""
        values_section = f"\nBrand Values: {brand_values}" if brand_values else ""
        
        prompt = f"""Please provide comprehensive design advice for the following {project_type} project. 
Include color palette suggestions, typography recommendations, layout ideas, and visual style guidance:

Description: {description}{audience_section}{values_section}

Design Advice:"""
        
        return await self.halo_ai.generate_response(prompt)
