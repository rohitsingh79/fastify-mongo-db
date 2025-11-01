import fp from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';

const swagger = fp(async (fastify) => {
  fastify.register(fastifySwagger, {
    swagger: {
      swagger: '2.0', 
      info: {
        title: 'Feedback API',
        description: 'API for collecting and managing user feedback',
        version: '1.0.0'
      },
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header'
        }
      }
    }
  });

  fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    }
  });
});

export default swagger;
