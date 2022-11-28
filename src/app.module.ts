import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigModule } from './config/app/app.config.module';
import { AppConfigService } from './config/app/app.config.service';
import { ItemsModule } from './models/items/items.module';
import { TransferModule } from './models/transfer/transfer.module';
import { JsonRpcConnectorModule } from './services/connectors/jsonRpc/json-rpc.connector.module';

@Module({
  imports: [
    AppConfigModule,
    JsonRpcConnectorModule.forRootAsync({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [], // AppConfigModule is available globaly once imported in App.module
      inject: [AppConfigService],
      useFactory: (cs: AppConfigService) => ({ uri: cs.MONGODB_URI }),
    }),
    ItemsModule,
    TransferModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      //whitelist true means that extra props (not included in DTOs) are removed from body/params before reaching our controllers
      useValue: new ValidationPipe({ whitelist: true }),
    },
  ],
})
export class AppModule {}
