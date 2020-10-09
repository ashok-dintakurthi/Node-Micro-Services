
module.exports = {
    db: 'mongodb://localhost/micronode', //localhost
    mongoDBOptions: {
        retryWrites: true,
    },
    securityToken: 'microNode', // will be used for the generation of the User Token

    host: "localhost:9000",
    serverPort: '9000',
    tokenExpiry: 361440, // In seconds(equal to 1 day)
    rootUrl: 'http://localhost:9000',

    defaultEmailId: '',

    tokenExpirationTime: 540, // minutes
    forgotTokenExpireTime: 60, // minutes
    verificationTokenExpireTime: 60, // minutes
};
