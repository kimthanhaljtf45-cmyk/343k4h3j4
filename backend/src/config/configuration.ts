export default () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sports_miniapp';
  console.log('🔗 Database URI:', mongoUri);
  
  return {
    port: parseInt(process.env.PORT || '8001', 10),
    mongo: {
      uri: mongoUri,
    },
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      accessExpires: process.env.JWT_ACCESS_EXPIRES || '7d',
      refreshExpires: process.env.JWT_REFRESH_EXPIRES || '30d',
    },
  };
};
