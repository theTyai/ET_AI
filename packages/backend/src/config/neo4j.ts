import neo4j, { Driver, Session } from 'neo4j-driver';
import { env } from './env';

let driver: Driver | null = null;

export const initNeo4j = (): Driver => {
  if (!driver) {
    try {
      driver = neo4j.driver(
        env.NEO4J_URI,
        neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD),
        {
          disableLosslessIntegers: true,
          // Explicitly disable TLS for bolt:// URIs to avoid
          // "compatible encryption settings" warning when Neo4j is offline or local
          encrypted: false,
          trust: 'TRUST_ALL_CERTIFICATES',
          connectionAcquisitionTimeout: 3000,
          connectionTimeout: 3000,
          maxConnectionLifetime: 3 * 60 * 1000,
        }
      );
      console.log('✅ Neo4j Graph DB Driver Initialized (graceful-fallback mode)');
    } catch (error) {
      console.warn('⚠️ Neo4j Driver could not be initialized — graph features will use mock data:', (error as Error).message);
      // Do NOT rethrow — allow server to start without Neo4j
    }
  }
  return driver as Driver;
};

export const getNeo4jDriver = (): Driver => {
  if (!driver) {
    initNeo4j();
  }
  if (!driver) {
    throw new Error('Neo4j is offline — falling back to mock data');
  }
  return driver;
};

export const getNeo4jSession = (database?: string): Session => {
  const drv = getNeo4jDriver();
  return drv.session({ database: database || 'neo4j' });
};

export const closeNeo4j = async (): Promise<void> => {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('🔒 Neo4j Driver closed');
  }
};
