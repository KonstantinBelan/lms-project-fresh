import { CacheModuleOptions } from '@nestjs/cache-manager';

export const cacheManagerConfig: CacheModuleOptions = {
  isGlobal: true, // Делаем кэш глобальным
  ttl: 3600, // Время жизни кэша (в секундах, 1 час)
  max: 1000, // Максимальное количество записей в кэше
};
