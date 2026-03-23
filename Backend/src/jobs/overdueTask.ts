import cron from 'node-cron'
import prisma from '../prisma'

export const startOverdueJob = () => {
  // Runs every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date()

      await prisma.task.updateMany({
        where: {
          dueDate: { lt: now },
          status: { notIn: ['DONE', 'OVERDUE'] }
        },
        data: { status: 'OVERDUE' }
      })

      console.log('Overdue tasks updated')
    } catch (err) {
      console.error('Overdue job error:', err)
    }
  })
}