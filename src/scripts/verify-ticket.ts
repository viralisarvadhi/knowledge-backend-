import { createTicket, redeemTicket, resolveTicket } from '../controllers/ticket.controller';
import { Ticket } from '../models';
import { Request, Response } from 'express';

// Mock Ticket Model
const mockTicketModel: any = {
    create: async (data: any) => {
        console.log('Ticket.create called with:', data);
        return { ...data, id: 'ticket-123', save: async () => { } };
    },
    findByPk: async (id: string) => {
        console.log('Ticket.findByPk called with:', id);
        if (id === 'not-found') return null;
        return {
            id,
            title: 'Test Ticket',
            description: 'Test Desc',
            status: 'open',
            traineeId: 'trainee-1',
            redeemedBy: null,
            save: async function () { console.log('Ticket.save called. New Status:', this.status, 'RedeemedBy:', this.redeemedBy); }
        };
    }
};

// Monkey patch Ticket model methods
Ticket.create = mockTicketModel.create;
Ticket.findByPk = mockTicketModel.findByPk;

// Mock Express objects
const mockRequest = (body: any = {}, params: any = {}, user: any = {}) => {
    return {
        body,
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
        console.log(`Response ${res.statusCode}:`, data);
        res.body = data;
        return res;
    };
    return res as Response;
};

const mockNext = (err?: any) => {
    if (err) console.error('Next called with error:', err);
};

const runTests = async () => {
    console.log('--- Testing Create Ticket ---');
    const reqCreate = mockRequest({ title: 'Help', description: 'Need help' }, {}, { id: 'trainee-1', role: 'trainee' });
    await createTicket(reqCreate, mockResponse(), mockNext);

    console.log('\n--- Testing Redeem Ticket (Success) ---');
    const reqRedeem = mockRequest({}, { id: 'ticket-123' }, { id: 'admin-1', role: 'admin' });
    await redeemTicket(reqRedeem, mockResponse(), mockNext);

    console.log('\n--- Testing Resolve Ticket (Success) ---');
    // We need to mock findByPk to return a ticket that is "in-progress" and redeemed by the user
    const oldFindByPk = Ticket.findByPk;
    Ticket.findByPk = async (id: string) => {
        return {
            id,
            title: 'Test Ticket',
            description: 'Test Desc',
            status: 'in-progress',
            traineeId: 'trainee-1',
            redeemedBy: 'admin-1',
            save: async function () { console.log('Ticket.save called. New Status:', this.status); }
        } as any;
    };

    const reqResolve = mockRequest({}, { id: 'ticket-123' }, { id: 'admin-1', role: 'admin' });
    await resolveTicket(reqResolve, mockResponse(), mockNext);

    Ticket.findByPk = oldFindByPk; // Restore
};

runTests();
