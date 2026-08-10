import swaggerJsdoc from 'swagger-jsdoc';
import {config} from '../config/env.config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Society Management API',
      version: '1.0.0',
      description:
        'Multi-tenant Society Management REST API. Every society-specific resource is isolated by society_id, ' +
        'derived exclusively from the authenticated user — never from client input. See the README for the full ' +
        'authorization model.',
    },
    servers: [{url: config.apiPrefix, description: 'Current environment'}],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            success: {type: 'boolean', example: true},
            data: {type: 'object'},
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: {type: 'boolean', example: false},
            error: {
              type: 'object',
              properties: {
                code: {type: 'string', example: 'FORBIDDEN'},
                message: {type: 'string', example: 'You do not have permission to perform this action'},
                details: {type: 'array', items: {type: 'object'}},
              },
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {type: 'integer', example: 1},
            limit: {type: 'integer', example: 20},
            total: {type: 'integer', example: 100},
            totalPages: {type: 'integer', example: 5},
          },
        },
      },
      responses: {
        Unauthorized: {description: 'Missing or invalid access token'},
        Forbidden: {description: 'Authenticated but missing the required permission'},
        NotFound: {description: 'Resource not found or not visible to this tenant'},
        ValidationError: {description: 'Request failed schema validation'},
      },
    },
    security: [{bearerAuth: []}],
  },
  apis: ['./src/modules/**/*.controller.ts', './dist/modules/**/*.controller.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
