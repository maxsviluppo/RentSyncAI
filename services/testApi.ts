
import { Contract } from '../types';

// Mock Test Inteface
export interface TestSuite {
    id: string;
    name: string;
    type: 'unit' | 'integration' | 'e2e' | 'performance';
    status: 'passed' | 'failed' | 'running' | 'pending';
    lastRun: string;
    durationMs: number;
    coverage: number;
}

const MOCK_TESTS: TestSuite[] = [
    { id: '1', name: 'Auth Service Tests', type: 'unit', status: 'passed', lastRun: '2024-05-10T08:30:00Z', durationMs: 450, coverage: 98 },
    { id: '2', name: 'Car Booking Flow', type: 'e2e', status: 'passed', lastRun: '2024-05-10T09:15:00Z', durationMs: 12000, coverage: 85 },
    { id: '3', name: 'PDF Generation', type: 'integration', status: 'failed', lastRun: '2024-05-10T10:00:00Z', durationMs: 3500, coverage: 70 },
    { id: '4', name: 'AI Recommendation API', type: 'performance', status: 'passed', lastRun: '2024-05-09T18:00:00Z', durationMs: 800, coverage: 90 },
];

export const getTests = async (): Promise<TestSuite[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...MOCK_TESTS];
};

export const runTest = async (testId: string): Promise<TestSuite> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const test = MOCK_TESTS.find(t => t.id === testId);
    if (!test) throw new Error('Test not found');

    // Randomize result
    const passed = Math.random() > 0.2;
    const updatedTest: TestSuite = {
        ...test,
        status: passed ? 'passed' : 'failed',
        lastRun: new Date().toISOString(),
        durationMs: Math.floor(Math.random() * 5000) + 100
    };

    // Update in-memory mock
    const index = MOCK_TESTS.findIndex(t => t.id === testId);
    if (index !== -1) MOCK_TESTS[index] = updatedTest;

    return updatedTest;
};

export const createTest = async (test: Partial<TestSuite>): Promise<TestSuite> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newTest: TestSuite = {
        id: Date.now().toString(),
        name: test.name || 'New Test',
        type: test.type || 'unit',
        status: 'pending',
        lastRun: '',
        durationMs: 0,
        coverage: 0
    };
    MOCK_TESTS.push(newTest);
    return newTest;
};

// Generic "Test Management" API
export const TestApi = {
    getAll: getTests,
    run: runTest,
    create: createTest
};
