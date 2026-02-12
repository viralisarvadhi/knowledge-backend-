
import { Notification, User, sequelize } from '../models';

async function checkNotifications() {
    try {
        const users = await User.findAll();
        for (const user of users) {
            const count = await Notification.count({ where: { userId: user.id } });
            console.log(`User: ${user.email} (${user.id}) - Notifications: ${count}`);

            if (count > 0) {
                const notifications = await Notification.findAll({
                    where: { userId: user.id },
                    limit: 5,
                    order: [['createdAt', 'DESC']]
                });
                console.log('Latest 5:', notifications.map(n => ({ id: n.id, title: n.title, createdAt: n.createdAt })));
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkNotifications();
