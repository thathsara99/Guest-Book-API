import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        title: 'Guest Book',
        description: 'API documentation',
    },
    host: '107.172.143.48:5500',
    basePath: "/api",
    schemes: ['http', 'https'],

    consumes: ['application/json'],
    produces: ['application/json'],

    securityDefinitions: {
        bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description: 'JWT token'
        },
    },
    security: [
        { bearerAuth: [] }
    ]
};

const outputFile = './swagger_output.json';
const endpointsFiles = ['./routes/index.js'];

swaggerAutogen({ openapi: '3.0.0' })(outputFile, endpointsFiles, doc);


