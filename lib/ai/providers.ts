import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { xai } from '@ai-sdk/xai';
import { gateway } from '@ai-sdk/gateway';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': gateway('anthropic/claude-4-sonnet'),
        'chat-model-reasoning': wrapLanguageModel({
          model: gateway('anthropic/claude-4-opus'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': gateway('anthropic/claude-3.5-haiku'),
        'artifact-model': gateway('anthropic/claude-3.5-sonnet'),
      },
      imageModels: {
        'small-model': xai.imageModel('grok-2-image'),
      },
    });
