import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  // Users
  const adminPass = await bcrypt.hash('admin123', 10)
  const pmPass = await bcrypt.hash('pm123', 10)
  const devPass = await bcrypt.hash('dev123', 10)

  const admin = await prisma.user.create({
    data: { name: 'Admin User', email: 'admin@velozity.com', password: adminPass, role: 'ADMIN' }
  })

  const pm1 = await prisma.user.create({
    data: { name: 'PM One', email: 'pm1@velozity.com', password: pmPass, role: 'PM' }
  })

  const pm2 = await prisma.user.create({
    data: { name: 'PM Two', email: 'pm2@velozity.com', password: pmPass, role: 'PM' }
  })

  const dev1 = await prisma.user.create({
    data: { name: 'Dev One', email: 'dev1@velozity.com', password: devPass, role: 'DEVELOPER' }
  })
  const dev2 = await prisma.user.create({
    data: { name: 'Dev Two', email: 'dev2@velozity.com', password: devPass, role: 'DEVELOPER' }
  })
  const dev3 = await prisma.user.create({
    data: { name: 'Dev Three', email: 'dev3@velozity.com', password: devPass, role: 'DEVELOPER' }
  })
  const dev4 = await prisma.user.create({
    data: { name: 'Dev Four', email: 'dev4@velozity.com', password: devPass, role: 'DEVELOPER' }
  })

  // Clients
  const client1 = await prisma.client.create({
    data: { name: 'Acme Corp', email: 'acme@corp.com' }
  })
  const client2 = await prisma.client.create({
    data: { name: 'Globex Inc', email: 'globex@inc.com' }
  })

  // Projects
  const proj1 = await prisma.project.create({
    data: { name: 'Website Redesign', description: 'Redesign company website', clientId: client1.id, managerId: pm1.id }
  })
  const proj2 = await prisma.project.create({
    data: { name: 'Mobile App', description: 'Build mobile application', clientId: client2.id, managerId: pm1.id }
  })
  const proj3 = await prisma.project.create({
    data: { name: 'API Integration', description: 'Third party API integration', clientId: client1.id, managerId: pm2.id }
  })

  const pastDate = new Date('2026-03-01')
  const futureDate = new Date('2026-04-30')

  // Tasks for proj1
  const tasks1 = await Promise.all([
    prisma.task.create({ data: { title: 'Design mockups', projectId: proj1.id, assigneeId: dev1.id, status: 'DONE', priority: 'HIGH', dueDate: futureDate } }),
    prisma.task.create({ data: { title: 'Build homepage', projectId: proj1.id, assigneeId: dev1.id, status: 'IN_PROGRESS', priority: 'HIGH', dueDate: futureDate } }),
    prisma.task.create({ data: { title: 'Setup CI/CD', projectId: proj1.id, assigneeId: dev2.id, status: 'TODO', priority: 'MEDIUM', dueDate: futureDate } }),
    prisma.task.create({ data: { title: 'Write tests', projectId: proj1.id, assigneeId: dev2.id, status: 'OVERDUE', priority: 'CRITICAL', dueDate: pastDate } }),
    prisma.task.create({ data: { title: 'Deploy to staging', projectId: proj1.id, assigneeId: dev1.id, status: 'OVERDUE', priority: 'HIGH', dueDate: pastDate } }),
  ])

  // Tasks for proj2
  await Promise.all([
    prisma.task.create({ data: { title: 'Setup React Native', projectId: proj2.id, assigneeId: dev3.id, status: 'DONE', priority: 'HIGH', dueDate: futureDate } }),
    prisma.task.create({ data: { title: 'Auth screens', projectId: proj2.id, assigneeId: dev3.id, status: 'IN_REVIEW', priority: 'HIGH', dueDate: futureDate } }),
    prisma.task.create({ data: { title: 'Dashboard screen', projectId: proj2.id, assigneeId: dev4.id, status: 'IN_PROGRESS', priority: 'MEDIUM', dueDate: futureDate } }),
    prisma.task.create({ data: { title: 'Push notifications', projectId: proj2.id, assigneeId: dev4.id, status: 'TODO', priority: 'LOW', dueDate: futureDate } }),
    prisma.task.create({ data: { title: 'App store submission', projectId: proj2.id, assigneeId: dev3.id, status: 'TODO', priority: 'CRITICAL', dueDate: futureDate } }),
  ])

  // Tasks for proj3
  await Promise.all([
    prisma.task.create({ data: { title: 'API research', projectId: proj3.id, assigneeId: dev1.id, status: 'DONE', priority: 'MEDIUM', dueDate: futureDate } }),
    prisma.task.create({ data: { title: 'OAuth integration', projectId: proj3.id, assigneeId: dev2.id, status: 'IN_PROGRESS', priority: 'HIGH', dueDate: futureDate } }),
    prisma.task.create({ data: { title: 'Webhook handlers', projectId: proj3.id, assigneeId: dev3.id, status: 'TODO', priority: 'MEDIUM', dueDate: futureDate } }),
    prisma.task.create({ data: { title: 'Rate limit handling', projectId: proj3.id, assigneeId: dev4.id, status: 'TODO', priority: 'LOW', dueDate: futureDate } }),
    prisma.task.create({ data: { title: 'Integration tests', projectId: proj3.id, assigneeId: dev2.id, status: 'TODO', priority: 'HIGH', dueDate: futureDate } }),
  ])

  // Activity logs
  await Promise.all([
    prisma.activityLog.create({ data: { userId: dev1.id, projectId: proj1.id, taskId: tasks1[0].id, fromStatus: 'IN_PROGRESS', toStatus: 'DONE', message: 'Task "Design mockups" moved from IN_PROGRESS → DONE' } }),
    prisma.activityLog.create({ data: { userId: dev1.id, projectId: proj1.id, taskId: tasks1[1].id, fromStatus: 'TODO', toStatus: 'IN_PROGRESS', message: 'Task "Build homepage" moved from TODO → IN_PROGRESS' } }),
    prisma.activityLog.create({ data: { userId: dev2.id, projectId: proj1.id, taskId: tasks1[3].id, fromStatus: 'IN_PROGRESS', toStatus: 'OVERDUE', message: 'Task "Write tests" moved from IN_PROGRESS → OVERDUE' } }),
  ])

  console.log('Seed completed!')
}

main().catch(console.error).finally(() => prisma.$disconnect())