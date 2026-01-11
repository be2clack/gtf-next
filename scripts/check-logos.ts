import prisma from '../src/lib/prisma'

async function main() {
  const clubs = await prisma.club.findMany({
    where: { federationId: 1 },
    select: { id: true, logo: true },
    take: 10
  })
  console.log('Club logos:')
  clubs.forEach(c => {
    console.log(`ID: ${c.id}, Logo: ${c.logo}`)
  })
  await prisma.$disconnect()
}
main().catch(console.error)
