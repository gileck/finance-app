const isProduction = process.env.NODE_ENV === 'production';

export const appConfig = {
    appName: 'Finance App',
    cacheType: isProduction ? 's3' : 's3'
};
