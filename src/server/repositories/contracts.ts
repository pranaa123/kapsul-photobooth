export type EventStatus = "draft" | "active" | "paused" | "ended";
export type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "EXPIRED" | "FAILED" | "REFUNDED";

export interface PhotoUploadCommand {
  eventId: string;
  eventDeviceId: string;
  clientPhotoId: string;
  fileHash: string;
  idempotencyKey: string;
}

export interface PhotoRepository {
  reserveUpload(command: PhotoUploadCommand): Promise<{ photoId: string; storagePath: string }>;
  markUploaded(photoId: string, size: number, mimeType: string): Promise<void>;
}

export interface PaymentRepository {
  recordWebhook(providerEventId: string, payload: unknown, signatureValid: boolean): Promise<boolean>;
  markOrderPaid(orderId: string, paidAt: Date): Promise<void>;
}
