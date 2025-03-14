// src/streams/mappers/stream.mapper.ts
import { Types } from 'mongoose';
import { Stream, StreamDocument } from '../schemas/stream.schema';
import { StreamResponseDto } from '../dto/stream-response.dto';

/**
 * Преобразует Stream или StreamDocument в StreamResponseDto.
 * @param stream - Объект потока (plain объект или документ Mongoose)
 * @returns Объект StreamResponseDto
 */
export function mapToStreamResponseDto(
  stream: Stream | StreamDocument,
): StreamResponseDto {
  const streamObj = stream as any; // Приводим к any для работы с plain объектом
  return {
    _id:
      streamObj._id instanceof Types.ObjectId
        ? streamObj._id.toString()
        : String(streamObj._id),
    courseId:
      streamObj.courseId instanceof Types.ObjectId
        ? streamObj.courseId.toString()
        : String(streamObj.courseId),
    name: streamObj.name,
    startDate:
      streamObj.startDate instanceof Date
        ? streamObj.startDate.toISOString()
        : String(streamObj.startDate),
    endDate:
      streamObj.endDate instanceof Date
        ? streamObj.endDate.toISOString()
        : String(streamObj.endDate),
    students: (streamObj.students || []).map((id: any) =>
      id instanceof Types.ObjectId ? id.toString() : String(id),
    ),
  };
}
