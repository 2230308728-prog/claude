import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/**
 * 更新产品分类 DTO
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
