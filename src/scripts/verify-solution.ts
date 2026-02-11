import { searchSolutions, incrementReuseCount } from '../controllers/solution.controller';
import { Solution } from '../models';
import { Request, Response } from 'express';
import { Op } from 'sequelize';

// Mock Solution Model
const mockSolutionModel: any = {
    findAll: async (options: any) => {
        console.log('Solution.findAll called with:', JSON.stringify(options, null, 2));
        return [
            {
                id: 'sol-1',
                rootCause: 'Database connection timeout',
                fixSteps: 'Increase timeout settings',
                preventionNotes: 'Monitor connection pool',
                tags: ['database', 'timeout'],
                reuseCount: 5,
                isActive: true
            }
        ];
    },
    findByPk: async (id: string) => {
        console.log('Solution.findByPk called with:', id);
        return {
            id,
            rootCause: 'Test issue',
            fixSteps: 'Test fix',
            reuseCount: 0,
            isActive: true,
            save: async function () { console.log('Solution.save called. New reuseCount:', this.reuseCount); }
        };
    }
};

Solution.findAll = mockSolutionModel.findAll;
Solution.findByPk = mockSolutionModel.findByPk;

// Mock Express objects
const mockRequest = (query: any = {}, params: any = {}, user: any = {}) => {
    return {
        query,
        params,
        user
    } as any as Request;
};

const mockResponse = () => {
    const res: any = {};
    res.status = (code: number) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        console.log(`Response ${res.statusCode || 200}:`, JSON.stringify(data, null, 2));
        res.body = data;
        return res;
    };
    return res as Response;
};

const mockNext = (err?: any) => {
    if (err) console.error('Next called with error:', err);
};

const runTests = async () => {
    console.log('--- Testing Search Solutions ---');
    const reqSearch = mockRequest({ q: 'database' }, {}, { id: 'user-1', role: 'trainee' });
    await searchSolutions(reqSearch, mockResponse(), mockNext);

    console.log('\n--- Testing Increment Reuse Count ---');
    const reqReuse = mockRequest({}, { id: 'sol-1' }, { id: 'user-1', role: 'trainee' });
    await incrementReuseCount(reqReuse, mockResponse(), mockNext);
};

runTests();
