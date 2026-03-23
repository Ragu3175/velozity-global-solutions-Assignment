import { defineConfig } from 'prisma/config'
import 'dotenv/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'ts-node prisma/seed.ts',
    async adapter() {
      const { PrismaNeon } = await import('@prisma/adapter-neon')
      return new PrismaNeon({ connectionString: process.env.DATABASE_URL })
    }
  },
  datasource: {
    url: process.env.DATABASE_URL!
  }
})