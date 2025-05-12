import * as net from 'net';
import { LoggerService } from './common/services/logger.service';
import { FlowTrackerService } from './common/services/flow-tracker.service';

// Servisleri başlat
const logger = LoggerService.getInstance();
const flowTracker = FlowTrackerService.getInstance();

/**
 * Port kullanılabilirliğini kontrol eder
 * @param port Kontrol edilecek port numarası
 * @returns Port kullanılabilir ise true, değilse false
 */
export function isPortAvailable(port: number): Promise<boolean> {
  flowTracker.trackStep(
    `${port} portu kullanılabilirlik kontrolü başladı`,
    'checkPort',
  );

  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        flowTracker.trackStep(`${port} portu kullanımda`, 'checkPort');
        logger.info(
          `Port ${port} kullanımda`,
          'checkPort.isPortAvailable',
          __filename,
          undefined,
          { port, error: err.code },
        );
        resolve(false);
      } else {
        flowTracker.trackStep(
          `${port} portu kontrol hatası: ${err.code}`,
          'checkPort',
        );
        logger.error(
          `Port kontrol hatası`,
          'checkPort.isPortAvailable',
          __filename,
          undefined,
          err,
          { port },
        );
        resolve(true);
      }
    });

    server.once('listening', () => {
      server.close();
      flowTracker.trackStep(`${port} portu kullanılabilir`, 'checkPort');
      resolve(true);
    });

    server.listen(port);
  });
}

/**
 * Kullanılabilir bir port bulur
 * @param startPort Başlangıç port numarası
 * @param endPort Bitiş port numarası (opsiyonel, varsayılan startPort + 100)
 * @returns Kullanılabilir ilk port numarası veya null
 */
export async function findAvailablePort(
  startPort: number,
  endPort: number = startPort + 100,
): Promise<number | null> {
  flowTracker.trackStep(
    `${startPort}-${endPort} arasında kullanılabilir port aranıyor`,
    'checkPort',
  );

  for (let port = startPort; port <= endPort; port++) {
    if (await isPortAvailable(port)) {
      flowTracker.trackStep(
        `Kullanılabilir port bulundu: ${port}`,
        'checkPort',
      );
      logger.info(
        `Kullanılabilir port bulundu`,
        'checkPort.findAvailablePort',
        __filename,
        undefined,
        { port, startPort, endPort },
      );
      return port;
    }
  }

  flowTracker.trackStep(
    `${startPort}-${endPort} arasında kullanılabilir port bulunamadı`,
    'checkPort',
  );

  logger.warn(
    `Kullanılabilir port bulunamadı`,
    'checkPort.findAvailablePort',
    __filename,
    undefined,
    { startPort, endPort },
  );

  return null;
}

// Bu dosya doğrudan çalıştırılırsa test amaçlı olarak portları kontrol et
if (require.main === module) {
  const testPort = 3001;

  void (async () => {
    flowTracker.track('Port kontrol testi başlatılıyor...', 'checkPort');

    console.log(`${testPort} portu kullanılabilirlik kontrolü yapılıyor...`);
    const isAvailable = await isPortAvailable(testPort);

    if (isAvailable) {
      console.log(`${testPort} portu kullanılabilir.`);
    } else {
      console.log(`${testPort} portu kullanımda.`);
      const availablePort = await findAvailablePort(testPort);

      if (availablePort) {
        console.log(`Kullanılabilir port bulundu: ${availablePort}`);
      } else {
        console.log(
          `${testPort}-${testPort + 100} arasında kullanılabilir port bulunamadı.`,
        );

        logger.error(
          'Kullanılabilir port bulunamadı',
          'checkPort',
          __filename,
          undefined,
          new Error('Kullanılabilir port bulunamadı'),
          { testPort, range: `${testPort}-${testPort + 100}` },
        );
      }
    }

    flowTracker.track('Port kontrol testi tamamlandı', 'checkPort');
  })();
}
