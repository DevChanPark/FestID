import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const PROOF_STATUS_VALUES = ['approved', 'rejected'] as const;
const ADMIN_VC_ROLES = ['festival_admin', 'super_admin'] as const;

export type ApprovedAdminRole = (typeof ADMIN_VC_ROLES)[number];

export class UpdateAdminProofStatusDto {
  @ApiProperty({ enum: PROOF_STATUS_VALUES })
  @IsIn(PROOF_STATUS_VALUES)
  proofStatus: 'approved' | 'rejected';

  @ApiPropertyOptional({
    enum: ADMIN_VC_ROLES,
    description: 'Admin VC role to issue when proofStatus is approved.',
  })
  @IsOptional()
  @IsIn(ADMIN_VC_ROLES)
  adminRole?: ApprovedAdminRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectionReason?: string;
}
