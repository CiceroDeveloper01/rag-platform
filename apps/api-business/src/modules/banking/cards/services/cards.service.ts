import { Injectable, NotFoundException } from '@nestjs/common';
import { BlockCardRequest } from '../dtos/request/block-card.request';
import { UnblockCardRequest } from '../dtos/request/unblock-card.request';
import { CardActionResponse } from '../dtos/response/card-action.response';
import { CardInvoiceResponse } from '../dtos/response/card-invoice.response';
import { CardLimitResponse } from '../dtos/response/card-limit.response';
import { CardResponse } from '../dtos/response/card.response';
import { CardRecord } from '../interfaces/card-record.interface';

@Injectable()
export class CardsService {
  private readonly cards: CardRecord[] = [
    {
      id: 'card-001',
      brand: 'Visa Infinite',
      last4: '4432',
      status: 'ACTIVE',
      holderName: 'Ada Lovelace',
      totalLimit: 25000,
      availableLimit: 18000,
      usedLimit: 7000,
      invoiceDueDate: '2026-04-10',
      invoiceAmount: 1280.44,
      minimumPayment: 320.11,
    },
    {
      id: 'card-002',
      brand: 'Mastercard Black',
      last4: '8841',
      status: 'BLOCKED',
      holderName: 'Ada Lovelace',
      totalLimit: 18000,
      availableLimit: 18000,
      usedLimit: 0,
      invoiceDueDate: '2026-04-15',
      invoiceAmount: 0,
      minimumPayment: 0,
    },
  ];

  listCards(_tenantId = 'default-tenant'): CardResponse[] {
    return this.cards.map((card) => this.toCardResponse(card));
  }

  getCardById(cardId: string, _tenantId = 'default-tenant'): CardResponse {
    return this.toCardResponse(this.findCard(cardId));
  }

  getCardLimit(cardId: string, _tenantId = 'default-tenant'): CardLimitResponse {
    const card = this.findCard(cardId);

    return {
      cardId: card.id,
      totalLimit: card.totalLimit,
      availableLimit: card.availableLimit,
      usedLimit: card.usedLimit,
    };
  }

  getCardInvoice(
    cardId: string,
    _tenantId = 'default-tenant',
  ): CardInvoiceResponse {
    const card = this.findCard(cardId);

    return {
      cardId: card.id,
      dueDate: card.invoiceDueDate,
      amount: card.invoiceAmount,
      minimumPayment: card.minimumPayment,
    };
  }

  blockCard(
    cardId: string,
    request: BlockCardRequest,
    _tenantId = 'default-tenant',
  ): CardActionResponse {
    const card = this.findCard(cardId);
    card.status = 'BLOCKED';

    return {
      cardId: card.id,
      action: 'block',
      status: 'completed',
      message: `Card block request processed successfully${request.reason ? ` for reason ${request.reason}` : ''}.`,
    };
  }

  unblockCard(
    cardId: string,
    request: UnblockCardRequest,
    _tenantId = 'default-tenant',
  ): CardActionResponse {
    const card = this.findCard(cardId);
    card.status = 'ACTIVE';

    return {
      cardId: card.id,
      action: 'unblock',
      status: 'completed',
      message: `Card unblock request processed successfully${request.reason ? ` for reason ${request.reason}` : ''}.`,
    };
  }

  private findCard(cardId: string): CardRecord {
    const card = this.cards.find((entry) => entry.id === cardId);
    if (!card) {
      throw new NotFoundException(`Card ${cardId} was not found`);
    }

    return card;
  }

  private toCardResponse(card: CardRecord): CardResponse {
    return {
      id: card.id,
      brand: card.brand,
      last4: card.last4,
      status: card.status,
      holderName: card.holderName,
    };
  }
}
