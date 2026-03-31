import { ApiProperty } from '@nestjs/swagger';

export class CreditSimulationResponse {
  @ApiProperty({ example: 10000 })
  requestedAmount!: number;

  @ApiProperty({ example: 24 })
  installmentCount!: number;

  @ApiProperty({ example: 504.17 })
  monthlyInstallment!: number;

  @ApiProperty({ example: 0.021 })
  estimatedRate!: number;

  @ApiProperty({ example: 12100.08 })
  totalAmount!: number;
}
