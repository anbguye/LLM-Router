import OpenAI from 'openai';
import { env } from '@/config/env';
import { AVAILABLE_MODELS, ROUTER_MODEL, ModelConfig, getModelsByContextRequirement, getFastestModels } from '@/config/models';
import { rateLimiter } from '@/utils/rateLimiter';
import { Logger } from '@/utils/logger';

const logger = new Logger('Router');

// Router constants
const TOKEN_ESTIMATION_RATIO = 4; // Rough characters to tokens ratio
const CONTEXT_MULTIPLIER_THRESHOLD = 1000; // Message length threshold for context multiplier
const CONTEXT_MULTIPLIER_FACTOR = 2; // Multiplier for longer messages
const MAX_CONTEXT_FALLBACK = 100000; // Maximum context for fallback models
const MAX_RESPONSE_TOKENS = 4000; // Maximum tokens for model responses
const ROUTER_MODEL_MAX_TOKENS = 500; // Maximum tokens for router model responses
const ROUTER_MODEL_TEMPERATURE = 0.3; // Temperature for router decision making
const MAIN_MODEL_TEMPERATURE = 0.7; // Temperature for main model responses

const openai = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export interface RouterDecision {
  selectedModel: ModelConfig;
  reasoning: string;
  confidence: number;
  alternatives: ModelConfig[];
}

export interface ChatResponse {
  content: string;
  model: string;
  reasoning: string;
  tokensUsed?: number;
  processingTime: number;
}

/**
 * Analyze user input to determine the best model for the task
 */
