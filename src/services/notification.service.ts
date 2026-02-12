import * as admin from 'firebase-admin';
import { DeviceToken, Notification, User } from '../models'; // Import models
import serviceAccount from '../config/service-account.json';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
    });
}

export const sendToAll = async (title: string, body: string, data: any = {}) => {
    try {
        // 1. Get all device tokens
        const tokens = await DeviceToken.findAll();
        const registrationTokens = tokens.map(t => t.token);

        if (registrationTokens.length === 0) {
            console.log('No devices to send notification to.');
            return;
        }

        // 2. Send Multicast Message
        const message: admin.messaging.MulticastMessage = {
            notification: { title, body },
            data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' }, // Standard for some plugins, harmless if unused
            tokens: registrationTokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} failed.`);

        // 3. Create Notification records for ALL users (even if they don't have a token, they should see it in-app)
        const users = await User.findAll({ attributes: ['id'] });
        const notificationsToCreate = users.map(user => ({
            userId: user.id,
            title,
            body,
            data,
            type: 'announcement', // Default type
            isRead: false
        }));

        await Notification.bulkCreate(notificationsToCreate);

    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

export const sendToUser = async (userId: string, title: string, body: string, data: any = {}) => {
    try {
        // 1. Get user tokens
        const tokens = await DeviceToken.findAll({ where: { userId } });
        const registrationTokens = tokens.map(t => t.token);

        // 2. Persist Notification
        await Notification.create({
            userId,
            title,
            body,
            data,
            type: 'personal',
            isRead: false
        });

        // 3. Emit Socket Event for Real-time Badge Update
        try {
            const { getIO } = require('../config/socket'); // Lazy load to avoid circular dependency
            getIO().to(`user_${userId}`).emit('notification_received', {
                title,
                body,
                data
            });
        } catch (e) {
            console.warn('Socket.io emit failed', e);
        }

        if (registrationTokens.length === 0) {
            return; // Just save to DB if no token
        }

        // 4. Send Message (FCM)
        const message: admin.messaging.MulticastMessage = {
            notification: { title, body },
            data,
            tokens: registrationTokens,
        };

        await admin.messaging().sendEachForMulticast(message);

    } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
    }
};
