// packages/shared/src/transfer.ts
export interface TransferOffer {
  type: 'TRANSFER_OFFER';
  id: string;
  name: string;
  size: number;
  mimeType: string;
  totalChunks: number;
  sha256: string;
}

export interface TransferAccept { type: 'TRANSFER_ACCEPT'; id: string }
export interface TransferReject { type: 'TRANSFER_REJECT'; id: string }
export interface TransferDone   { type: 'TRANSFER_DONE';   id: string; sha256: string }
export interface TransferError  { type: 'TRANSFER_ERROR';  id: string; reason: string }
export interface TextMessage    { type: 'TEXT_MESSAGE';    id: string; content: string; timestamp: number }

export type TransferMessage =
  | TransferOffer | TransferAccept | TransferReject
  | TransferDone  | TransferError  | TextMessage;