async function analyzeAndRoute(message: string): Promise<RouterDecision> {
  const startTime = Date.now();

  try {
    // Check if we can make a request
    if (!rateLimiter.canMakeRequest()) {
      logger.warn('Rate limit exceeded, using fastest available model');
      const fastestModels = getFastestModels();
      return {
        selectedModel: fastestModels[0],
        reasoning: 'Rate limit exceeded, using fastest available model for quick response',
        confidence: 0.5,
        alternatives: fastestModels.slice(1)
      };
    }

    // Estimate context requirements based on message length
    const estimatedTokens = Math.ceil(message.length / TOKEN_ESTIMATION_RATIO);
    const contextMultiplier = estimatedTokens > CONTEXT_MULTIPLIER_THRESHOLD ? CONTEXT_MULTIPLIER_FACTOR : 1;
    const minContextNeeded = Math.min(estimatedTokens * contextMultiplier, MAX_CONTEXT_FALLBACK);

    // Get models that can handle the context
    let availableModels = getModelsByContextRequirement(minContextNeeded);

    if (availableModels.length === 0) {
      // Fallback to models with largest context
      availableModels = AVAILABLE_MODELS.sort((a, b) => b.contextWindow - a.contextWindow).slice(0, 5);
    }

    // Create router prompt
    const routerPrompt = createRouterPrompt(message, availableModels);

    // Get decision from router model
    const completion = await openai.chat.completions.create({
      model: ROUTER_MODEL.id,
      messages: [
        {
          role: 'system',
          content: 'You are an expert AI model router. Analyze the user\'s message and select the most appropriate model from the available options. Consider the task type, complexity, context requirements, and model strengths. Return your decision as JSON with the selected model ID, reasoning, and confidence score.'
        },
        {
          role: 'user',
          content: routerPrompt
        }
      ],
      temperature: ROUTER_MODEL_TEMPERATURE,
      max_tokens: ROUTER_MODEL_MAX_TOKENS,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from router model');
    }

    const decision = JSON.parse(response);
    const selectedModel = AVAILABLE_MODELS.find(m => m.id === decision.modelId);

    if (!selectedModel) {
      logger.warn('Router selected unknown model, using fallback');
      const fallbackModel = getFastestModels()[0];
      return {
        selectedModel: fallbackModel,
        reasoning: 'Router selected unknown model, using fastest available fallback',
        confidence: 0.3,
        alternatives: getFastestModels().slice(1)
      };
    }

    const processingTime = Date.now() - startTime;
    logger.info('Router decision made', {
      selectedModel: selectedModel.name,
      confidence: decision.confidence,
      processingTime
    });

    return {
      selectedModel,
      reasoning: decision.reasoning,
      confidence: decision.confidence || 0.8,
      alternatives: availableModels.filter(m => m.id !== selectedModel.id).slice(0, 3)
    };

  } catch (error) {
    logger.error('Router analysis failed, using fallback', { error: error instanceof Error ? error.message : 'Unknown error' });

    // Fallback to fastest model
    const fallbackModel = getFastestModels()[0];
    return {
      selectedModel: fallbackModel,
      reasoning: 'Router analysis failed, using fastest available model as fallback',
      confidence: 0.2,
      alternatives: getFastestModels().slice(1)
    };
  }
}

/**
 * Create the router prompt with available models and analysis criteria
 */
function createRouterPrompt(message: string, availableModels: ModelConfig[]): string {
  const modelInfo = availableModels.map(model => ({
    id: model.id,
    name: model.name,
    category: model.category,
    contextWindow: model.contextWindow,
    strengths: model.strengths,
    useCases: model.useCases,
    speed: model.speed
  }));

  return `
Analyze this user message and select the most appropriate AI model from the available options:

USER MESSAGE: "${message}"

AVAILABLE MODELS:
${JSON.stringify(modelInfo, null, 2)}

SELECTION CRITERIA:
1. Task Type: Determine if this is coding, reasoning, creative writing, analysis, or general conversation
2. Context Requirements: Estimate how much context window is needed based on message complexity
3. Speed vs Quality: Balance response speed with task requirements
4. Model Strengths: Match the model's strengths to the task requirements

Return your decision as JSON with this exact format:
{
  "modelId": "exact-model-id-from-available-models",
  "reasoning": "detailed explanation of why this model was chosen",
  "confidence": 0.0-1.0
}

Choose the model that best fits the user's needs while considering efficiency and available resources.`;
}

/**
 * Send message to selected model and get response
 */
async function callSelectedModel(message: string, modelConfig: ModelConfig): Promise<ChatResponse> {
  const startTime = Date.now();

  try {
    // Check rate limit again before making the actual call
    if (!rateLimiter.canMakeRequest()) {
      throw new Error('Rate limit exceeded');
    }

    const completion = await openai.chat.completions.create({
      model: modelConfig.id,
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      temperature: MAIN_MODEL_TEMPERATURE,
      max_tokens: Math.min(MAX_RESPONSE_TOKENS, Math.floor(modelConfig.contextWindow / 2)), // Leave room for response
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from selected model');
    }

    const processingTime = Date.now() - startTime;

    logger.info('Model response received', {
      model: modelConfig.name,
      processingTime,
      tokensUsed: completion.usage?.total_tokens
    });

    return {
      content: response,
      model: modelConfig.name,
      reasoning: '', // Will be filled by router decision
      tokensUsed: completion.usage?.total_tokens,
      processingTime
    };

  } catch (error) {
    logger.error('Model call failed', {
      model: modelConfig.name,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Main routing function that handles the entire flow
 */
export async function routeAndRespond(message: string): Promise<ChatResponse> {
  const startTime = Date.now();

  try {
    // Step 1: Analyze and route
    const decision = await analyzeAndRoute(message);

    // Step 2: Call selected model
    const response = await callSelectedModel(message, decision.selectedModel);

    // Step 3: Return enriched response
    return {
      ...response,
      reasoning: decision.reasoning,
      processingTime: Date.now() - startTime
    };

  } catch (error) {
    logger.error('Routing failed', { error: error instanceof Error ? error.message : 'Unknown error' });

    // Ultimate fallback - try fastest model
    try {
      const fallbackModel = getFastestModels()[0];
      const fallbackResponse = await callSelectedModel(message, fallbackModel);

      return {
        ...fallbackResponse,
        reasoning: 'Primary routing failed, used fastest available model as fallback',
        processingTime: Date.now() - startTime
      };
    } catch (fallbackError) {
      logger.error('Fallback also failed', { error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error' });
      throw new Error('All routing attempts failed. Please try again later.');
    }
  }
}

/**
 * Get router status and available models
 */
export function getRouterStatus() {
  return {
    rateLimit: rateLimiter.getStatus(),
    availableModels: AVAILABLE_MODELS.length,
    routerModel: ROUTER_MODEL.name
  };
}
