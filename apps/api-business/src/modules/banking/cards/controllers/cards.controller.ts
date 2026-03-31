import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantContextService } from '../../../../common/tenancy/tenant-context.service';
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
  constructor(
    private readonly cardsService: CardsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lists customer cards.' })
  @ApiOkResponse({ type: CardResponse, isArray: true })
  listCards(@Headers('x-tenant-id') tenantIdHeader?: string) {
    return this.cardsService.listCards(
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Gets a card by identifier.' })
  @ApiOkResponse({ type: CardResponse })
  getCardById(
    @Param('id') cardId: string,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.cardsService.getCardById(
      cardId,
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }

  @Get(':id/limit')
  @ApiOperation({ summary: 'Gets card limits.' })
  @ApiOkResponse({ type: CardLimitResponse })
  getCardLimit(
    @Param('id') cardId: string,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.cardsService.getCardLimit(
      cardId,
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }

  @Get(':id/invoice')
  @ApiOperation({ summary: 'Gets current card invoice.' })
  @ApiOkResponse({ type: CardInvoiceResponse })
  getCardInvoice(
    @Param('id') cardId: string,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.cardsService.getCardInvoice(
      cardId,
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Blocks a card.' })
  @ApiBody({ type: BlockCardRequest })
  @ApiOkResponse({ type: CardActionResponse })
  blockCard(
    @Param('id') cardId: string,
    @Body() request: BlockCardRequest,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.cardsService.blockCard(
      cardId,
      request,
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }

  @Post(':id/unblock')
  @ApiOperation({ summary: 'Unblocks a card.' })
  @ApiBody({ type: UnblockCardRequest })
  @ApiOkResponse({ type: CardActionResponse })
  unblockCard(
    @Param('id') cardId: string,
    @Body() request: UnblockCardRequest,
    @Headers('x-tenant-id') tenantIdHeader?: string,
  ) {
    return this.cardsService.unblockCard(
      cardId,
      request,
      this.tenantContextService.resolveTenant({ headerTenantId: tenantIdHeader }),
    );
  }
}
