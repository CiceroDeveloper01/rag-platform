import { Injectable } from '@nestjs/common';

export interface SimulationScenarioRecord {
  scenarioName: string;
  inputMessage: string;
  expectedAgent: string;
  expectedAction: string;
}

export interface SimulationResultRecord {
  scenarioId: string;
  actualAgent: string;
  actualAction: string;
  score: 'PASS' | 'FAIL';
  createdAt: string;
}

@Injectable()
export class SimulationService {
  private readonly scenarios: SimulationScenarioRecord[] = [
    {
      scenarioName: 'conversation-default',
      inputMessage: 'Como eu acompanho minha fatura?',
      expectedAgent: 'conversation-agent',
      expectedAction: 'execute.reply-conversation',
    },
    {
      scenarioName: 'document-upload',
      inputMessage: 'Estou enviando o PDF da proposta em anexo.',
      expectedAgent: 'document-agent',
      expectedAction: 'execute.register-document',
    },
  ];

  private readonly results: SimulationResultRecord[] = [];

  getScenarios() {
    return this.scenarios;
  }

  getResults() {
    return this.results;
  }

  runScenario(scenario: SimulationScenarioRecord): SimulationResultRecord {
    const actualAgent = inferAgent(scenario.inputMessage);
    const actualAction = inferAction(actualAgent);
    const result: SimulationResultRecord = {
      scenarioId: scenario.scenarioName,
      actualAgent,
      actualAction,
      score:
        actualAgent === scenario.expectedAgent &&
        actualAction === scenario.expectedAction
          ? 'PASS'
          : 'FAIL',
      createdAt: new Date().toISOString(),
    };

    this.results.unshift(result);
    this.results.splice(100);
    return result;
  }
}

function inferAgent(inputMessage: string): string {
  const normalized = inputMessage.toLowerCase();

  if (
    normalized.includes('anexo') ||
    normalized.includes('arquivo') ||
    normalized.includes('documento') ||
    normalized.includes('pdf')
  ) {
    return 'document-agent';
  }

  if (
    normalized.includes('humano') ||
    normalized.includes('atendente') ||
    normalized.includes('suporte') ||
    normalized.includes('urgente')
  ) {
    return 'handoff-agent';
  }

  return 'conversation-agent';
}

function inferAction(agentName: string): string {
  if (agentName === 'document-agent') {
    return 'execute.register-document';
  }

  if (agentName === 'handoff-agent') {
    return 'execute.handoff';
  }

  return 'execute.reply-conversation';
}
