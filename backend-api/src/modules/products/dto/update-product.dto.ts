import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * 更新产品 DTO
 */
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['categoryId'] as const),
) {
  categoryId?: number;
}
