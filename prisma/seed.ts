import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.petCareLog.deleteMany()
  await prisma.petHealthRecord.deleteMany()
  await prisma.petCareTask.deleteMany()
  await prisma.pet.deleteMany()
  await prisma.vaultDocument.deleteMany()
  await prisma.vaultItem.deleteMany()
  await prisma.allowance.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.budgetCategory.deleteMany()
  await prisma.message.deleteMany()
  await prisma.groceryItem.deleteMany()
  await prisma.mealPlan.deleteMany()
  await prisma.recipe.deleteMany()
  await prisma.choreAssignment.deleteMany()
  await prisma.chore.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.invitation.deleteMany()
  await prisma.member.deleteMany()
  await prisma.household.deleteMany()

  // Create household
  const household = await prisma.household.create({
    data: {
      name: 'The Smith Family',
      location: 'Denver, CO',
      timezone: 'America/Denver',
    },
  })

  // Create family members
  const admin = await prisma.member.create({
    data: {
      googleId: 'google-admin-001',
      email: 'parent1@example.com',
      name: 'Alex Smith',
      color: '#4F46E5',
      role: 'ADMIN',
      householdId: household.id,
    },
  })

  const member = await prisma.member.create({
    data: {
      googleId: 'google-member-001',
      email: 'parent2@example.com',
      name: 'Jordan Smith',
      color: '#059669',
      role: 'MEMBER',
      householdId: household.id,
    },
  })

  const child = await prisma.member.create({
    data: {
      googleId: 'google-child-001',
      email: 'kid@example.com',
      name: 'Sam Smith',
      color: '#D97706',
      role: 'CHILD',
      householdId: household.id,
    },
  })

  // Calendar events
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 86400000)
  const nextWeek = new Date(now.getTime() + 7 * 86400000)

  await prisma.calendarEvent.createMany({
    data: [
      {
        title: 'Family Dinner',
        description: 'Weekly family dinner at home',
        startTime: new Date(tomorrow.setHours(18, 0, 0, 0)),
        endTime: new Date(tomorrow.setHours(19, 30, 0, 0)),
        householdId: household.id,
        memberId: admin.id,
      },
      {
        title: 'Soccer Practice',
        description: "Sam's soccer practice",
        startTime: new Date(nextWeek.setHours(16, 0, 0, 0)),
        endTime: new Date(nextWeek.setHours(17, 30, 0, 0)),
        householdId: household.id,
        memberId: child.id,
      },
      {
        title: 'Dentist Appointment',
        startTime: new Date(nextWeek.setHours(10, 0, 0, 0)),
        endTime: new Date(nextWeek.setHours(11, 0, 0, 0)),
        householdId: household.id,
        memberId: member.id,
      },
    ],
  })

  // Chores
  const dishesChore = await prisma.chore.create({
    data: {
      title: 'Do the Dishes',
      description: 'Load and run the dishwasher after dinner',
      frequency: 'DAILY',
      points: 5,
      householdId: household.id,
    },
  })

  const vacuumChore = await prisma.chore.create({
    data: {
      title: 'Vacuum Living Room',
      description: 'Vacuum the main living area',
      frequency: 'WEEKLY',
      points: 10,
      householdId: household.id,
    },
  })

  const trashChore = await prisma.chore.create({
    data: {
      title: 'Take Out Trash',
      frequency: 'WEEKLY',
      points: 5,
      householdId: household.id,
    },
  })

  // Chore assignments
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.choreAssignment.createMany({
    data: [
      { choreId: dishesChore.id, memberId: child.id, dueDate: today },
      { choreId: vacuumChore.id, memberId: member.id, dueDate: today },
      { choreId: trashChore.id, memberId: child.id, dueDate: today },
    ],
  })

  // Recipes
  const pastaRecipe = await prisma.recipe.create({
    data: {
      title: 'Spaghetti Bolognese',
      description: 'Classic Italian pasta dish',
      ingredients: [
        '1 lb spaghetti',
        '1 lb ground beef',
        '1 jar marinara sauce',
        '1 onion, diced',
        '3 cloves garlic, minced',
        'Parmesan cheese',
      ],
      instructions:
        '1. Cook pasta according to package.\n2. Brown beef with onion and garlic.\n3. Add sauce and simmer 15 min.\n4. Serve over pasta with cheese.',
      tags: ['dinner', 'italian', 'pasta'],
      householdId: household.id,
      createdById: admin.id,
    },
  })

  const saladRecipe = await prisma.recipe.create({
    data: {
      title: 'Caesar Salad',
      description: 'Fresh and crispy caesar salad',
      ingredients: [
        '1 head romaine lettuce',
        'Caesar dressing',
        'Croutons',
        'Parmesan cheese',
        'Lemon juice',
      ],
      instructions:
        '1. Chop romaine.\n2. Toss with dressing.\n3. Top with croutons and cheese.\n4. Squeeze lemon.',
      tags: ['lunch', 'salad', 'healthy'],
      householdId: household.id,
      createdById: member.id,
    },
  })

  // Meal plans
  await prisma.mealPlan.createMany({
    data: [
      {
        date: today,
        mealType: 'DINNER',
        householdId: household.id,
        recipeId: pastaRecipe.id,
      },
      {
        date: today,
        mealType: 'LUNCH',
        householdId: household.id,
        recipeId: saladRecipe.id,
      },
      {
        date: today,
        mealType: 'BREAKFAST',
        householdId: household.id,
        customTitle: 'Scrambled Eggs & Toast',
      },
    ],
  })

  // Grocery items
  await prisma.groceryItem.createMany({
    data: [
      { name: 'Milk', quantity: '1 gallon', category: 'Dairy', householdId: household.id, addedById: admin.id },
      { name: 'Bread', quantity: '1 loaf', category: 'Bakery', householdId: household.id, addedById: admin.id },
      { name: 'Bananas', quantity: '1 bunch', category: 'Produce', householdId: household.id, addedById: member.id },
      { name: 'Chicken Breast', quantity: '2 lbs', category: 'Meat', householdId: household.id, addedById: member.id },
      { name: 'Eggs', quantity: '1 dozen', category: 'Dairy', householdId: household.id, addedById: admin.id, checked: true },
    ],
  })

  // Messages
  await prisma.message.createMany({
    data: [
      {
        content: 'Remember: Family game night this Friday!',
        type: 'ANNOUNCEMENT',
        pinned: true,
        householdId: household.id,
        authorId: admin.id,
      },
      {
        content: 'The plumber is coming Tuesday between 2-4pm',
        type: 'NOTE',
        pinned: false,
        householdId: household.id,
        authorId: member.id,
      },
      {
        content: 'Should we plan a weekend camping trip next month?',
        type: 'DISCUSSION_TOPIC',
        pinned: false,
        householdId: household.id,
        authorId: admin.id,
      },
    ],
  })

  // Budget categories
  const groceryCat = await prisma.budgetCategory.create({
    data: { name: 'Groceries', monthlyLimit: 800, color: '#059669', householdId: household.id },
  })

  const utilitiesCat = await prisma.budgetCategory.create({
    data: { name: 'Utilities', monthlyLimit: 300, color: '#3B82F6', householdId: household.id },
  })

  const entertainmentCat = await prisma.budgetCategory.create({
    data: { name: 'Entertainment', monthlyLimit: 200, color: '#8B5CF6', householdId: household.id },
  })

  // Expenses
  await prisma.expense.createMany({
    data: [
      { amount: 142.50, description: 'Weekly grocery run', date: today, householdId: household.id, categoryId: groceryCat.id, memberId: admin.id },
      { amount: 85.00, description: 'Electric bill', date: today, householdId: household.id, categoryId: utilitiesCat.id, memberId: admin.id },
      { amount: 45.99, description: 'Movie tickets', date: today, householdId: household.id, categoryId: entertainmentCat.id, memberId: member.id },
      { amount: 67.25, description: 'Midweek grocery top-up', date: today, householdId: household.id, categoryId: groceryCat.id, memberId: member.id },
    ],
  })

  // Child allowance
  await prisma.allowance.create({
    data: {
      amount: 15.00,
      frequency: 'WEEKLY',
      balance: 30.00,
      memberId: child.id,
    },
  })

  // Vault items
  await prisma.vaultItem.create({
    data: {
      title: 'Home Insurance Policy',
      content: 'Policy #INS-2024-5678\nProvider: SafeHome Insurance\nCoverage: $500,000\nDeductible: $1,000\nRenewal: March 2025',
      category: 'Insurance',
      restricted: true,
      householdId: household.id,
    },
  })

  await prisma.vaultItem.create({
    data: {
      title: 'WiFi Password',
      content: 'Network: SmithFamily5G\nPassword: SecurePass2024!',
      category: 'Home',
      restricted: false,
      householdId: household.id,
    },
  })

  // Pets
  const dog = await prisma.pet.create({
    data: {
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      birthday: new Date('2021-03-15'),
      weight: 72.5,
      householdId: household.id,
    },
  })

  const cat = await prisma.pet.create({
    data: {
      name: 'Whiskers',
      species: 'Cat',
      breed: 'Tabby',
      birthday: new Date('2022-08-01'),
      weight: 10.2,
      householdId: household.id,
    },
  })

  // Pet care tasks
  const walkTask = await prisma.petCareTask.create({
    data: {
      type: 'WALK',
      title: 'Morning Walk',
      schedule: { time: '07:00', frequency: 'daily' },
      petId: dog.id,
      defaultMemberId: admin.id,
    },
  })

  await prisma.petCareTask.create({
    data: {
      type: 'FEEDING',
      title: 'Breakfast',
      schedule: { time: '07:30', frequency: 'daily' },
      petId: dog.id,
      defaultMemberId: child.id,
    },
  })

  await prisma.petCareTask.create({
    data: {
      type: 'FEEDING',
      title: 'Morning Feeding',
      schedule: { time: '08:00', frequency: 'daily' },
      petId: cat.id,
      defaultMemberId: member.id,
    },
  })

  // Pet care log
  await prisma.petCareLog.create({
    data: {
      taskId: walkTask.id,
      memberId: admin.id,
      notes: 'Great walk in the park, 30 min',
      durationMin: 30,
    },
  })

  // Pet health records
  await prisma.petHealthRecord.create({
    data: {
      type: 'VACCINE',
      title: 'Rabies Vaccine',
      date: new Date('2024-06-15'),
      notes: 'Annual rabies booster. Next due June 2025.',
      petId: dog.id,
    },
  })

  await prisma.petHealthRecord.create({
    data: {
      type: 'VET_VISIT',
      title: 'Annual Checkup',
      date: new Date('2024-09-01'),
      notes: 'All clear. Healthy weight.',
      petId: cat.id,
    },
  })

  console.log('Seed complete!')
  console.log(`  Household: ${household.name}`)
  console.log(`  Members: ${admin.name}, ${member.name}, ${child.name}`)
  console.log(`  Pets: ${dog.name} (${dog.species}), ${cat.name} (${cat.species})`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
