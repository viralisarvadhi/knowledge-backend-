import { awardCreditsForResolution, awardCreditsForReuse } from '../services/credit.service';
import { User } from '../models';

// Mock User Model
const mockUserModel: any = {
    findByPk: async (id: string, options?: any) => {
        console.log('User.findByPk called with:', id);
        return {
            id,
            username: 'testuser',
            totalCredits: 100,
            save: async function (options?: any) {
                console.log('User.save called. New totalCredits:', this.totalCredits);
            }
        };
    }
};

User.findByPk = mockUserModel.findByPk;

// Mock sequelize transaction
const mockTransaction = {
    commit: async () => { console.log('Transaction committed'); },
    rollback: async () => { console.log('Transaction rolled back'); }
};

const { sequelize } = require('../models');
sequelize.transaction = async () => mockTransaction;

const runTests = async () => {
    console.log('--- Testing Award Credits for Resolution (Trainee) ---');
    try {
        const credits = await awardCreditsForResolution('user-1', 'trainee');
        console.log('Credits awarded:', credits);
    } catch (error) {
        console.error('Error:', error);
    }

    console.log('\n--- Testing Award Credits for Resolution (Admin) ---');
    try {
        const credits = await awardCreditsForResolution('admin-1', 'admin');
        console.log('Credits awarded:', credits);
    } catch (error) {
        console.error('Error:', error);
    }

    console.log('\n--- Testing Award Credits for Solution Reuse ---');
    try {
        const credits = await awardCreditsForReuse('creator-1');
        console.log('Credits awarded:', credits);
    } catch (error) {
        console.error('Error:', error);
    }
};

runTests();
