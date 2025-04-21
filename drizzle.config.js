export default {
    dialect: "postgresql",
    schema: "./src/utils/db/schema.ts",
    out: "./drizzle",
    dbCredentials: {
      url: "postgresql://neondb_owner:npg_T7Gw2nltQfSD@ep-tiny-grass-a15mn2xa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
      connectionString:
        "postgresql://neondb_owner:npg_T7Gw2nltQfSD@ep-tiny-grass-a15mn2xa-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
    },
  };
  