/**
 * Seeds baseline data: an OWNER staff account and the storefront's
 * categories (Gowns, Suits, Jumpsuit, 2-piece, Summer, Collars & Ties),
 * matching the nav in "MAIN FOLDER FOR CLOTHES". Run with `npm run seed`.
 */
const { connectDB, mongoose } = require('./config/db');
const { Staff, Category } = require('./models');
const { hashPassword } = require('./utils/password');
const logger = require('./config/logger');

const CATEGORIES = [
  { name: 'Gowns', slug: 'gowns' },
  { name: 'Suits', slug: 'suits' },
  { name: 'Jumpsuit', slug: 'jumpsuit' },
  { name: '2-Piece', slug: '2-piece' },
  { name: 'Summer', slug: 'summer' },
  { name: 'Collars & Ties', slug: 'collars-ties' },
];

async function seed() {
  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPassword = process.env.OWNER_PASSWORD;
  const ownerName = process.env.OWNER_NAME || 'Store Owner';
  const ownerUsername = (process.env.OWNER_USERNAME || ownerName).trim().toLowerCase();
  const forcePasswordReset = process.env.OWNER_FORCE_PASSWORD_RESET === 'true';
  if (!ownerEmail || !ownerPassword) {
    throw new Error('Set OWNER_EMAIL and OWNER_PASSWORD before running the seed command.');
  }
  if (ownerPassword.length < (forcePasswordReset && process.env.NODE_ENV !== 'production' ? 5 : 12)) {
    throw new Error('OWNER_PASSWORD must be at least 12 characters (temporary local passwords must be at least 5).');
  }
  if (forcePasswordReset && process.env.NODE_ENV === 'production') {
    throw new Error('Do not seed a temporary password in production. Use a unique OWNER_PASSWORD of at least 12 characters.');
  }

  await connectDB();

  for (const cat of CATEGORIES) {
    await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
  }
  logger.info(`Seeded ${CATEGORIES.length} categories`);

  const existingOwner = await Staff.findOne({ email: ownerEmail });
  if (!existingOwner) {
    await Staff.create({
      name: ownerName,
      username: ownerUsername,
      email: ownerEmail,
      passwordHash: await hashPassword(ownerPassword),
      role: 'OWNER',
      mustChangePassword: forcePasswordReset,
    });
    logger.info(`Seeded owner account: ${ownerEmail}`);
  } else {
    logger.info('Owner account already exists, skipping');
  }

  await mongoose.connection.close();
  logger.info('Seed complete');
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
