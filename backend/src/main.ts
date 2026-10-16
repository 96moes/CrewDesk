// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { UsersService } from './users/users.service';
import { UserRole } from './users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import basicAuth from 'express-basic-auth';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get<ConfigService>(ConfigService);

  // CORS
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:5173',
  ) as string;
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Seed admin using UsersService
  const seedAdmin =
    (configService.get<string>('SEED_ADMIN', 'true') as string) === 'true';
  if (seedAdmin) {
    const usersService = app.get(UsersService);
    const username = configService.get<string>(
      'ADMIN_USERNAME',
      'admin',
    ) as string;
    const password = configService.get<string>(
      'ADMIN_PASSWORD',
      'admin',
    ) as string;
    // ADMIN_ROLE accepts any UserRole, but the seeded account is the only one that can manage
    // other accounts, so only an ADMIN seed can hand out the other roles afterwards.
    const role = configService.get<string>(
      'ADMIN_ROLE',
      UserRole.ADMIN,
    ) as UserRole;

    try {
      await usersService.create({ username, password, role });
      console.log('Admin user seeded');
    } catch (error) {
      if (error instanceof Error) {
        console.debug('Admin seeding failed:', error.message);
      } else {
        console.debug('Admin seeding failed with non-Error:', error);
      }
    }
  }

  // app.use(
  //   ['/docs', '/docs-json'],
  //   basicAuth({
  //     challenge: true,
  //     users: {
  //       [configService.get<string>('SWAGGER_USER', 'admin') as string]:
  //         configService.get<string>('SWAGGER_PASSWORD', 'admin') as string,
  //     },
  //   }),
  // );

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>('PORT', 3000) as number;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
}

void bootstrap();
