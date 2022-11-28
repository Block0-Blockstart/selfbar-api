import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app/app.config.service';
import { ItemsModule } from './models/items/items.module';
import { TransferModule } from './models/transfer/transfer.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn', 'debug', 'verbose'] });
  const logger = new Logger('bootstrap function');
  const config = app.get(AppConfigService);

  const port = config.API_PORT;
  const withSwagger = config.WITH_SWAGGER;

  if (withSwagger) {
    const docBuilder = new DocumentBuilder()
      .setTitle('SelfBar API')
      .setDescription('SelfBar API')
      .setVersion('0.1')
      .addTag('item')
      .addTag('transfer')
      .build();
    const doc = SwaggerModule.createDocument(app, docBuilder, { include: [ItemsModule, TransferModule] });
    SwaggerModule.setup('api', app, doc);
    logger.log('Swagger is enabled');
  } else {
    logger.log('Swagger is disabled');
  }
  await app.listen(port);
  logger.log(`App is listening on port ${port}`);
}

bootstrap();
