export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  strengths: string[];
  useCases: string[];
  speed: 'fast' | 'medium' | 'slow';
  category: 'coding' | 'reasoning' | 'creative' | 'general' | 'analysis';
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  // Router Model (fast, lightweight for decision making)
  {
    id: 'mistralai/mistral-small-24b-instruct-2501:free',
    name: 'Mistral Small 3',
    provider: 'Mistral',
    contextWindow: 32768,
    strengths: ['fast_response', 'decision_making', 'analysis'],
    useCases: ['routing_decisions', 'quick_analysis'],
    speed: 'fast',
    category: 'general'
  },

  // Large Context Models
  {
    id: 'google/gemini-2.5-pro-exp-03-25',
    name: 'Gemini 2.5 Pro Experimental',
    provider: 'Google',
    contextWindow: 1048576,
    strengths: ['large_context', 'reasoning', 'multimodal'],
    useCases: ['long_documents', 'complex_analysis', 'research'],
    speed: 'medium',
    category: 'analysis'
  },
  {
    id: 'qwen/qwen3-235b-a22b:free',
    name: 'Qwen3 235B A22B',
    provider: 'Qwen',
    contextWindow: 131072,
    strengths: ['large_context', 'reasoning', 'multilingual'],
    useCases: ['long_conversations', 'complex_reasoning'],
    speed: 'slow',
    category: 'reasoning'
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    contextWindow: 163840,
    strengths: ['reasoning', 'mathematics', 'analysis'],
    useCases: ['problem_solving', 'mathematical_tasks', 'analysis'],
    speed: 'medium',
    category: 'reasoning'
  },

  // Coding Specialists
  {
    id: 'qwen/qwen3-coder:free',
    name: 'Qwen3 Coder 480B A35B',
    provider: 'Qwen',
    contextWindow: 262144,
    strengths: ['coding', 'debugging', 'code_generation'],
    useCases: ['programming', 'code_review', 'technical_writing'],
    speed: 'medium',
    category: 'coding'
  },
  {
    id: 'agentica-org/deepcoder-14b-preview:free',
    name: 'DeepCoder 14B Preview',
    provider: 'Agentica',
    contextWindow: 96000,
    strengths: ['coding', 'code_understanding', 'refactoring'],
    useCases: ['code_analysis', 'programming_help'],
    speed: 'fast',
    category: 'coding'
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct:free',
    name: 'Qwen2.5 Coder 32B',
    provider: 'Qwen',
    contextWindow: 32768,
    strengths: ['coding', 'debugging', 'code_explanation'],
    useCases: ['programming', 'code_help'],
    speed: 'fast',
    category: 'coding'
  },

  // Creative/General Purpose
  {
    id: 'mistralai/mistral-small-3.2-24b-instruct:free',
    name: 'Mistral Small 3.2 24B',
    provider: 'Mistral',
    contextWindow: 131072,
    strengths: ['balanced', 'conversational', 'general_knowledge'],
    useCases: ['general_chat', 'writing', 'explanation'],
    speed: 'fast',
    category: 'general'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    contextWindow: 65536,
    strengths: ['conversational', 'creative_writing', 'analysis'],
    useCases: ['writing', 'creative_tasks', 'general_assistance'],
    speed: 'medium',
    category: 'creative'
  },
  {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    name: 'DeepSeek V3 0324',
    provider: 'DeepSeek',
    contextWindow: 163840,
    strengths: ['conversational', 'analysis', 'multilingual'],
    useCases: ['general_chat', 'analysis', 'translation'],
    speed: 'fast',
    category: 'general'
  },

  // Fast/Lightweight Models
  {
    id: 'google/gemma-3n-e2b-it:free',
    name: 'Gemma 3n 2B',
    provider: 'Google',
    contextWindow: 8192,
    strengths: ['fast_response', 'lightweight'],
    useCases: ['quick_responses', 'simple_queries'],
    speed: 'fast',
    category: 'general'
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B',
    provider: 'Mistral',
    contextWindow: 32768,
    strengths: ['fast', 'efficient', 'general_purpose'],
    useCases: ['quick_tasks', 'general_questions'],
    speed: 'fast',
    category: 'general'
  }
];

export const ROUTER_MODEL = AVAILABLE_MODELS.find(m => m.id === 'mistralai/mistral-small-24b-instruct-2501:free')!;

export const getModelsByCategory = (category: ModelConfig['category']): ModelConfig[] => {
  return AVAILABLE_MODELS.filter(model => model.category === category);
};

export const getModelsByContextRequirement = (minContext: number): ModelConfig[] => {
  return AVAILABLE_MODELS.filter(model => model.contextWindow >= minContext);
};

export const getFastestModels = (): ModelConfig[] => {
  return AVAILABLE_MODELS.filter(model => model.speed === 'fast');
};
