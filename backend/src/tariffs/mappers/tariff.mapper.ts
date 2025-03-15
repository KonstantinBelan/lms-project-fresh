import { Types } from 'mongoose';
import { Tariff, TariffDocument } from '../schemas/tariff.schema';
import { TariffResponseDto } from '../dto/tariff-response.dto';

/**
 * Преобразует объект тарифа (Tariff или TariffDocument) в TariffResponseDto.
 * @param tariff - Объект тарифа (plain объект или документ Mongoose)
 * @returns Объект TariffResponseDto
 */
export function mapToTariffResponseDto(
  tariff: Tariff | TariffDocument,
): TariffResponseDto {
  const tariffObj = tariff as any; // Приводим к any для работы с plain объектом
  return {
    _id:
      tariffObj._id instanceof Types.ObjectId
        ? tariffObj._id.toString()
        : String(tariffObj._id),
    courseId:
      tariffObj.courseId instanceof Types.ObjectId
        ? tariffObj.courseId.toString()
        : String(tariffObj.courseId),
    name: tariffObj.name,
    price: tariffObj.price,
    accessibleModules: (tariffObj.accessibleModules || []).map((id: any) =>
      id instanceof Types.ObjectId ? id.toString() : String(id),
    ),
    includesHomeworks: tariffObj.includesHomeworks,
    includesPoints: tariffObj.includesPoints,
  };
}
