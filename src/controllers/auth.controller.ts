import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { jwtConfig } from '../config/jwt';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthenticatedRequest).user!.id;
        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        next(error);
    }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { name, email, password, role } = req.body;

        // Trim email to avoid whitespace issues
        if (email) email = email.trim();

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Password validation
        if (!password || password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'trainee',
            totalCredits: 0
        });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            jwtConfig.secret as jwt.Secret,
            { expiresIn: jwtConfig.expiresIn } as any
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { email, password } = req.body;

        // Trim email to avoid whitespace issues
        if (email) email = email.trim();

        console.log(`Login attempt for email: '${email}'`);

        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log(`Login failed: User not found for email: '${email}'`);

            // Debugging: Check if a trimmed version exists
            const trimmedEmail = email.trim();
            const userTrimmed = await User.findOne({ where: { email: trimmedEmail } });
            if (userTrimmed) {
                console.log(`BUT user found for trimmed email: '${trimmedEmail}'`);
            }

            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Login failed: Password mismatch for user: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            jwtConfig.secret as jwt.Secret,
            { expiresIn: jwtConfig.expiresIn } as any
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        });
    } catch (error) {
        next(error);
    }
};
