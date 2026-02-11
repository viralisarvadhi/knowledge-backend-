import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { AuthenticatedRequest } from './auth.controller';

export const uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthenticatedRequest).user!.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Generate file path (relative to API root)
        const avatarPath = `/uploads/${file.filename}`;

        // Update user record
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.avatar = avatarPath;
        await user.save();

        res.json({
            message: 'Avatar uploaded successfully',
            avatar: avatarPath,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                totalCredits: user.totalCredits
            }
        });
    } catch (error) {
        next(error);
    }
};

export const removeAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as AuthenticatedRequest).user!.id;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Optional: Delete file from filesystem
        // if (user.avatar) {
        //     const filePath = path.join(__dirname, '../../', user.avatar);
        //     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        // }

        user.avatar = null;
        await user.save();

        res.json({
            message: 'Avatar removed successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                totalCredits: user.totalCredits
            }
        });
    } catch (error) {
        next(error);
    }
};
