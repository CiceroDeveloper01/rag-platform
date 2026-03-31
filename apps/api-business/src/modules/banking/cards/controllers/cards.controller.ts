import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BlockCardRequest } from '../dtos/request/block-card.request';
import { UnblockCardRequest } from '../dtos/request/unblock-card.request';
import { CardActionResponse } from '../dtos/response/card-action.response';
import { CardInvoiceResponse } from '../dtos/response/card-invoice.response';
import { CardLimitResponse } from '../dtos/response/card-limit.response';
import { CardResponse } from '../dtos/response/card.response';
import { CardsService } from '../services/cards.service';

@ApiTags('Banking')
@Controller(['banking/cards', 'api/v1/banking/cards'])
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  @ApiOperation({ summary: 'Lists customer cards.' })
  @ApiOkResponse({ type: CardResponse, isArray: true })
  listCards() {
    return this.cardsService.listCards();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Gets a card by identifier.' })
  @ApiOkResponse({ type: CardResponse })
  getCardById(
    @Param('id') cardId: string,
  ) {
    return this.cardsService.getCardById(cardId);
  }

  @Get(':id/limit')
  @ApiOperation({ summary: 'Gets card limits.' })
  @ApiOkResponse({ type: CardLimitResponse })
  getCardLimit(
    @Param('id') cardId: string,
  ) {
    return this.cardsService.getCardLimit(cardId);
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Gets current card invoice.' })
  @ApiOkResponse({ type: CardInvoiceResponse })
  getCardInvoice(
    @Param('id') cardId: string,
  ) {
    return this.cardsService.getCardInvoice(cardId);
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Blocks a card.' })
  @ApiBody({ type: BlockCardRequest })
  @ApiOkResponse({ type: CardActionResponse })
  blockCard(
    @Param('id') cardId: string,
    @Body() request: BlockCardRequest,
  ) {
    return this.cardsService.blockCard(cardId, request);
  }

  @Post(':id/unblock')
  @ApiOperation({ summary: 'Unblocks a card.' })
  @ApiBody({ type: UnblockCardRequest })
  @ApiOkResponse({ type: CardActionResponse })
  unblockCard(
    @Param('id') cardId: string,
    @Body() request: UnblockCardRequest,
  ) {
    return this.cardsService.unblockCard(cardId, request);
  }
}
