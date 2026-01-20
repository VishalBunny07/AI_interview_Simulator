from transformers import pipeline
import random

class AIService:
    def __init__(self):
        self.question_generator = pipeline("text2text-generation", model="mrm8488/t5-base-finetuned-question-generation-ap")
    
    def generate_questions(self, resume_text, num_questions=5):
        prompts = self._create_prompts(resume_text)
        
        questions = []
        for prompt in prompts:
            try:
                result = self.question_generator(prompt, max_length=800, num_return_sequences=1)
                generated_question = result[0]['generated_text'].strip()
                if generated_question and '?' in generated_question:
                    questions.append(generated_question)
            except:
                continue
            
            if len(questions) >= num_questions:
                break
        
        if len(questions) < 3:
            questions.extend(self._get_fallback_questions()[:5-len(questions)])
        
        return questions[:num_questions]
    
    def _create_prompts(self, text):
        prompts = [
            f"Generate an interview question about: {text}",
            "What technical question can I ask about this experience?",
            "Create behavioral interview question from this resume",
            "Generate question about skills mentioned in this text"
        ]
        return prompts
    
    def _get_fallback_questions(self):
        return [
            "Can you tell me about yourself?",
            "What are your greatest strengths?",
            "Where do you see yourself in 5 years?",
            "Why do you want to work here?",
            "Can you describe a challenging project you worked on?"
        ]

ai_service = AIService()