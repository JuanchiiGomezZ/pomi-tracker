import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.initialize();
  }

  /**
   * Initialize Firebase Admin SDK
   * Only initializes once, even if called multiple times
   */
  private initialize(): void {
    if (this.initialized || admin.apps.length > 0) {
      return;
    }

    const projectId = this.configService.get<string>('firebase.projectId');
    const clientEmail = this.configService.get<string>('firebase.clientEmail');
    const privateKey = this.configService.get<string>('firebase.privateKey');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase credentials not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env',
      );
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });

      this.initialized = true;
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
      throw error;
    }
  }

  /**
   * Verify a Firebase ID token
   * @param idToken - The Firebase ID token from the client
   * @returns The decoded token payload
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.initialized) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      this.logger.error('Failed to verify Firebase ID token', error);
      throw error;
    }
  }

  /**
   * Get user by Firebase UID
   * @param uid - The Firebase user ID
   * @returns The Firebase user record
   */
  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    if (!this.initialized) {
      throw new Error('Firebase Admin SDK not initialized');
    }

    try {
      return await admin.auth().getUser(uid);
    } catch (error) {
      this.logger.error(`Failed to get Firebase user: ${uid}`, error);
      throw error;
    }
  }

  /**
   * Check if Firebase is properly initialized
   */
  isReady(): boolean {
    return this.initialized;
  }
}
