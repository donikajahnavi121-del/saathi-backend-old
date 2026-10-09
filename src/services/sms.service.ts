import { logger } from '../utils/logger.js';
import { maskPhoneNumber } from '../utils/crypto.js';

export interface ISmsProvider {
  readonly providerName: string;
  sendSms(to: string, message: string): Promise<boolean>;
}

export class ConsoleSmsProvider implements ISmsProvider {
  public readonly providerName = 'ConsoleMock';

  async sendSms(to: string, message: string): Promise<boolean> {
    logger.info(
      {
        provider: this.providerName,
        recipient: maskPhoneNumber(to),
        messagePreview: message,
      },
      'Dispatched Neutral SMS Reminder'
    );
    return true;
  }
}

// Pluggable SMS gateway instance
let activeSmsProvider: ISmsProvider = new ConsoleSmsProvider();

export function setSmsProvider(provider: ISmsProvider): void {
  activeSmsProvider = provider;
}

export function getSmsProvider(): ISmsProvider {
  return activeSmsProvider;
}

/**
 * Sends a neutral reminder to the patient.
 * Hard Privacy Rule: Neutral text only. No names, no disease, no drug names!
 */
export async function sendNeutralDailyReminder(phoneNumber: string): Promise<boolean> {
  const neutralMessage = 'Saathi: your daily check-in is ready.';
  return activeSmsProvider.sendSms(phoneNumber, neutralMessage);
}
